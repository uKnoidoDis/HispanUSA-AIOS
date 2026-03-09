import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendSMS } from '@/lib/twilio';
import { sendEmail } from '@/lib/resend';
import { addThirtyMinutes } from '@/lib/availability-utils';

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

  // Send rejection message to client
  const lang        = appt.language as 'en' | 'es';
  const phone       = appt.client_phone as string;
  const email       = appt.client_email as string | null;
  const officePhone = '954-934-0194';

  const smsBody = lang === 'es'
    ? `Lamentamos informarle que el horario solicitado no está disponible. Por favor llame a HispanUSA al ${officePhone} para reprogramar su cita.`
    : `We're sorry, your requested appointment time is unavailable. Please call HispanUSA at ${officePhone} to schedule.`;

  const smsResult   = { sent: false, error: null as string | null };
  const emailResult = { sent: false, error: null as string | null };

  try {
    await sendSMS(phone, smsBody);
    smsResult.sent = true;
  } catch (e: unknown) {
    smsResult.error = e instanceof Error ? e.message : 'SMS failed';
  }

  if (email) {
    const subject = lang === 'es'
      ? 'Solicitud de Cita — HispanUSA'
      : 'Appointment Request — HispanUSA';

    const html = lang === 'es'
      ? `<p>Estimado/a ${appt.client_name},</p>
         <p>Lamentamos informarle que el horario solicitado no está disponible en este momento.</p>
         <p>Por favor llámenos al <strong>${officePhone}</strong> para coordinar una nueva cita.</p>
         <p>— HispanUSA Accounting &amp; Tax Services</p>`
      : `<p>Dear ${appt.client_name},</p>
         <p>Unfortunately your requested appointment time is unavailable.</p>
         <p>Please call us at <strong>${officePhone}</strong> to schedule a new appointment.</p>
         <p>— HispanUSA Accounting &amp; Tax Services</p>`;

    try {
      await sendEmail({ to: email, subject, html });
      emailResult.sent = true;
    } catch (e: unknown) {
      emailResult.error = e instanceof Error ? e.message : 'Email failed';
    }
  }

  return NextResponse.json({ appointment: updated, sms: smsResult, email: emailResult });
}
