import type { SmsTemplate, TemplateVars } from '@/types';

const smsImmediateEs: SmsTemplate = {
  body: (vars: TemplateVars): string =>
    `Hola ${vars.firstName}, gracias por agendar con HispanUSA. Su cita es el ${vars.date} a las ${vars.time}. Recibirá su lista de documentos por email. Info: 954-397-5773`,
};

export default smsImmediateEs;
