/**
 * messaging.ts — Scheduling system messaging module
 *
 * Handles all outbound SMS (Twilio) and email (Resend) for the scheduling system.
 * Works directly with the new appointments schema (002 + 003 migrations).
 * Logs all send attempts to the `messages` table.
 *
 * NOTE: SMS will fail with Twilio error 30034 until A2P 10DLC registration
 * is approved. The code still attempts to send, logs failures, and falls back
 * to email-only delivery.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { sendSMS } from './twilio';
import { sendEmail } from './resend';
import { loadAndRenderChecklists } from './checklist-renderer';
import { formatDate, formatTime } from './utils';
import type { ChecklistType } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const OFFICE_PHONE   = '954-934-0194';
const OFFICE_ADDRESS = '8050 N University Dr Suite 206, Tamarac FL 33321';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MessagingAppt {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  appointment_type: 'personal_tax' | 'corporate_tax' | 'professional_services';
  service_subtype: string | null;
  date: string;       // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  language: 'en' | 'es';
  auto_send_checklist: boolean;
  checklist_sent: boolean;
}

export interface SendResult {
  sms:   { sent: boolean; error: string | null };
  email: { sent: boolean; error: string | null };
}

type MessageType =
  | 'confirmation'
  | 'approval'
  | 'rejection'
  | 'reminder_7d'
  | 'reminder_3d'
  | 'reminder_1d'
  | 'checklist_manual';

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getChecklistTypes(appointmentType: string): ChecklistType[] | null {
  if (appointmentType === 'personal_tax') return ['checklist_1'];
  if (appointmentType === 'corporate_tax') return ['checklist_4'];
  return null; // professional_services → generic message
}

async function logMessage(
  supabase: SupabaseClient,
  appointmentId: string,
  channel: 'sms' | 'email',
  messageType: MessageType,
  status: 'sent' | 'failed',
  errorMsg?: string
): Promise<void> {
  try {
    await supabase.from('messages').insert({
      appointment_id: appointmentId,
      channel,
      message_type: messageType,
      status,
      error_message: errorMsg ?? null,
    });
  } catch {
    // Non-critical — log failure doesn't block the application
    console.error(`[MESSAGING] Failed to log ${channel} ${messageType} for appointment ${appointmentId}`);
  }
}

async function trySendSMS(phone: string, body: string): Promise<{ sent: boolean; error: string | null }> {
  try {
    await sendSMS(phone, body);
    return { sent: true, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'SMS failed';
    console.warn('[MESSAGING] SMS send failed (A2P pending?):', msg);
    return { sent: false, error: msg };
  }
}

async function trySendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ sent: boolean; error: string | null }> {
  try {
    await sendEmail({ to, subject, html });
    return { sent: true, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Email failed';
    return { sent: false, error: msg };
  }
}

/** Wraps email body content in the HispanUSA branded template */
function wrapEmail(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
        <tr><td style="background-color:#03296A;padding:28px 32px;text-align:center;">
          <img src="https://hispan-usa-aios.vercel.app/hispanusa-logo.png" alt="HispanUSA" width="220" style="display:block;margin:0 auto;max-width:220px;height:auto;" />
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="border-top:1px solid #e5e7eb;padding:24px 32px;text-align:center;background-color:#f9fafb;">
          <p style="margin:0;color:#374151;font-size:13px;font-weight:bold;">HispanUSA Accounting &amp; Tax Services</p>
          <p style="margin:6px 0 0;color:#6b7280;font-size:12px;">8050 North University Drive, Suite #206, Tamarac, FL 33321</p>
          <p style="margin:4px 0 0;color:#6b7280;font-size:12px;">Phone: ${OFFICE_PHONE} | Website: <a href="https://hispanusa.com" style="color:#1B3A5C;text-decoration:none;">hispanusa.com</a></p>
          <div style="margin:16px 0 0;padding-top:12px;border-top:1px solid #e5e7eb;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
              <td style="vertical-align:middle;padding-right:6px;">
                <img src="https://hispan-usa-aios.vercel.app/dhs-logo.png" alt="Dark Horse Systems" width="60" style="display:block;max-width:60px;height:auto;opacity:0.7;" />
              </td>
              <td style="vertical-align:middle;">
                <span style="font-size:11px;color:#9ca3af;">Powered by Dark Horse Systems</span>
              </td>
            </tr></table>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Appointment info block used in confirmation/reminder emails */
function apptInfoBlock(dateDisplay: string, timeDisplay: string): string {
  return `<div style="background:#f0f7ff;border-left:4px solid #1B3A5C;padding:16px;border-radius:4px;margin:16px 0;">
    <p style="margin:0 0 6px;color:#1B3A5C;font-size:15px;"><strong>&#128197; ${dateDisplay}</strong></p>
    <p style="margin:0 0 6px;color:#1B3A5C;font-size:15px;"><strong>&#128336; ${timeDisplay}</strong></p>
    <p style="margin:0;color:#1B3A5C;font-size:15px;"><strong>&#128205; ${OFFICE_ADDRESS}</strong></p>
  </div>`;
}

// ─── Exported functions ───────────────────────────────────────────────────────

/**
 * sendConfirmationMessage
 * Sends an appointment-only confirmation (no checklist).
 * Used when auto_send_checklist = false, or as the first message before
 * sendChecklistMessage is called.
 *
 * messageType: 'confirmation' for staff bookings, 'approval' for client approval.
 */
export async function sendConfirmationMessage(
  appt: MessagingAppt,
  supabase: SupabaseClient,
  messageType: 'confirmation' | 'approval' = 'confirmation'
): Promise<SendResult> {
  const { language: lang } = appt;
  const dateDisplay = formatDate(appt.date);
  const timeDisplay = formatTime(appt.start_time);

  // ── SMS ─────────────────────────────────────────────────────────────────────
  const smsBody = lang === 'es'
    ? `Su cita en HispanUSA ha sido confirmada para el ${dateDisplay} a las ${timeDisplay}. Oficina: ${OFFICE_ADDRESS}. Llame al ${OFFICE_PHONE} con preguntas.`
    : `Your HispanUSA appointment is confirmed for ${dateDisplay} at ${timeDisplay}. Office: ${OFFICE_ADDRESS}. Call ${OFFICE_PHONE} with questions.`;

  // ── Email ───────────────────────────────────────────────────────────────────
  const subject = lang === 'es'
    ? 'Cita Confirmada — HispanUSA'
    : 'Appointment Confirmed — HispanUSA';

  const bodyHtml = lang === 'es'
    ? `<p style="margin:0 0 12px;color:#374151;">Estimado/a <strong>${appt.client_name}</strong>,</p>
       <p style="margin:0 0 4px;color:#374151;">Su cita ha sido confirmada:</p>
       ${apptInfoBlock(dateDisplay, timeDisplay)}
       <p style="margin:0 0 12px;color:#374151;">Para reprogramar llame al <a href="tel:${OFFICE_PHONE}" style="color:#1B3A5C;">${OFFICE_PHONE}</a>.</p>
       <p style="margin:0;color:#6b7280;font-size:13px;">— HispanUSA Accounting &amp; Tax Services</p>`
    : `<p style="margin:0 0 12px;color:#374151;">Dear <strong>${appt.client_name}</strong>,</p>
       <p style="margin:0 0 4px;color:#374151;">Your appointment has been confirmed:</p>
       ${apptInfoBlock(dateDisplay, timeDisplay)}
       <p style="margin:0 0 12px;color:#374151;">To reschedule, call <a href="tel:${OFFICE_PHONE}" style="color:#1B3A5C;">${OFFICE_PHONE}</a>.</p>
       <p style="margin:0;color:#6b7280;font-size:13px;">— HispanUSA Accounting &amp; Tax Services</p>`;

  const emailHtml = wrapEmail(bodyHtml);

  // ── Send ────────────────────────────────────────────────────────────────────
  const smsResult = await trySendSMS(appt.client_phone, smsBody);
  await logMessage(supabase, appt.id, 'sms', messageType, smsResult.sent ? 'sent' : 'failed', smsResult.error ?? undefined);

  const emailResult = { sent: false, error: null as string | null };
  if (appt.client_email) {
    const r = await trySendEmail(appt.client_email, subject, emailHtml);
    Object.assign(emailResult, r);
    await logMessage(supabase, appt.id, 'email', messageType, r.sent ? 'sent' : 'failed', r.error ?? undefined);
  }

  return { sms: smsResult, email: emailResult };
}

/**
 * sendChecklistMessage
 * Sends the document checklist SMS + email for the appointment.
 * Sets checklist_sent = true on the appointment once at least one channel succeeds.
 * Used both for auto-send (on confirmation) and manual staff send via button.
 */
export async function sendChecklistMessage(
  appt: MessagingAppt,
  supabase: SupabaseClient
): Promise<SendResult> {
  const { language: lang } = appt;
  const dateDisplay = formatDate(appt.date);
  const checklistTypes = getChecklistTypes(appt.appointment_type);

  // ── SMS ─────────────────────────────────────────────────────────────────────
  const hasSpecificChecklist = checklistTypes !== null;
  const smsBody = lang === 'es'
    ? hasSpecificChecklist
      ? `Hola ${appt.client_name.split(' ')[0]}, su cita en HispanUSA es el ${dateDisplay}. Revise su correo para la lista de documentos requeridos. ¿Preguntas? ${OFFICE_PHONE}`
      : `Hola ${appt.client_name.split(' ')[0]}, por favor traiga cualquier documento relevante a su cita en HispanUSA el ${dateDisplay}. ¿Preguntas? ${OFFICE_PHONE}`
    : hasSpecificChecklist
      ? `Hi ${appt.client_name.split(' ')[0]}, your HispanUSA appointment is ${dateDisplay}. Check your email for required documents. Questions? ${OFFICE_PHONE}`
      : `Hi ${appt.client_name.split(' ')[0]}, please bring any relevant documents to your HispanUSA appointment on ${dateDisplay}. Questions? ${OFFICE_PHONE}`;

  // ── Email ───────────────────────────────────────────────────────────────────
  const subject = lang === 'es'
    ? `Documentos Requeridos — HispanUSA (${dateDisplay})`
    : `Required Documents — HispanUSA (${dateDisplay})`;

  // Render checklist HTML or use generic professional services text
  let checklistHtml = '';
  if (checklistTypes) {
    checklistHtml = await loadAndRenderChecklists(checklistTypes, lang);
  }

  const genericDocsMsg = lang === 'es'
    ? `<p style="margin:0 0 16px;color:#374151;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:20px;">
         Por favor traiga cualquier documento relevante a su cita. Si tiene preguntas sobre qué traer, llame al
         <a href="tel:${OFFICE_PHONE}" style="color:#1B3A5C;">${OFFICE_PHONE}</a>.
       </p>`
    : `<p style="margin:0 0 16px;color:#374151;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:20px;">
         Please bring any relevant documents to your appointment. If you have questions about what to bring, call
         <a href="tel:${OFFICE_PHONE}" style="color:#1B3A5C;">${OFFICE_PHONE}</a>.
       </p>`;

  const bodyHtml = lang === 'es'
    ? `<p style="margin:0 0 12px;color:#374151;">Estimado/a <strong>${appt.client_name}</strong>,</p>
       <p style="margin:0 0 16px;color:#374151;">Su cita en HispanUSA es el <strong>${dateDisplay}</strong>. Por favor prepare los siguientes documentos antes de su cita:</p>
       ${checklistHtml || genericDocsMsg}
       <p style="margin:0 0 12px;color:#374151;">¿Preguntas? Llame al <a href="tel:${OFFICE_PHONE}" style="color:#1B3A5C;">${OFFICE_PHONE}</a>.</p>
       <p style="margin:0;color:#6b7280;font-size:13px;">— HispanUSA Accounting &amp; Tax Services</p>`
    : `<p style="margin:0 0 12px;color:#374151;">Dear <strong>${appt.client_name}</strong>,</p>
       <p style="margin:0 0 16px;color:#374151;">Your HispanUSA appointment is on <strong>${dateDisplay}</strong>. Please prepare the following documents before your appointment:</p>
       ${checklistHtml || genericDocsMsg}
       <p style="margin:0 0 12px;color:#374151;">Questions? Call <a href="tel:${OFFICE_PHONE}" style="color:#1B3A5C;">${OFFICE_PHONE}</a>.</p>
       <p style="margin:0;color:#6b7280;font-size:13px;">— HispanUSA Accounting &amp; Tax Services</p>`;

  const emailHtml = wrapEmail(bodyHtml);

  // ── Send ────────────────────────────────────────────────────────────────────
  const smsResult = await trySendSMS(appt.client_phone, smsBody);
  await logMessage(supabase, appt.id, 'sms', 'checklist_manual', smsResult.sent ? 'sent' : 'failed', smsResult.error ?? undefined);

  const emailResult = { sent: false, error: null as string | null };
  if (appt.client_email) {
    const r = await trySendEmail(appt.client_email, subject, emailHtml);
    Object.assign(emailResult, r);
    await logMessage(supabase, appt.id, 'email', 'checklist_manual', r.sent ? 'sent' : 'failed', r.error ?? undefined);
  }

  // Mark checklist_sent = true if at least one channel succeeded
  if (smsResult.sent || emailResult.sent) {
    await supabase
      .from('appointments')
      .update({ checklist_sent: true })
      .eq('id', appt.id);
  }

  return { sms: smsResult, email: emailResult };
}

/**
 * sendRejectionMessage
 * Sends a rejection notice via SMS + email after a self-booking is rejected.
 */
export async function sendRejectionMessage(
  appt: MessagingAppt,
  supabase: SupabaseClient
): Promise<SendResult> {
  const { language: lang } = appt;

  // ── SMS ─────────────────────────────────────────────────────────────────────
  const smsBody = lang === 'es'
    ? `El horario solicitado en HispanUSA no está disponible. Por favor llame al ${OFFICE_PHONE} para agendar su cita.`
    : `Your requested appointment time at HispanUSA is unavailable. Please call ${OFFICE_PHONE} to schedule.`;

  // ── Email ───────────────────────────────────────────────────────────────────
  const subject = lang === 'es'
    ? 'Solicitud de Cita — HispanUSA'
    : 'Appointment Request — HispanUSA';

  const bodyHtml = lang === 'es'
    ? `<p style="margin:0 0 12px;color:#374151;">Estimado/a <strong>${appt.client_name}</strong>,</p>
       <p style="margin:0 0 16px;color:#374151;">Lamentamos informarle que el horario solicitado no está disponible en este momento.</p>
       <p style="margin:0 0 12px;color:#374151;">Por favor llámenos al <a href="tel:${OFFICE_PHONE}" style="color:#1B3A5C;"><strong>${OFFICE_PHONE}</strong></a> para coordinar una nueva cita.</p>
       <p style="margin:0;color:#6b7280;font-size:13px;">— HispanUSA Accounting &amp; Tax Services</p>`
    : `<p style="margin:0 0 12px;color:#374151;">Dear <strong>${appt.client_name}</strong>,</p>
       <p style="margin:0 0 16px;color:#374151;">Unfortunately your requested appointment time is unavailable.</p>
       <p style="margin:0 0 12px;color:#374151;">Please call us at <a href="tel:${OFFICE_PHONE}" style="color:#1B3A5C;"><strong>${OFFICE_PHONE}</strong></a> to schedule a new appointment.</p>
       <p style="margin:0;color:#6b7280;font-size:13px;">— HispanUSA Accounting &amp; Tax Services</p>`;

  const emailHtml = wrapEmail(bodyHtml);

  // ── Send ────────────────────────────────────────────────────────────────────
  const smsResult = await trySendSMS(appt.client_phone, smsBody);
  await logMessage(supabase, appt.id, 'sms', 'rejection', smsResult.sent ? 'sent' : 'failed', smsResult.error ?? undefined);

  const emailResult = { sent: false, error: null as string | null };
  if (appt.client_email) {
    const r = await trySendEmail(appt.client_email, subject, emailHtml);
    Object.assign(emailResult, r);
    await logMessage(supabase, appt.id, 'email', 'rejection', r.sent ? 'sent' : 'failed', r.error ?? undefined);
  }

  return { sms: smsResult, email: emailResult };
}

/**
 * sendReminderMessage
 * Sends a scheduled reminder (7d, 3d, or 1d before appointment).
 *
 * Logic:
 * - reminder_7d / reminder_3d: if checklist_sent = true → include checklist reminder
 *                               if checklist_sent = false → appointment-only reminder
 * - reminder_1d: always appointment-only reminder regardless of checklist status
 */
export async function sendReminderMessage(
  appt: MessagingAppt,
  supabase: SupabaseClient,
  reminderType: 'reminder_7d' | 'reminder_3d' | 'reminder_1d'
): Promise<SendResult> {
  const { language: lang } = appt;
  const dateDisplay = formatDate(appt.date);
  const timeDisplay = formatTime(appt.start_time);
  const is1Day = reminderType === 'reminder_1d';
  const isDocReminder = appt.checklist_sent && !is1Day;

  const daysLabel = {
    reminder_7d: lang === 'es' ? '7 días' : '7 days',
    reminder_3d: lang === 'es' ? '3 días' : '3 days',
    reminder_1d: lang === 'es' ? 'mañana' : 'tomorrow',
  }[reminderType];

  let smsBody: string;
  let subject: string;
  let emailBodyContent: string;

  if (is1Day) {
    // ── 1-day: always appointment reminder ──────────────────────────────────
    smsBody = lang === 'es'
      ? `Recordatorio HispanUSA: Su cita es MAÑANA ${dateDisplay} a las ${timeDisplay}. Oficina: ${OFFICE_ADDRESS}. ¿Preguntas? ${OFFICE_PHONE}`
      : `HispanUSA Reminder: Your appointment is TOMORROW ${dateDisplay} at ${timeDisplay}. Office: ${OFFICE_ADDRESS}. Questions? ${OFFICE_PHONE}`;
    subject = lang === 'es'
      ? 'Recordatorio de Cita — Mañana — HispanUSA'
      : 'Appointment Reminder — Tomorrow — HispanUSA';
    emailBodyContent = lang === 'es'
      ? `<p style="margin:0 0 12px;color:#374151;">Estimado/a <strong>${appt.client_name}</strong>,</p>
         <p style="margin:0 0 4px;color:#374151;">Este es un recordatorio de que su cita en HispanUSA es <strong>MAÑANA</strong>:</p>
         ${apptInfoBlock(dateDisplay, timeDisplay)}
         <p style="margin:0 0 12px;color:#374151;">Si necesita reprogramar, llame al <a href="tel:${OFFICE_PHONE}" style="color:#1B3A5C;">${OFFICE_PHONE}</a> lo antes posible.</p>
         <p style="margin:0;color:#6b7280;font-size:13px;">— HispanUSA Accounting &amp; Tax Services</p>`
      : `<p style="margin:0 0 12px;color:#374151;">Dear <strong>${appt.client_name}</strong>,</p>
         <p style="margin:0 0 4px;color:#374151;">This is a reminder that your HispanUSA appointment is <strong>TOMORROW</strong>:</p>
         ${apptInfoBlock(dateDisplay, timeDisplay)}
         <p style="margin:0 0 12px;color:#374151;">If you need to reschedule, call <a href="tel:${OFFICE_PHONE}" style="color:#1B3A5C;">${OFFICE_PHONE}</a> as soon as possible.</p>
         <p style="margin:0;color:#6b7280;font-size:13px;">— HispanUSA Accounting &amp; Tax Services</p>`;

  } else if (isDocReminder) {
    // ── 7d/3d with checklist: include document reminder ──────────────────────
    const checklistTypes = getChecklistTypes(appt.appointment_type);
    let checklistHtml = '';
    if (checklistTypes) {
      checklistHtml = await loadAndRenderChecklists(checklistTypes, lang);
    }
    const genericDocs = lang === 'es'
      ? '<p style="color:#374151;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;">Por favor traiga cualquier documento relevante a su cita.</p>'
      : '<p style="color:#374151;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;">Please bring any relevant documents to your appointment.</p>';

    smsBody = lang === 'es'
      ? `Recordatorio HispanUSA: Su cita es en ${daysLabel} (${dateDisplay}). Por favor prepare sus documentos. ¿Preguntas? ${OFFICE_PHONE}`
      : `HispanUSA Reminder: Your appointment is in ${daysLabel} (${dateDisplay}). Please prepare your documents. Questions? ${OFFICE_PHONE}`;
    subject = lang === 'es'
      ? `Recordatorio de Documentos — ${daysLabel} — HispanUSA`
      : `Document Reminder — ${daysLabel} — HispanUSA`;
    emailBodyContent = lang === 'es'
      ? `<p style="margin:0 0 12px;color:#374151;">Estimado/a <strong>${appt.client_name}</strong>,</p>
         <p style="margin:0 0 16px;color:#374151;">Su cita en HispanUSA es en <strong>${daysLabel}</strong> (${dateDisplay} a las ${timeDisplay}). Por favor tenga listos los siguientes documentos:</p>
         ${checklistHtml || genericDocs}
         <p style="margin:0 0 12px;color:#374151;">¿Preguntas? Llame al <a href="tel:${OFFICE_PHONE}" style="color:#1B3A5C;">${OFFICE_PHONE}</a>.</p>
         <p style="margin:0;color:#6b7280;font-size:13px;">— HispanUSA Accounting &amp; Tax Services</p>`
      : `<p style="margin:0 0 12px;color:#374151;">Dear <strong>${appt.client_name}</strong>,</p>
         <p style="margin:0 0 16px;color:#374151;">Your HispanUSA appointment is in <strong>${daysLabel}</strong> (${dateDisplay} at ${timeDisplay}). Please have the following documents ready:</p>
         ${checklistHtml || genericDocs}
         <p style="margin:0 0 12px;color:#374151;">Questions? Call <a href="tel:${OFFICE_PHONE}" style="color:#1B3A5C;">${OFFICE_PHONE}</a>.</p>
         <p style="margin:0;color:#6b7280;font-size:13px;">— HispanUSA Accounting &amp; Tax Services</p>`;

  } else {
    // ── 7d/3d without checklist: appointment-only reminder ───────────────────
    smsBody = lang === 'es'
      ? `Recordatorio HispanUSA: Su cita es en ${daysLabel} (${dateDisplay} a las ${timeDisplay}). ¿Preguntas? ${OFFICE_PHONE}`
      : `HispanUSA Reminder: Your appointment is in ${daysLabel} (${dateDisplay} at ${timeDisplay}). Questions? ${OFFICE_PHONE}`;
    subject = lang === 'es'
      ? `Recordatorio de Cita — ${daysLabel} — HispanUSA`
      : `Appointment Reminder — ${daysLabel} — HispanUSA`;
    emailBodyContent = lang === 'es'
      ? `<p style="margin:0 0 12px;color:#374151;">Estimado/a <strong>${appt.client_name}</strong>,</p>
         <p style="margin:0 0 4px;color:#374151;">Este es un recordatorio de que su cita en HispanUSA es en <strong>${daysLabel}</strong>:</p>
         ${apptInfoBlock(dateDisplay, timeDisplay)}
         <p style="margin:0 0 12px;color:#374151;">Para reprogramar llame al <a href="tel:${OFFICE_PHONE}" style="color:#1B3A5C;">${OFFICE_PHONE}</a>.</p>
         <p style="margin:0;color:#6b7280;font-size:13px;">— HispanUSA Accounting &amp; Tax Services</p>`
      : `<p style="margin:0 0 12px;color:#374151;">Dear <strong>${appt.client_name}</strong>,</p>
         <p style="margin:0 0 4px;color:#374151;">This is a reminder that your HispanUSA appointment is in <strong>${daysLabel}</strong>:</p>
         ${apptInfoBlock(dateDisplay, timeDisplay)}
         <p style="margin:0 0 12px;color:#374151;">To reschedule, call <a href="tel:${OFFICE_PHONE}" style="color:#1B3A5C;">${OFFICE_PHONE}</a>.</p>
         <p style="margin:0;color:#6b7280;font-size:13px;">— HispanUSA Accounting &amp; Tax Services</p>`;
  }

  const emailHtml = wrapEmail(emailBodyContent);

  // ── Send ────────────────────────────────────────────────────────────────────
  const smsResult = await trySendSMS(appt.client_phone, smsBody);
  await logMessage(supabase, appt.id, 'sms', reminderType, smsResult.sent ? 'sent' : 'failed', smsResult.error ?? undefined);

  const emailResult = { sent: false, error: null as string | null };
  if (appt.client_email) {
    const r = await trySendEmail(appt.client_email, subject, emailHtml);
    Object.assign(emailResult, r);
    await logMessage(supabase, appt.id, 'email', reminderType, r.sent ? 'sent' : 'failed', r.error ?? undefined);
  }

  return { sms: smsResult, email: emailResult };
}
