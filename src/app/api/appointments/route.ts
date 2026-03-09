import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/utils';
import { addThirtyMinutes } from '@/lib/availability-utils';

// ─── Validation ────────────────────────────────────────────────────────────────

const createAppointmentSchema = z.object({
  client_name:      z.string().min(1, 'Client name required'),
  client_phone:     z.string().min(7, 'Valid phone required'),
  client_email:     z.string().email().optional().nullable(),
  appointment_type: z.enum(['personal_tax', 'corporate_tax', 'professional_services']),
  service_subtype:  z.enum([
    'divorce', 'immigration_consulting', 'general_consulting',
    'bankruptcy', 'offer_in_compromise', 'other',
  ]).optional().nullable(),
  preparer_id:      z.string().uuid('Invalid preparer'),
  date:             z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  start_time:       z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM or HH:MM:SS'),
  language:         z.enum(['en', 'es']).default('es'),
  notes:            z.string().optional().nullable(),
}).refine(
  data => data.appointment_type !== 'professional_services' || !!data.service_subtype,
  { message: 'service_subtype is required for professional_services' }
);

// ─── GET /api/appointments ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);

  const date       = searchParams.get('date');        // single date shorthand
  const date_start = searchParams.get('date_start');
  const date_end   = searchParams.get('date_end');
  const preparer_id = searchParams.get('preparer_id');
  const status     = searchParams.get('status');
  const search     = searchParams.get('search');

  let query = supabase
    .from('appointments')
    .select('*, preparer:preparers(id, name, color_hex, color_name)')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (date) {
    query = query.eq('date', date);
  } else {
    if (date_start) query = query.gte('date', date_start);
    if (date_end)   query = query.lte('date', date_end);
  }
  if (preparer_id) query = query.eq('preparer_id', preparer_id);
  if (status)      query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let result = (data ?? []) as Record<string, unknown>[];

  if (search) {
    const lower = search.toLowerCase();
    result = result.filter(a =>
      (a.client_name as string)?.toLowerCase().includes(lower) ||
      (a.client_phone as string)?.includes(search)
    );
  }

  return NextResponse.json(result);
}

// ─── POST /api/appointments ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;

  // Normalize start_time to HH:MM:SS
  const startTime = input.start_time.length === 5
    ? `${input.start_time}:00`
    : input.start_time;

  // corporate_tax = 60 min (2 slots), everything else = 30 min (1 slot)
  const isCorporate = input.appointment_type === 'corporate_tax';
  const endTime = isCorporate
    ? addThirtyMinutes(addThirtyMinutes(startTime))
    : addThirtyMinutes(startTime);

  const slotStartTimes = isCorporate
    ? [startTime, addThirtyMinutes(startTime)]
    : [startTime];

  // Step 1: Book availability slots (create override slot if none exists)
  for (const slotStart of slotStartTimes) {
    const { data: existingSlot } = await supabase
      .from('availability_slots')
      .select('id, is_booked')
      .eq('preparer_id', input.preparer_id)
      .eq('date', input.date)
      .eq('start_time', slotStart)
      .maybeSingle();

    if (existingSlot) {
      // Slot exists — mark booked
      const { error } = await supabase
        .from('availability_slots')
        .update({ is_booked: true })
        .eq('id', existingSlot.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      // Override — create slot and mark booked in one insert
      const { error } = await supabase
        .from('availability_slots')
        .insert({
          preparer_id: input.preparer_id,
          date: input.date,
          start_time: slotStart,
          end_time: addThirtyMinutes(slotStart),
          is_booked: true,
        });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Step 2: Create appointment — status = confirmed immediately (staff booking)
  const phone = normalizePhone(input.client_phone);

  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .insert({
      preparer_id:      input.preparer_id,
      client_name:      input.client_name,
      client_phone:     phone,
      client_email:     input.client_email ?? null,
      appointment_type: input.appointment_type,
      service_subtype:  input.service_subtype ?? null,
      date:             input.date,
      start_time:       startTime,
      end_time:         endTime,
      status:           'confirmed',
      language:         input.language,
      booked_by:        'staff',
      notes:            input.notes ?? null,
    })
    .select('*, preparer:preparers(id, name, color_hex, color_name)')
    .single();

  if (apptError) return NextResponse.json({ error: apptError.message }, { status: 500 });

  return NextResponse.json(appointment, { status: 201 });
}
