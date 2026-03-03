import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Appointment,
  Client,
  ChecklistType,
  ReminderTrigger,
  MessageResult,
  SmsTemplate,
  EmailTemplate,
  TemplateVars,
} from '@/types';
import { sendSMS } from './twilio';
import { sendEmail } from './resend';
import { loadAndRenderChecklists } from './checklist-renderer';
import { formatDate, formatTime, normalizePhone } from './utils';

type TriggerKey = 'immediate' | '7_day' | '3_day' | '1_day' | 'manual_resend';

async function loadSmsTemplate(lang: 'en' | 'es', trigger: TriggerKey): Promise<SmsTemplate> {
  const effectiveTrigger = trigger === 'manual_resend' ? 'immediate' : trigger;
  const fileKey = effectiveTrigger.replace('_', '');
  const mod = await import(`@/content/message-templates/${lang}/sms-${fileKey}`);
  return mod.default as SmsTemplate;
}

async function loadEmailTemplate(lang: 'en' | 'es', trigger: TriggerKey): Promise<EmailTemplate> {
  const effectiveTrigger = trigger === 'manual_resend' ? 'immediate' : trigger;
  const fileKey = effectiveTrigger.replace('_', '');
  const mod = await import(`@/content/message-templates/${lang}/email-${fileKey}`);
  return mod.default as EmailTemplate;
}

async function logMessage(
  supabase: SupabaseClient,
  params: {
    appointment_id: string;
    client_id: string;
    channel: 'sms' | 'email';
    trigger: ReminderTrigger;
    language: 'en' | 'es';
    recipient: string;
    subject?: string;
    body: string;
    status: 'sent' | 'failed' | 'pending';
    provider_id?: string;
    error_message?: string;
    sent_at?: string;
  }
) {
  await supabase.from('message_log').insert({
    appointment_id: params.appointment_id,
    client_id: params.client_id,
    channel: params.channel,
    trigger: params.trigger,
    language: params.language,
    recipient: params.recipient,
    subject: params.subject ?? null,
    body: params.body,
    status: params.status,
    provider_id: params.provider_id ?? null,
    error_message: params.error_message ?? null,
    sent_at: params.sent_at ?? null,
  });
}

export async function buildAndSendMessages(
  appointment: Appointment,
  client: Client,
  checklists: ChecklistType[],
  trigger: ReminderTrigger,
  supabase: SupabaseClient
): Promise<{ sms: MessageResult | null; email: MessageResult | null }> {
  const lang = client.language_preference;

  const templateVars: TemplateVars = {
    firstName: client.first_name,
    date: formatDate(appointment.appointment_date),
    time: formatTime(appointment.appointment_time),
  };

  const [smsTemplate, emailTemplate, checklistsHtml] = await Promise.all([
    loadSmsTemplate(lang, trigger as TriggerKey),
    loadEmailTemplate(lang, trigger as TriggerKey),
    loadAndRenderChecklists(checklists, lang),
  ]);

  const smsBody = smsTemplate.body(templateVars);
  const emailSubject = emailTemplate.subject(templateVars);
  const emailHtml = emailTemplate.html(templateVars, checklistsHtml);

  let smsResult: MessageResult | null = null;
  let emailResult: MessageResult | null = null;

  // Send SMS if client has a phone number
  if (client.phone) {
    const normalizedPhone = normalizePhone(client.phone);
    try {
      const { sid } = await sendSMS(normalizedPhone, smsBody);
      smsResult = { success: true, channel: 'sms', recipient: normalizedPhone, providerId: sid };
      await logMessage(supabase, {
        appointment_id: appointment.id,
        client_id: client.id,
        channel: 'sms',
        trigger,
        language: lang,
        recipient: normalizedPhone,
        body: smsBody,
        status: 'sent',
        provider_id: sid,
        sent_at: new Date().toISOString(),
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      smsResult = { success: false, channel: 'sms', recipient: normalizedPhone, error: errorMsg };
      await logMessage(supabase, {
        appointment_id: appointment.id,
        client_id: client.id,
        channel: 'sms',
        trigger,
        language: lang,
        recipient: normalizedPhone,
        body: smsBody,
        status: 'failed',
        error_message: errorMsg,
      });
    }
  }

  // Send email if client has an email address
  if (client.email) {
    try {
      const { id } = await sendEmail({ to: client.email, subject: emailSubject, html: emailHtml });
      emailResult = { success: true, channel: 'email', recipient: client.email, providerId: id };
      await logMessage(supabase, {
        appointment_id: appointment.id,
        client_id: client.id,
        channel: 'email',
        trigger,
        language: lang,
        recipient: client.email,
        subject: emailSubject,
        body: emailHtml,
        status: 'sent',
        provider_id: id,
        sent_at: new Date().toISOString(),
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      emailResult = { success: false, channel: 'email', recipient: client.email, error: errorMsg };
      await logMessage(supabase, {
        appointment_id: appointment.id,
        client_id: client.id,
        channel: 'email',
        trigger,
        language: lang,
        recipient: client.email,
        subject: emailSubject,
        body: emailHtml,
        status: 'failed',
        error_message: errorMsg,
      });
    }
  }

  return { sms: smsResult, email: emailResult };
}
