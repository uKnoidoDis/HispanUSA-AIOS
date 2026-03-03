import type { ChecklistContent } from '@/types';

const checklist1Es: ChecklistContent = {
  type: 'checklist_1',
  language: 'es',
  title: 'Documentos para Impuestos Personales',
  sections: [
    {
      title: 'Identificación',
      items: [
        "Licencia de conducir, acta de nacimiento o pasaporte",
      ],
    },
    {
      title: 'Comprobante de Domicilio',
      items: [
        'Estado de cuenta de FPL, cable o banco con su dirección actual',
        'Indíquenos si cambió de dirección durante el año',
      ],
    },
    {
      title: 'Seguro Médico (Solo Marketplace)',
      items: [
        'Formulario 1095-A — requerido si tiene Obama Care (Oscar, Ambetter, Aetna, Florida Blue, MyBlue, Cigna)',
        '¿Le falta el formulario? Llame al 1-800-318-2596. HispanUSA puede obtenerlo por un costo adicional.',
      ],
    },
    {
      title: 'Ingresos',
      items: [
        'W-2 (de cada empleador)',
        'Carta de ingresos del Seguro Social',
        'Estados de pensión',
        'Ingresos por intereses (Formulario 1099-INT)',
        'Acciones / Criptomonedas (Formulario 1099-B o estados de cuenta de la corredora)',
        'Distribución de 401-K (Formulario 1099-R)',
        'Premios de apuestas (Formulario W-2G)',
        'HORAS EXTRAS: Si su W-2 no refleja las horas extras, proporcione su último talonario de pago de diciembre 2025',
      ],
    },
    {
      title: 'Cuenta de Ahorros para la Salud (HSA)',
      items: [
        'Formulario 5498-SA',
      ],
    },
    {
      title: 'Propiedad',
      items: [
        'Interés hipotecario anual (Formulario 1098)',
        'Estados de cuenta de impuestos a la propiedad y seguro de hogar',
      ],
    },
    {
      title: 'Gastos Médicos y Donaciones',
      items: [
        'Gastos médicos y dentales no cubiertos por seguro (recibos)',
        'Cartas o certificaciones de donaciones caritativas',
      ],
    },
    {
      title: 'Trabajo Independiente',
      items: [
        '1099-NEC o 1099-MISC',
        'Resumen de ganancias de Uber / Lyft',
        'Si no recibió un 1099: envíe estados de cuenta bancarios o registros de depósitos a taxes@hispanusa.com',
      ],
    },
    {
      title: 'Educación',
      items: [
        'Formulario 1098-T (declaración de matrícula de la institución educativa)',
        'Si no tiene el formulario: recibos de libros, materiales, matrícula, computadora, préstamos educativos',
      ],
    },
    {
      title: 'Información Bancaria',
      items: [
        'Número de ruta (routing) y número de cuenta bancaria',
        'Se recomienda un cheque anulado (voided check)',
      ],
    },
  ],
  sendTo: 'taxes@hispanusa.com',
};

export default checklist1Es;
