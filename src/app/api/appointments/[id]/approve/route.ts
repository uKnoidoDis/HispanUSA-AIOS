import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendSMS } from '@/lib/twilio';
import { sendEmail } from '@/lib/resend';
import { formatTime, formatDate } from '@/lib/utils';

// POST /api/appointments/[id]/approve
// Sets status = confirmed, sends a confirmation SMS/email to the client.

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

  // Send confirmation message to client
  const lang = appt.language as 'en' | 'es';
  const dateDisplay = formatDate(appt.date as string);
  const timeDisplay = formatTime(appt.start_time as string);
  const phone       = appt.client_phone as string;
  const email       = appt.client_email as string | null;
  const officePhone = '954-934-0194';

  const smsBody = lang === 'es'
    ? `Su cita en HispanUSA ha sido confirmada para el ${dateDisplay} a las ${timeDisplay}. Para reprogramar llame al ${officePhone}.`
    : `Your HispanUSA appointment is confirmed for ${dateDisplay} at ${timeDisplay}. To reschedule, call ${officePhone}.`;

  const smsResult = { sent: false, error: null as string | null };
  const emailResult = { sent: false, error: null as string | null };

  try {
    await sendSMS(phone, smsBody);
    smsResult.sent = true;
  } catch (e: unknown) {
    smsResult.error = e instanceof Error ? e.message : 'SMS failed';
  }

  if (email) {
    const subject = lang === 'es'
      ? 'Cita Confirmada — HispanUSA'
      : 'Appointment Confirmed — HispanUSA';

    const html = lang === 'es'
      ? `<p>Estimado/a ${appt.client_name},</p>
         <p>Su cita ha sido confirmada:</p>
         <ul>
           <li><strong>Fecha:</strong> ${dateDisplay}</li>
           <li><strong>Hora:</strong> ${timeDisplay}</li>
         </ul>
         <p>Recibirá una lista de documentos a traer próximamente.</p>
         <p>Para reprogramar llame al ${officePhone}.</p>
         <p>— HispanUSA Accounting &amp; Tax Services</p>`
      : `<p>Dear ${appt.client_name},</p>
         <p>Your appointment has been confirmed:</p>
         <ul>
           <li><strong>Date:</strong> ${dateDisplay}</li>
           <li><strong>Time:</strong> ${timeDisplay}</li>
         </ul>
         <p>You will receive a document checklist shortly.</p>
         <p>To reschedule, call ${officePhone}.</p>
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
