import type { SmsTemplate, TemplateVars } from '@/types';

const sms3DayEn: SmsTemplate = {
  body: (vars: TemplateVars): string =>
    `HispanUSA: 3 days until your appointment on ${vars.date}. We haven't received your documents yet. Please send them today to taxes@hispanusa.com or call 954-397-5773.`,
};

export default sms3DayEn;
