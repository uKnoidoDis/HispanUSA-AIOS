import twilio from 'twilio';

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (client) return client;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error('Missing Twilio environment variables');
  }
  client = twilio(accountSid, authToken);
  return client;
}

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  return phone.startsWith('+') ? phone : `+${digits}`;
}

export async function sendSMS(to: string, body: string): Promise<{ sid: string }> {
  const twilioClient = getClient();
  const rawFrom = process.env.TWILIO_PHONE_NUMBER;
  if (!rawFrom) throw new Error('Missing TWILIO_PHONE_NUMBER');

  const from = toE164(rawFrom);
  const message = await twilioClient.messages.create({ body, from, to });
  return { sid: message.sid };
}
