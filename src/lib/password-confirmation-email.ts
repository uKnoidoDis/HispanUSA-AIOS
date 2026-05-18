import { sendEmail } from './resend';

// Branded password-change confirmation email.
// Layout matches the existing transactional email pattern:
//   - 8px navy stripe at the top
//   - White header with HispanUSA logo
//   - Body copy on white
//   - White footer with the dark DHS logo + "Powered by" line
// Inline CSS only — email clients strip <style> tags.
export async function sendPasswordChangeConfirmation(params: { to: string }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hispan-usa-aios.vercel.app';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>HispanUSA password updated</title>
</head>
<body style="margin:0;padding:0;background-color:#F9FAFB;font-family:'DM Sans',Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F9FAFB;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:#03296A;height:8px;line-height:8px;font-size:0;">&nbsp;</td>
          </tr>
          <tr>
            <td align="center" style="background-color:#FFFFFF;padding:28px 24px 12px;">
              <img src="${appUrl}/hispanusa-logo.png" alt="HispanUSA Accounting &amp; Tax" width="220" style="display:block;max-width:220px;height:auto;">
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 32px;">
              <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#03296A;line-height:1.3;font-family:'DM Sans',Arial,sans-serif;">Your password was changed</h1>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#111827;font-family:'DM Sans',Arial,sans-serif;">
                Your HispanUSA dashboard password was updated on
                <strong>${dateStr}</strong> at <strong>${timeStr} ET</strong>.
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#111827;font-family:'DM Sans',Arial,sans-serif;">
                If this wasn't you, contact Ruth immediately at
                <a href="tel:+19549340194" style="color:#03296A;font-weight:600;text-decoration:underline;">954-934-0194</a>.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#6B7280;font-family:'DM Sans',Arial,sans-serif;">
                This is an automated security notification from the HispanUSA AIOS dashboard.
                You don't need to reply.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color:#FFFFFF;border-top:1px solid #E5E7EB;padding:20px 24px;">
              <img src="${appUrl}/dhs-logo-dark.png" alt="Dark Horse Systems" width="100" style="display:block;max-width:100px;height:auto;margin:0 auto 6px;">
              <p style="margin:0;font-size:11px;font-weight:500;color:#111827;letter-spacing:0.3px;font-family:'DM Sans',Arial,sans-serif;">Powered by Dark Horse Systems</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: params.to,
    subject: 'Your HispanUSA password was changed',
    html,
  });
}
