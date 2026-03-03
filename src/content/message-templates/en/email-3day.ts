import type { EmailTemplate, TemplateVars } from '@/types';

const email3DayEn: EmailTemplate = {
  subject: (vars: TemplateVars): string =>
    `Reminder: 3 days until your HispanUSA appointment`,

  html: (vars: TemplateVars, checklistsHtml: string): string => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
        <tr><td style="background-color:#1e40af;padding:30px 40px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:bold;">HispanUSA</h1>
          <p style="color:#93c5fd;margin:4px 0 0;font-size:14px;">Accounting &amp; Tax Services</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="font-size:16px;color:#1f2937;margin:0 0 16px;">Dear <strong>${vars.firstName}</strong>,</p>
          <p style="font-size:15px;color:#374151;margin:0 0 24px;">
            Your HispanUSA appointment is <strong>3 days away</strong> and we still haven't received your documents.
            If we don't receive them in time, we may need to reschedule your appointment.
          </p>
          <div style="background-color:#fff7ed;border-left:4px solid #ea580c;border-radius:4px;padding:16px 20px;margin-bottom:32px;">
            <p style="margin:0;font-size:14px;color:#ea580c;font-weight:bold;">🚨 PLEASE SEND YOUR DOCUMENTS TODAY</p>
            <p style="margin:8px 0 0;font-size:15px;color:#1f2937;">
              📅 Your appointment: <strong>${vars.date}</strong>
            </p>
          </div>
          ${checklistsHtml}
          <div style="background-color:#f9fafb;border-radius:6px;padding:20px;margin-top:32px;text-align:center;">
            <p style="margin:0 0 8px;font-size:14px;color:#374151;font-weight:bold;">Send your documents to:</p>
            <p style="margin:0;font-size:15px;color:#1e40af;"><strong>taxes@hispanusa.com</strong></p>
            <p style="margin:8px 0 0;font-size:14px;color:#6b7280;">or call <strong>954-397-5773</strong></p>
          </div>
        </td></tr>
        <tr><td style="background-color:#f3f4f6;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">HispanUSA Accounting &amp; Tax Services | Coral Springs, FL</p>
          <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">954-397-5773 | taxes@hispanusa.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
};

export default email3DayEn;
