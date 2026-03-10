import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendChecklistMessage, type MessagingAppt } from '@/lib/messaging';

// POST /api/appointments/[id]/send-checklist
// Manually sends the document checklist for a confirmed appointment.
// Only available when checklist_sent = false.

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();

  const { data: appt, error: fetchErr } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', params.id)
    .single();

  if (fetchErr || !appt) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  }

  if (appt.checklist_sent) {
    return NextResponse.json({ error: 'Checklist already sent' }, { status: 409 });
  }

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
    checklist_sent:       false,
  };

  const result = await sendChecklistMessage(messagingAppt, supabase);

  return NextResponse.json({ sms: result.sms, email: result.email });
}
