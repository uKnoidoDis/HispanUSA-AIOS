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
        <tr><td style="background-color:#0F2137;padding:28px 40px;text-align:center;">
          <img src="https://hispan-usa-aios.vercel.app/hispanusa-logo.png" alt="HispanUSA" width="220" style="display:block;margin:0 auto;max-width:220px;height:auto;" />
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
            <p style="margin:8px 0 0;font-size:14px;color:#6b7280;">or call <strong>954-934-0194</strong></p>
          </div>
        </td></tr>
        <tr><td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
          <p style="margin:0;color:#374151;font-size:13px;font-weight:bold;">HispanUSA Accounting &amp; Tax Services</p>
          <p style="margin:6px 0 0;color:#6b7280;font-size:12px;">8050 North University Drive, Suite #206, Tamarac, FL 33321</p>
          <p style="margin:4px 0 0;color:#6b7280;font-size:12px;">Phone: 954-934-0194 | Website: <a href="https://hispanusa.com" style="color:#1B3A5C;text-decoration:none;">hispanusa.com</a></p>
          <table cellpadding="0" cellspacing="0" style="margin:12px auto 0;border-top:1px solid #e5e7eb;padding-top:12px;"><tr>
            <td style="vertical-align:middle;padding:12px 6px 0 0;">
              <img src="https://hispan-usa-aios.vercel.app/dhs-logo.png" alt="Dark Horse Systems" width="60" style="display:block;max-width:60px;height:auto;opacity:0.7;" />
            </td>
            <td style="vertical-align:middle;padding-top:12px;">
              <span style="font-size:11px;color:#9ca3af;">Powered by Dark Horse Systems</span>
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
};

export default email3DayEn;
