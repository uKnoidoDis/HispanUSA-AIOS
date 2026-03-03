import type { SmsTemplate, TemplateVars } from '@/types';

const sms3DayEs: SmsTemplate = {
  body: (vars: TemplateVars): string =>
    `HispanUSA: Faltan 3 días para su cita el ${vars.date}. Aún no recibimos sus documentos. Envíelos hoy a taxes@hispanusa.com o llame al 954-397-5773.`,
};

export default sms3DayEs;
