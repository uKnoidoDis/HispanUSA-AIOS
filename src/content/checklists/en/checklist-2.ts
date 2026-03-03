import type { ChecklistContent } from '@/types';

// Additive sections for clients WITH dependents — rendered merged with checklist_1
const checklist2En: ChecklistContent = {
  type: 'checklist_2',
  language: 'en',
  title: 'Dependent Documents',
  sections: [
    {
      title: 'Dependent Parents',
      items: [
        'Proof of Social Security benefits or pension income for each dependent parent',
      ],
    },
    {
      title: 'Other Dependents',
      items: [
        'Proof that dependents lived with you (correspondence, medical records, or school records)',
      ],
    },
    {
      title: 'School Records (IRS Requirement)',
      items: [
        'Quarterly school records for each child to verify US residency:',
        '2024–2025 school year: 3rd Quarter and 4th Quarter report cards',
        '2025–2026 school year: 1st Quarter and 2nd Quarter report cards',
      ],
    },
  ],
  sendTo: 'taxes@hispanusa.com',
  notes: 'All documents from the Personal Tax checklist are also required.',
};

export default checklist2En;
