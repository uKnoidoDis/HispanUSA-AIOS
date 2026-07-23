import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getClient(): Resend {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Missing RESEND_API_KEY');
  resendClient = new Resend(apiKey);
  return resendClient;
}

// Optional from/replyTo added for the internal DHS health digest (Jul 2026).
// Defaults are unchanged — every existing client-facing sender behaves exactly
// as before when the params are omitted.
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}): Promise<{ id: string }> {
  const client = getClient();
  const from = params.from ?? process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error('Missing RESEND_FROM_EMAIL');

  const { data, error } = await client.emails.send({
    from,
    to: params.to,
    replyTo: params.replyTo ?? 'info@hispanusa.com',
    subject: params.subject,
    html: params.html,
  });

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No response from Resend');
  return { id: data.id };
}
