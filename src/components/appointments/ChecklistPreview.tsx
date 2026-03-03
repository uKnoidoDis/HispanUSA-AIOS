'use client';

import type { AppointmentType } from '@/types';
import { resolveChecklists } from '@/lib/checklist-router';

interface ChecklistPreviewProps {
  appointmentType: AppointmentType | '';
  hasDependents: boolean;
  isNewClient: boolean;
  language: 'en' | 'es';
}

const checklistLabels: Record<string, { en: string; es: string }> = {
  checklist_1: {
    en: 'Personal Tax Documents (no dependents)',
    es: 'Documentos de impuestos personales (sin dependientes)',
  },
  checklist_2: {
    en: 'Dependent Documents (addons to personal list)',
    es: 'Documentos de dependientes (adicional a la lista personal)',
  },
  checklist_3: {
    en: 'New Client Intake Form',
    es: 'Formulario de registro — nuevo cliente',
  },
  checklist_4: {
    en: 'Corporate & Accounting Documents',
    es: 'Documentos corporativos y contables',
  },
};

export default function ChecklistPreview({
  appointmentType,
  hasDependents,
  isNewClient,
  language,
}: ChecklistPreviewProps) {
  if (!appointmentType) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 text-sm text-gray-400 text-center">
        {language === 'es'
          ? 'Seleccione el tipo de cita para ver la lista de documentos'
          : 'Select appointment type to preview document checklist'}
      </div>
    );
  }

  const checklists = resolveChecklists({
    appointment_type: appointmentType,
    has_dependents: hasDependents,
    is_new_client: isNewClient,
  });

  const emailTo = appointmentType === 'corporate' ? 'accounting@hispanusa.com' : 'taxes@hispanusa.com';

  return (
    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">
        {language === 'es' ? 'Documentos que se enviarán:' : 'Documents that will be sent:'}
      </p>
      <ul className="space-y-2">
        {checklists.map(type => (
          <li key={type} className="flex items-start gap-2 text-sm text-blue-900">
            <span className="mt-0.5 text-blue-500">&#10003;</span>
            <span>{checklistLabels[type]?.[language] ?? type}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-blue-600">
        {language === 'es' ? 'Se enviará a:' : 'Send to:'}{' '}
        <strong>{emailTo}</strong>
      </p>
    </div>
  );
}
