import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { addThirtyMinutes } from '@/lib/availability-utils';

const updateSchema = z.object({
  status:         z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  preparer_id:    z.string().uuid().optional(), // reassign to new preparer
  notes:          z.string().optional().nullable(),
  checklist_sent: z.boolean().optional(),
  language:       z.enum(['en', 'es']).optional(),
});

// ─── GET /api/appointments/[id] ───────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      preparer:preparers(id, name, color_hex, color_name),
      messages(id, channel, message_type, status, error_message, sent_at)
    `)
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  return NextResponse.json(data);
}

// ─── PATCH /api/appointments/[id] ─────────────────────────────────────────────
// Handles: status updates, reassign (preparer_id change), notes updates.
// On reassign: frees old preparer slots, books new preparer slots (or creates override).

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updateData = parsed.data;

  // ── Reassign: when preparer_id is changing ─────────────────────────────
  if (updateData.preparer_id) {
    // Fetch current appointment to get old preparer + time info
    const { data: current, error: fetchErr } = await supabase
      .from('appointments')
      .select('id, preparer_id, date, start_time, end_time, appointment_type')
      .eq('id', params.id)
      .single();

    if (fetchErr || !current) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const oldPreparerId  = current.preparer_id as string;
    const newPreparerId  = updateData.preparer_id;
    const date           = current.date as string;
    const startTime      = current.start_time as string;
    const isCorporate    = (current.appointment_type as string) === 'corporate_tax';
    const slotStartTimes = isCorporate
      ? [startTime, addThirtyMinutes(startTime)]
      : [startTime];

    // 1. Free old preparer's slots
    for (const slotStart of slotStartTimes) {
      await supabase
        .from('availability_slots')
        .update({ is_booked: false })
        .eq('preparer_id', oldPreparerId)
        .eq('date', date)
        .eq('start_time', slotStart);
    }

    // 2. Book new preparer's slots (create override if no slot exists)
    for (const slotStart of slotStartTimes) {
      const { data: existingSlot } = await supabase
        .from('availability_slots')
        .select('id')
        .eq('preparer_id', newPreparerId)
        .eq('date', date)
        .eq('start_time', slotStart)
        .maybeSingle();

      if (existingSlot) {
        await supabase
          .from('availability_slots')
          .update({ is_booked: true })
          .eq('id', existingSlot.id);
      } else {
        await supabase
          .from('availability_slots')
          .insert({
            preparer_id: newPreparerId,
            date,
            start_time: slotStart,
            end_time: addThirtyMinutes(slotStart),
            is_booked: true,
          });
      }
    }
  }

  // ── Cancel: if status is being set to cancelled, free the slots ────────
  if (updateData.status === 'cancelled') {
    const { data: current } = await supabase
      .from('appointments')
      .select('preparer_id, date, start_time, appointment_type, status')
      .eq('id', params.id)
      .single();

    if (current && (current.status as string) !== 'cancelled') {
      const isCorporate = (current.appointment_type as string) === 'corporate_tax';
      const slotStartTimes = isCorporate
        ? [current.start_time as string, addThirtyMinutes(current.start_time as string)]
        : [current.start_time as string];

      for (const slotStart of slotStartTimes) {
        await supabase
          .from('availability_slots')
          .update({ is_booked: false })
          .eq('preparer_id', current.preparer_id as string)
          .eq('date', current.date as string)
          .eq('start_time', slotStart);
      }
    }
  }

  // ── Apply update ───────────────────────────────────────────────────────
  const { data, error } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', params.id)
    .select('*, preparer:preparers(id, name, color_hex, color_name)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
