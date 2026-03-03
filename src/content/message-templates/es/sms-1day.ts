import type { SmsTemplate, TemplateVars } from '@/types';

const sms1DayEs: SmsTemplate = {
  body: (vars: TemplateVars): string =>
    `HispanUSA: Su cita es MAÑANA ${vars.date} a las ${vars.time}. Sin documentos completos, su cita puede ser reprogramada. Llame: 954-397-5773.`,
};

export default sms1DayEs;
