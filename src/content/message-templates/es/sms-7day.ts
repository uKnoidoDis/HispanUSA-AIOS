import type { SmsTemplate, TemplateVars } from '@/types';

const sms7DayEs: SmsTemplate = {
  body: (vars: TemplateVars): string =>
    `HispanUSA: Su cita es en 7 días (${vars.date}). Por favor envíe sus documentos a taxes@hispanusa.com o al 954-397-5773 para evitar reprogramar.`,
};

export default sms7DayEs;
