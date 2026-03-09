import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/utils';
import { addThirtyMinutes } from '@/lib/availability-utils';

// ─── Validation ────────────────────────────────────────────────────────────────

const bookSchema = z.object({
  client_name:      z.string().min(2, 'Full name required'),
  client_phone:     z.string().min(10, 'Valid US phone required'),
  client_email:     z.string().email('Invalid email').optional().nullable(),
  appointment_type: z.enum(['personal_tax', 'corporate_tax', 'professional_services']),
  service_subtype:  z.enum([
    'divorce', 'immigration_consulting', 'general_consulting',
    'bankruptcy', 'offer_in_compromise', 'other',
  ]).optional().nullable(),
  date:             z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  start_time:       z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM or HH:MM:SS'),
  language:         z.enum(['en', 'es']).default('es'),
}).refine(
  data => data.appointment_type !== 'professional_services' || !!data.service_subtype,
  { message: 'service_subtype is required for professional_services' }
);

// ─── POST /api/appointments/book ───────────────────────────────────────────────
// Public endpoint — no authentication required.
// Creates a PENDING appointment and auto-assigns an available preparer.

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const phone = normalizePhone(input.client_phone);

  // ── Rate limit: max 5 booking requests per phone per calendar day ──────────
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('client_phone', phone)
    .eq('booked_by', 'client')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: 'Too many booking requests today. Please call our office at 954-934-0194.' },
      { status: 429 }
    );
  }

  // ── Normalize time ─────────────────────────────────────────────────────────
  const startTime = input.start_time.length === 5
    ? `${input.start_time}:00`
    : input.start_time;

  const isCorporate = input.appointment_type === 'corporate_tax';
  const endTime = isCorporate
    ? addThirtyMinutes(addThirtyMinutes(startTime))
    : addThirtyMinutes(startTime);
  const slotStartTimes = isCorporate
    ? [startTime, addThirtyMinutes(startTime)]
    : [startTime];

  // ── Validate requested date is not in the past ─────────────────────────────
  if (input.date < today) {
    return NextResponse.json({ error: 'Cannot book appointments in the past' }, { status: 400 });
  }

  // ── Find an available preparer (first one with all required slots free) ─────
  const { data: candidates, error: slotErr } = await supabase
    .from('availability_slots')
    .select('preparer_id, start_time')
    .eq('date', input.date)
    .eq('start_time', startTime)
    .eq('is_booked', false);

  if (slotErr) return NextResponse.json({ error: slotErr.message }, { status: 500 });

  let assignedPreparerId: string | null = null;

  for (const slot of (candidates ?? [])) {
    const preparerId = slot.preparer_id as string;

    if (!isCorporate) {
      assignedPreparerId = preparerId;
      break;
    }

    // For corporate, also verify the second consecutive slot is free
    const { data: secondSlot } = await supabase
      .from('availability_slots')
      .select('id')
      .eq('preparer_id', preparerId)
      .eq('date', input.date)
      .eq('start_time', addThirtyMinutes(startTime))
      .eq('is_booked', false)
      .maybeSingle();

    if (secondSlot) {
      assignedPreparerId = preparerId;
      break;
    }
  }

  if (!assignedPreparerId) {
    return NextResponse.json(
      { error: 'No availability for the selected time. Please choose a different slot.' },
      { status: 409 }
    );
  }

  // ── Book the slots (mark as held while pending) ────────────────────────────
  for (const slotStart of slotStartTimes) {
    const { data: existingSlot } = await supabase
      .from('availability_slots')
      .select('id, is_booked')
      .eq('preparer_id', assignedPreparerId)
      .eq('date', input.date)
      .eq('start_time', slotStart)
      .maybeSingle();

    if (existingSlot) {
      // Double-check it's still free (race condition guard)
      if (existingSlot.is_booked) {
        return NextResponse.json(
          { error: 'This time slot was just taken. Please select another time.' },
          { status: 409 }
        );
      }
      await supabase
        .from('availability_slots')
        .update({ is_booked: true })
        .eq('id', existingSlot.id);
    } else {
      // Slot doesn't exist — create override
      await supabase
        .from('availability_slots')
        .insert({
          preparer_id: assignedPreparerId,
          date: input.date,
          start_time: slotStart,
          end_time: addThirtyMinutes(slotStart),
          is_booked: true,
        });
    }
  }

  // ── Create appointment with status = pending ────────────────────────────────
  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .insert({
      preparer_id:      assignedPreparerId,
      client_name:      input.client_name.trim(),
      client_phone:     phone,
      client_email:     input.client_email ?? null,
      appointment_type: input.appointment_type,
      service_subtype:  input.service_subtype ?? null,
      date:             input.date,
      start_time:       startTime,
      end_time:         endTime,
      status:           'pending',
      language:         input.language,
      booked_by:        'client',
      notes:            null,
    })
    .select('id, date, start_time, end_time, appointment_type, status')
    .single();

  if (apptError) {
    // Roll back slot booking on appointment insert failure
    for (const slotStart of slotStartTimes) {
      await supabase
        .from('availability_slots')
        .update({ is_booked: false })
        .eq('preparer_id', assignedPreparerId)
        .eq('date', input.date)
        .eq('start_time', slotStart);
    }
    return NextResponse.json({ error: apptError.message }, { status: 500 });
  }

  return NextResponse.json(appointment, { status: 201 });
}
