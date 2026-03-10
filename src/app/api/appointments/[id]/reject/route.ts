import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { addThirtyMinutes } from '@/lib/availability-utils';
import { sendRejectionMessage, type MessagingAppt } from '@/lib/messaging';

// POST /api/appointments/[id]/reject
// Sets status = cancelled, frees the booked slots, sends rejection SMS/email.

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();

  // Fetch appointment
  const { data: appt, error: fetchErr } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', params.id)
    .single();

  if (fetchErr || !appt) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  }

  if (appt.status !== 'pending') {
    return NextResponse.json({ error: 'Appointment is not pending' }, { status: 409 });
  }

  // Free the held slots
  const isCorporate = appt.appointment_type === 'corporate_tax';
  const startTime   = appt.start_time as string;
  const slotStarts  = isCorporate
    ? [startTime, addThirtyMinutes(startTime)]
    : [startTime];

  for (const slotStart of slotStarts) {
    await supabase
      .from('availability_slots')
      .update({ is_booked: false })
      .eq('preparer_id', appt.preparer_id as string)
      .eq('date', appt.date as string)
      .eq('start_time', slotStart);
  }

  // Update status → cancelled
  const { data: updated, error: updateErr } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', params.id)
    .select('*, preparer:preparers(id, name, color_hex)')
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Send rejection message
  const messagingAppt: MessagingAppt = {
    id:                   appt.id as string,
    client_name:          appt.client_name as string,
    client_phone:         appt.client_phone as string,
    client_email:         appt.client_email as string | null,
    appointment_type:     appt.appointment_type as MessagingAppt['appointment_type'],
    service_subtype:      appt.service_subtype as string | null,
    date:                 appt.date as string,
    start_time:           appt.start_time as string,
    language:             appt.language as 'en' | 'es',
    auto_send_checklist:  appt.auto_send_checklist as boolean,
    checklist_sent:       appt.checklist_sent as boolean,
  };

  const msgResult = await sendRejectionMessage(messagingAppt, supabase);

  return NextResponse.json({
    appointment: updated,
    sms: msgResult.sms,
    email: msgResult.email,
  });
}
