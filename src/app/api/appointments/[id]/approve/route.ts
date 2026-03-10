import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendConfirmationMessage, sendChecklistMessage, type MessagingAppt } from '@/lib/messaging';

// POST /api/appointments/[id]/approve
// Sets status = confirmed, then sends:
//   - auto_send_checklist = true  → sendChecklistMessage (checklist + appt info)
//   - auto_send_checklist = false → sendConfirmationMessage (appt info only)

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

  // Update status → confirmed
  const { data: updated, error: updateErr } = await supabase
    .from('appointments')
    .update({ status: 'confirmed' })
    .eq('id', params.id)
    .select('*, preparer:preparers(id, name, color_hex)')
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Build messaging appt
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

  // Send messages based on auto_send_checklist setting
  let msgResult;
  if (messagingAppt.auto_send_checklist) {
    msgResult = await sendChecklistMessage(messagingAppt, supabase);
  } else {
    msgResult = await sendConfirmationMessage(messagingAppt, supabase, 'approval');
  }

  return NextResponse.json({
    appointment: updated,
    sms: msgResult.sms,
    email: msgResult.email,
  });
}
