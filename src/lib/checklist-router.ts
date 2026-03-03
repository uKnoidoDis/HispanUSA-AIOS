import type { Appointment, ChecklistType } from '@/types';

export function resolveChecklists(appointment: Pick<Appointment, 'appointment_type' | 'has_dependents' | 'is_new_client'>): ChecklistType[] {
  const checklists: ChecklistType[] = [];

  if (appointment.appointment_type === 'corporate') {
    checklists.push('checklist_4');
    return checklists;
  }

  // Personal (returning or new)
  checklists.push('checklist_1');

  if (appointment.has_dependents) {
    checklists.push('checklist_2');
  }

  if (appointment.is_new_client) {
    checklists.push('checklist_3');
  }

  return checklists;
}
