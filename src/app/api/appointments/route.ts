import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/utils';
import { addThirtyMinutes, slotStartTimesFor, endTimeFor, includesCorporate } from '@/lib/availability-utils';
import { sendConfirmationMessage, sendChecklistMessage, type MessagingAppt } from '@/lib/messaging';

// ─── Validation ────────────────────────────────────────────────────────────────

const createAppointmentSchema = z.object({
  client_name:      z.string().min(1, 'Client name required'),
  client_phone:     z.string().min(7, 'Valid phone required'),
  client_email:     z.string().email().optional().nullable(),
  company_name:     z.string().trim().max(200).optional().nullable(), // optional for staff (warn-don't-block in the modal)
  appointment_type: z.enum(['personal_tax', 'corporate_tax', 'personal_corporate_tax', 'professional_services']),
  service_subtype:  z.enum([
    'immigration_consulting', 'immigration_case',
    'divorce_consulting', 'divorce_case',
    'bankruptcy_consulting', 'bankruptcy_case',
    'offer_in_compromise_consulting', 'offer_in_compromise_case',
    'general_consulting', 'other',
  ]).optional().nullable(),
  service_subtype_other: z.string().trim().max(500).optional().nullable(),
  preparer_id:      z.string().uuid('Invalid preparer'),
  date:             z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  start_time:       z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM or HH:MM:SS'),
  language:             z.enum(['en', 'es']).default('es'),
  notes:                z.string().optional().nullable(),
  auto_send_checklist:  z.boolean().optional(),
}).refine(
  data => data.appointment_type !== 'professional_services' || !!data.service_subtype,
  { message: 'service_subtype is required for professional_services' }
).refine(
  data => data.service_subtype !== 'other' || !!data.service_subtype_other?.trim(),
  { message: 'service_subtype_other is required when service_subtype is other' }
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

  // Slot count + end_time come from slotsForType() (single source of truth):
  // personal_corporate_tax = 3 slots / 90 min, corporate_tax = 2 / 60, else 1 / 30.
  const endTime = endTimeFor(startTime, input.appointment_type);
  const slotStartTimes = slotStartTimesFor(startTime, input.appointment_type);

  // Step 1: Occupancy guard — every target slot must be free BEFORE any write.
  // A slot conflicts only if it EXISTS and is already booked (held by another
  // appointment). Missing slots are fine — staff bookings may override-create
  // them. Mirrors the reassign/reschedule guard in [id]/route.ts; previously
  // this route fetched is_booked but never checked it (could double-book).
  for (const slotStart of slotStartTimes) {
    const { data: target } = await supabase
      .from('availability_slots')
      .select('id, is_booked')
      .eq('preparer_id', input.preparer_id)
      .eq('date', input.date)
      .eq('start_time', slotStart)
      .maybeSingle();

    if (target && (target.is_booked as boolean)) {
      return NextResponse.json(
        { error: 'That time is already booked for this preparer. Please choose another time.' },
        { status: 409 }
      );
    }
  }

  // Frees target slots this request has CLAIMED so far — rolls back partial
  // work so a failed booking never leaves orphaned is_booked=true slots with
  // no appointment behind them (the client book route's proven rollback
  // pattern). Scoped to claimed slots only: under migration 012's unique
  // constraint a create-race loser must NOT free the slot the winning request
  // just claimed, so the old free-all-targets version is no longer safe.
  const claimedStarts: string[] = [];
  const rollbackSlots = async () => {
    for (const slotStart of claimedStarts) {
      await supabase
        .from('availability_slots')
        .update({ is_booked: false })
        .eq('preparer_id', input.preparer_id)
        .eq('date', input.date)
        .eq('start_time', slotStart);
    }
  };

  // Step 2: Book availability slots (create override slot if none exists)
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
      if (error) {
        await rollbackSlots();
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
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
      if (error) {
        await rollbackSlots();
        // Under migration 012's unique constraint, a lost create-race surfaces
        // as 23505 — that's an occupancy conflict, not a server error.
        if (error.code === '23505') {
          return NextResponse.json(
            { error: 'That time is already booked for this preparer. Please choose another time.' },
            { status: 409 }
          );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    claimedStarts.push(slotStart);
  }

  // Step 3: Create appointment — status = confirmed immediately (staff booking)
  const phone = normalizePhone(input.client_phone);
  const autoSendChecklist = input.auto_send_checklist ?? (input.appointment_type !== 'professional_services');

  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .insert({
      preparer_id:          input.preparer_id,
      client_name:          input.client_name,
      client_phone:         phone,
      client_email:         input.client_email ?? null,
      company_name:         includesCorporate(input.appointment_type)
        ? (input.company_name?.trim() || null)
        : null,
      appointment_type:     input.appointment_type,
      service_subtype:      input.service_subtype ?? null,
      service_subtype_other: input.service_subtype === 'other'
        ? (input.service_subtype_other?.trim() || null)
        : null,
      date:                 input.date,
      start_time:           startTime,
      end_time:             endTime,
      status:               'confirmed',
      language:             input.language,
      booked_by:            'staff',
      notes:                input.notes ?? null,
      auto_send_checklist:  autoSendChecklist,
    })
    .select('*, preparer:preparers(id, name, color_hex, color_name)')
    .single();

  if (apptError) {
    // Roll back slot booking on appointment insert failure — without this, the
    // booked slots stay locked with no appointment behind them (the exact
    // orphan bug found on Ruth's availability grid, June 2026).
    await rollbackSlots();
    console.error('[POST /api/appointments] appointment insert failed, slots rolled back:', apptError);
    return NextResponse.json({ error: apptError.message }, { status: 500 });
  }

  // Step 4: Send confirmation messages
  const messagingAppt: MessagingAppt = {
    id:                   appointment.id,
    client_name:          appointment.client_name,
    client_phone:         appointment.client_phone,
    client_email:         appointment.client_email,
    appointment_type:     appointment.appointment_type,
    service_subtype:      appointment.service_subtype,
    date:                 appointment.date,
    start_time:           appointment.start_time,
    language:             appointment.language,
    auto_send_checklist:  autoSendChecklist,
    checklist_sent:       false,
  };

  if (autoSendChecklist) {
    // Send checklist message (includes appointment info + document list)
    await sendChecklistMessage(messagingAppt, supabase);
  } else {
    // Send appointment-only confirmation
    await sendConfirmationMessage(messagingAppt, supabase, 'confirmation');
  }

  return NextResponse.json(appointment, { status: 201 });
}
