import type { ChecklistContent } from '@/types';

const checklist3Es: ChecklistContent = {
  type: 'checklist_3',
  language: 'es',
  title: 'Formulario de Registro — Nuevo Cliente',
  sections: [
    {
      title: 'Información Personal',
      items: [
        'Nombre legal completo',
        'Número de Seguro Social (SSN)',
        'Fecha de nacimiento',
        'Número de teléfono',
        'Ocupación',
        'Estado civil (Soltero, Casado declarando conjuntamente, Casado declarando por separado, Jefe de hogar)',
        'Dirección actual',
        'Correo electrónico',
      ],
    },
    {
      title: 'Seguro Médico',
      items: [
        '¿Tiene seguro médico? (Sí / No)',
        'Si sí: ¿Es seguro privado o del Marketplace (Obama Care)?',
      ],
    },
    {
      title: 'Criptomonedas',
      items: [
        '¿Compró, vendió o recibió criptomonedas en 2025? (Sí / No)',
      ],
    },
    {
      title: 'Información del Cónyuge (si está casado/a)',
      items: [
        'Nombre legal completo del cónyuge',
        'Número de Seguro Social (SSN) del cónyuge',
        'Fecha de nacimiento del cónyuge',
        'Teléfono del cónyuge',
        'Ocupación del cónyuge',
        'Correo electrónico del cónyuge',
      ],
    },
    {
      title: 'Dependientes (complete para cada dependiente)',
      items: [
        'Nombre completo',
        'Relación con usted',
        'Fecha de nacimiento',
        'Número de Seguro Social (SSN)',
        'Nombre, dirección y Tax ID del proveedor de guardería (si aplica)',
        'Monto pagado a la guardería en 2025',
      ],
    },
    {
      title: 'Información Bancaria',
      items: [
        'Número de ruta bancaria (routing)',
        'Número de cuenta bancaria',
        'Se prefiere cheque anulado (voided check)',
      ],
    },
    {
      title: 'Educación',
      items: [
        'Matrícula pagada en 2025',
        'Gastos en libros y materiales',
        'Gastos de tutoría',
        'Computadora o equipo adquirido para estudios',
        'Cursos o capacitaciones adicionales',
        'Formulario 1098-T de su institución, o recibos si no disponible',
      ],
    },
    {
      title: 'Deducciones (Propietarios de Inmuebles)',
      items: [
        'Gastos médicos y dentales de bolsillo',
        'Donaciones caritativas (con recibos o cartas)',
        'Impuestos a la propiedad pagados',
        'Interés hipotecario (Formulario 1098)',
        'Aportaciones a pensión',
      ],
    },
    {
      title: 'Trabajo Independiente / Ingresos de Negocio',
      items: [
        'Ingresos totales del negocio en 2025',
        'Información del vehículo: marca/modelo, millaje total, millaje de negocio, gasolina, mantenimiento, reparaciones',
        'Gastos del negocio: teléfono, servicios públicos, materiales, sueldos pagados, pagos a subcontratistas (con W-9), equipo, entretenimiento, transporte',
      ],
    },
  ],
  sendTo: 'taxes@hispanusa.com',
};

export default checklist3Es;
