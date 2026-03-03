import type { ChecklistContent } from '@/types';

// Secciones adicionales para clientes CON dependientes — se combina con checklist_1
const checklist2Es: ChecklistContent = {
  type: 'checklist_2',
  language: 'es',
  title: 'Documentos de Dependientes',
  sections: [
    {
      title: 'Padres Dependientes',
      items: [
        'Prueba de beneficios del Seguro Social o ingresos de pensión para cada padre dependiente',
      ],
    },
    {
      title: 'Otros Dependientes',
      items: [
        'Prueba de convivencia (correspondencia, registros médicos o escolares)',
      ],
    },
    {
      title: 'Registros Escolares (Requerimiento del IRS)',
      items: [
        'Boletines escolares trimestrales de cada hijo para verificar residencia en EE.UU.:',
        'Año escolar 2024–2025: 3er y 4to trimestre',
        'Año escolar 2025–2026: 1er y 2do trimestre',
      ],
    },
  ],
  sendTo: 'taxes@hispanusa.com',
  notes: 'También se requieren todos los documentos de la lista de impuestos personales.',
};

export default checklist2Es;
