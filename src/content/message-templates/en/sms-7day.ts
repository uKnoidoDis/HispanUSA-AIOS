import type { SmsTemplate, TemplateVars } from '@/types';

const sms7DayEn: SmsTemplate = {
  body: (vars: TemplateVars): string =>
    `HispanUSA: Your appointment is in 7 days (${vars.date}). Please send your documents to taxes@hispanusa.com or call 954-397-5773 to avoid rescheduling.`,
};

export default sms7DayEn;
