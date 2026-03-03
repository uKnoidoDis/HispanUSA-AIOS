import type { ChecklistContent } from '@/types';

const checklist4Es: ChecklistContent = {
  type: 'checklist_4',
  language: 'es',
  title: 'Documentos Corporativos y Contables',
  sections: [
    {
      title: 'Documentos Requeridos',
      items: [
        'Imágenes de cheques (todos los cheques del negocio)',
        'Estados de cuenta bancarios (formato PDF)',
        'Facturas y registros de compra de equipos',
        'Formularios de nómina: W-3, 941 y 940 (si la nómina es procesada por proveedor externo)',
        'Estados de cuenta de crédito financiero',
        'Saldos de Cuentas por Cobrar (AR) y Cuentas por Pagar (AP) al cierre del año fiscal',
        'Inventario final',
        'Formularios W-9 de todos los subcontratistas',
        'Documentación de declaración de impuestos en el extranjero (si aplica)',
      ],
    },
    {
      title: 'Calendario de Envío de Documentos',
      items: [
        'Envíe documentos cada 3 meses (trimestral)',
        'El Estado de Resultados (P&L) y Balance General se enviarán por correo después de digitalizar su año fiscal',
        'Condiciones de pago: 50% de anticipo, saldo restante el día de la cita',
      ],
    },
    {
      title: 'Fechas Importantes',
      items: [
        'Impuestos Corporativos (Formularios 1065 / 1120-S): Fecha límite 15 de marzo (extensión disponible hasta el 15 de septiembre por $35)',
        'Informe Anual de Florida: Vence el 1 de mayo — $245 (incluye cargo estatal)',
      ],
    },
  ],
  sendTo: 'accounting@hispanusa.com',
  notes: 'Por favor envíe todos los documentos directamente a accounting@hispanusa.com. Llame al 954-397-5773 con cualquier pregunta.',
};

export default checklist4Es;
