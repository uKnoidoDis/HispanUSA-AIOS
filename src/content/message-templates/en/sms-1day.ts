import type { SmsTemplate, TemplateVars } from '@/types';

const sms1DayEn: SmsTemplate = {
  body: (vars: TemplateVars): string =>
    `HispanUSA: Your appointment is TOMORROW ${vars.date} at ${vars.time}. Without complete documents, your appointment may be rescheduled. Call: 954-397-5773.`,
};

export default sms1DayEn;
