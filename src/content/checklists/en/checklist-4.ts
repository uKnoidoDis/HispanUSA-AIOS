import type { ChecklistContent } from '@/types';

const checklist4En: ChecklistContent = {
  type: 'checklist_4',
  language: 'en',
  title: 'Corporate & Accounting Documents',
  sections: [
    {
      title: 'Required Documents',
      items: [
        'Check images (all business checks)',
        'Bank statements (PDF format)',
        'Equipment invoices and purchase records',
        'Payroll forms: W-3, 941, and 940 (if processed by external payroll provider)',
        'Financial credit statements',
        'Accounts Receivable (AR) and Accounts Payable (AP) balances at end of fiscal year',
        'Final inventory counts',
        'W-9 forms for all subcontractors',
        'Overseas tax filing documentation (if applicable)',
      ],
    },
    {
      title: 'Document Submission Schedule',
      items: [
        'Submit documents every 3 months (quarterly)',
        'P&L and Balance Sheet will be emailed to you after your fiscal year is digitized',
        'Payment terms: 50% advance, remaining balance due on appointment day',
      ],
    },
    {
      title: 'Important Deadlines',
      items: [
        'Corporate Taxes (Forms 1065 / 1120-S): Due March 15 (extension available until September 15 for $35)',
        'Florida Annual Report: Due May 1 — $245 (includes state fee)',
      ],
    },
  ],
  sendTo: 'accounting@hispanusa.com',
  notes: 'Please email all documents directly to accounting@hispanusa.com. Call 954-397-5773 with any questions.',
};

export default checklist4En;
