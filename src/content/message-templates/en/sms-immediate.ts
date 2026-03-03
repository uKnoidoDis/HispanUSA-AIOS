import type { SmsTemplate, TemplateVars } from '@/types';

const smsImmediateEn: SmsTemplate = {
  body: (vars: TemplateVars): string =>
    `Hi ${vars.firstName}, thanks for booking with HispanUSA. Your appointment is ${vars.date} at ${vars.time}. You'll receive your document checklist by email. Questions: 954-397-5773`,
};

export default smsImmediateEn;
