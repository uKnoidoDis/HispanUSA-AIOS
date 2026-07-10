import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { addThirtyMinutes, slotStartTimesFor, endTimeFor } from '@/lib/availability-utils';
import { isBookableEastern } from '@/lib/utils';
import { sendCancellationMessage, sendRescheduleMessage, type MessagingAppt } from '@/lib/messaging';

const updateSchema = z.object({
  status:         z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  preparer_id:    z.string().uuid().optional(), // reassign to new preparer
  // Reschedule: a request carrying date and/or start_time moves the appointment.
  // end_time is NEVER client-supplied — always derived server-side via endTimeFor().
  date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  start_time:     z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM or HH:MM:SS').optional(),
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

  // ── Reschedule: when date and/or start_time is changing ─────────────────
  // Moves the appointment to new coords (optionally a new preparer in the same
  // move): free OLD slots → occupancy-check NEW → book NEW → update appointment
  // → notify client. Compensating rollback on every failure path so a partial
  // reschedule never leaves orphaned booked slots or an appt desynced from its
  // slots (same pattern as the client book route's rollback). Early-returns, so
  // the reassign/cancel paths below never run for a reschedule request.
  if (updateData.date !== undefined || updateData.start_time !== undefined) {
    const { data: current, error: fetchErr } = await supabase
      .from('appointments')
      .select('id, preparer_id, date, start_time, appointment_type, status')
      .eq('id', params.id)
      .single();

    if (fetchErr || !current) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const currentStatus = current.status as string;
    if (currentStatus === 'cancelled' || currentStatus === 'completed') {
      return NextResponse.json(
        { error: 'Only pending or confirmed appointments can be rescheduled' },
        { status: 409 }
      );
    }

    const apptType      = current.appointment_type as string;
    const oldPreparerId = current.preparer_id as string;
    const oldDate       = current.date as string;
    const oldStart      = current.start_time as string;

    const newPreparerId = updateData.preparer_id ?? oldPreparerId;
    const newDate       = updateData.date ?? oldDate;
    const rawNewStart   = updateData.start_time ?? oldStart;
    const newStart      = rawNewStart.length === 5 ? `${rawNewStart}:00` : rawNewStart;

    // No-op move (same preparer/date/time): nothing to free or book — fall
    // through to the plain field update below rather than churning slots and
    // emailing the client a "rescheduled" notice for an unchanged time.
    const isNoOpMove =
      newPreparerId === oldPreparerId && newDate === oldDate && newStart === oldStart;

    if (!isNoOpMove) {
      // Slot lists from the centralized helpers — 1/2/3 slots automatic.
      const oldStarts = slotStartTimesFor(oldStart, apptType);
      const newStarts = slotStartTimesFor(newStart, apptType);

      // Expiry guard: a reschedule can't land on a past/within-buffer time.
      if (!isBookableEastern(newDate, newStart)) {
        return NextResponse.json(
          { error: 'Cannot reschedule to a time that has already passed. Please choose a later time.' },
          { status: 400 }
        );
      }

      // Sets is_booked for the appointment's slots at given coords (loops the
      // (preparer, date, start_time) triples — used for free, book, and rollback).
      const setBooked = async (
        preparerId: string, date: string, starts: string[], booked: boolean,
      ) => {
        for (const slotStart of starts) {
          await supabase
            .from('availability_slots')
            .update({ is_booked: booked })
            .eq('preparer_id', preparerId)
            .eq('date', date)
            .eq('start_time', slotStart);
        }
      };

      // 1. Free OLD slots FIRST — so a move that overlaps its own old slots
      //    (e.g. shifting a 90-min block by 30 min, or same time on a new
      //    preparer) doesn't see its own slots as conflicts.
      await setBooked(oldPreparerId, oldDate, oldStarts, false);

      // 2. Occupancy guard: every target slot must be free. A slot conflicts
      //    only if it EXISTS and is already booked (held by another appointment).
      //    Missing slots are fine — staff reschedules may override-create them.
      for (const slotStart of newStarts) {
        const { data: target } = await supabase
          .from('availability_slots')
          .select('id, is_booked')
          .eq('preparer_id', newPreparerId)
          .eq('date', newDate)
          .eq('start_time', slotStart)
          .maybeSingle();

        if (target && (target.is_booked as boolean)) {
          // Rollback: restore the OLD slots before rejecting.
          await setBooked(oldPreparerId, oldDate, oldStarts, true);
          return NextResponse.json(
            { error: 'The new time is already booked for that preparer. Please choose another time.' },
            { status: 409 }
          );
        }
      }

      // 3. Book NEW slots (mark existing, or override-create — staff power,
      //    same as reassign and staff booking). Under migration 012's unique
      //    constraint a lost create-race surfaces as 23505 — roll back only the
      //    NEW slots THIS request claimed (never the winner's), restore OLD.
      const claimedNew: string[] = [];
      for (const slotStart of newStarts) {
        const { data: existingSlot } = await supabase
          .from('availability_slots')
          .select('id')
          .eq('preparer_id', newPreparerId)
          .eq('date', newDate)
          .eq('start_time', slotStart)
          .maybeSingle();

        if (existingSlot) {
          await supabase
            .from('availability_slots')
            .update({ is_booked: true })
            .eq('id', existingSlot.id);
        } else {
          const { error: overrideErr } = await supabase
            .from('availability_slots')
            .insert({
              preparer_id: newPreparerId,
              date: newDate,
              start_time: slotStart,
              end_time: addThirtyMinutes(slotStart),
              is_booked: true,
            });
          if (overrideErr) {
            await setBooked(newPreparerId, newDate, claimedNew, false);
            await setBooked(oldPreparerId, oldDate, oldStarts, true);
            if (overrideErr.code === '23505') {
              return NextResponse.json(
                { error: 'The new time is already booked for that preparer. Please choose another time.' },
                { status: 409 }
              );
            }
            return NextResponse.json({ error: overrideErr.message }, { status: 500 });
          }
        }
        claimedNew.push(slotStart);
      }

      // 4. Update the appointment to the new coords (+ any other fields sent).
      const { data: updated, error: updateErr } = await supabase
        .from('appointments')
        .update({
          ...updateData,
          preparer_id: newPreparerId,
          date:        newDate,
          start_time:  newStart,
          end_time:    endTimeFor(newStart, apptType),
        })
        .eq('id', params.id)
        .select('*, preparer:preparers(id, name, color_hex, color_name)')
        .single();

      if (updateErr) {
        // Rollback: free the NEW slots we just booked, restore the OLD ones.
        // (Free-new before re-book-old so overlapping moves restore correctly.)
        await setBooked(newPreparerId, newDate, newStarts, false);
        await setBooked(oldPreparerId, oldDate, oldStarts, true);
        console.error('[PATCH /api/appointments/[id]] reschedule update failed, slots rolled back:', updateErr);
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // 5. Notify client of the move (non-blocking — the reschedule is already
      //    committed; a failed send logs to `messages` but never rolls it back).
      if (updated) {
        const messagingAppt: MessagingAppt = {
          id:                  updated.id as string,
          client_name:         updated.client_name as string,
          client_phone:        updated.client_phone as string,
          client_email:        updated.client_email as string | null,
          appointment_type:    updated.appointment_type as MessagingAppt['appointment_type'],
          service_subtype:     updated.service_subtype as string | null,
          date:                updated.date as string,
          start_time:          updated.start_time as string,
          language:            updated.language as 'en' | 'es',
          auto_send_checklist: updated.auto_send_checklist as boolean,
          checklist_sent:      updated.checklist_sent as boolean,
        };
        try {
          await sendRescheduleMessage(messagingAppt, oldDate, oldStart, supabase);
        } catch (e) {
          console.error('[PATCH /api/appointments/[id]] reschedule message failed (non-blocking):', e);
        }
      }

      return NextResponse.json(updated);
    }
    // isNoOpMove: fall through to the plain update path below (date/start_time
    // in updateData equal the current values, so the update is a no-op on them).
  }

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
    // Slot count from slotsForType() — frees/books exactly N (3 for personal+corporate).
    const slotStartTimes = slotStartTimesFor(startTime, current.appointment_type as string);

    // 1. Free old preparer's slots
    for (const slotStart of slotStartTimes) {
      await supabase
        .from('availability_slots')
        .update({ is_booked: false })
        .eq('preparer_id', oldPreparerId)
        .eq('date', date)
        .eq('start_time', slotStart);
    }

    // 2a. Occupancy guard: the new preparer's slots must not already be booked
    //     by another appointment. On conflict, restore the old preparer's slots
    //     and reject — previously this booked blindly and could double-book.
    for (const slotStart of slotStartTimes) {
      const { data: target } = await supabase
        .from('availability_slots')
        .select('id, is_booked')
        .eq('preparer_id', newPreparerId)
        .eq('date', date)
        .eq('start_time', slotStart)
        .maybeSingle();

      if (target && (target.is_booked as boolean)) {
        for (const restoreStart of slotStartTimes) {
          await supabase
            .from('availability_slots')
            .update({ is_booked: true })
            .eq('preparer_id', oldPreparerId)
            .eq('date', date)
            .eq('start_time', restoreStart);
        }
        return NextResponse.json(
          { error: 'That preparer is already booked at this time. Please choose another preparer or reschedule.' },
          { status: 409 }
        );
      }
    }

    // 2b. Book new preparer's slots (create override if no slot exists).
    // 23505 = lost create-race under migration 012 — free only the slots THIS
    // reassign claimed, restore the old preparer's, and 409.
    const claimedReassign: string[] = [];
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
        const { error: overrideErr } = await supabase
          .from('availability_slots')
          .insert({
            preparer_id: newPreparerId,
            date,
            start_time: slotStart,
            end_time: addThirtyMinutes(slotStart),
            is_booked: true,
          });
        if (overrideErr) {
          for (const freeStart of claimedReassign) {
            await supabase
              .from('availability_slots')
              .update({ is_booked: false })
              .eq('preparer_id', newPreparerId)
              .eq('date', date)
              .eq('start_time', freeStart);
          }
          for (const restoreStart of slotStartTimes) {
            await supabase
              .from('availability_slots')
              .update({ is_booked: true })
              .eq('preparer_id', oldPreparerId)
              .eq('date', date)
              .eq('start_time', restoreStart);
          }
          if (overrideErr.code === '23505') {
            return NextResponse.json(
              { error: 'That preparer is already booked at this time. Please choose another preparer or reschedule.' },
              { status: 409 }
            );
          }
          return NextResponse.json({ error: overrideErr.message }, { status: 500 });
        }
      }
      claimedReassign.push(slotStart);
    }
  }

  // ── Cancel: if status is being set to cancelled, free the slots ────────
  // didCancel is true only on a real transition (non-cancelled → cancelled), so a
  // double-cancel never re-frees slots or re-notifies the client.
  let didCancel = false;
  if (updateData.status === 'cancelled') {
    const { data: current } = await supabase
      .from('appointments')
      .select('preparer_id, date, start_time, appointment_type, status')
      .eq('id', params.id)
      .single();

    if (current && (current.status as string) !== 'cancelled') {
      didCancel = true;
      // Slot count from slotsForType() — cancel frees exactly N (3 for personal+corporate),
      // so the extra slots can never be orphaned is_booked=true with no appointment.
      const slotStartTimes = slotStartTimesFor(
        current.start_time as string,
        current.appointment_type as string,
      );

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

  // ── Notify client of cancellation (non-blocking) ───────────────────────
  // The cancel + slot-free are already committed above; a failed send must NOT
  // roll that back. sendCancellationMessage logs its own outcome to `messages`
  // (status 'sent'/'failed'), so delivery is auditable there. Response stays 200.
  if (didCancel && data) {
    const messagingAppt: MessagingAppt = {
      id:                  data.id as string,
      client_name:         data.client_name as string,
      client_phone:        data.client_phone as string,
      client_email:        data.client_email as string | null,
      appointment_type:    data.appointment_type as MessagingAppt['appointment_type'],
      service_subtype:     data.service_subtype as string | null,
      date:                data.date as string,
      start_time:          data.start_time as string,
      language:            data.language as 'en' | 'es',
      auto_send_checklist: data.auto_send_checklist as boolean,
      checklist_sent:      data.checklist_sent as boolean,
    };
    try {
      await sendCancellationMessage(messagingAppt, supabase);
    } catch (e) {
      console.error('[PATCH /api/appointments/[id]] cancellation message failed (non-blocking):', e);
    }
  }

  return NextResponse.json(data);
}
