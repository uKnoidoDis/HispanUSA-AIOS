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

export async function sendSMS(to: string, body: string): Promise<{ sid: string }> {
  const twilioClient = getClient();
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) throw new Error('Missing TWILIO_PHONE_NUMBER');

  const message = await twilioClient.messages.create({ body, from, to });
  return { sid: message.sid };
}
