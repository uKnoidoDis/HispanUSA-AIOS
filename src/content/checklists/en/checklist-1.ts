import type { ChecklistContent } from '@/types';

const checklist1En: ChecklistContent = {
  type: 'checklist_1',
  language: 'en',
  title: 'Personal Tax Documents',
  sections: [
    {
      title: 'Identity',
      items: [
        "Driver's License, Birth Certificate, or Passport",
      ],
    },
    {
      title: 'Proof of Address',
      items: [
        'FPL, cable, or bank statement showing your current address',
        'Please note if your address has changed since last year',
      ],
    },
    {
      title: 'Health Insurance (Marketplace Only)',
      items: [
        'Form 1095-A — required if you have Obama Care (Oscar, Ambetter, Aetna, Florida Blue, MyBlue, Cigna)',
        "Missing form? Call 1-800-318-2596. HispanUSA can obtain it for a fee.",
      ],
    },
    {
      title: 'Income',
      items: [
        'W-2 (from each employer)',
        'Social Security income letter',
        'Pension statements',
        'Interest income (Form 1099-INT)',
        'Stock / Crypto (Form 1099-B or brokerage statements)',
        '401-K distribution (Form 1099-R)',
        'Gambling winnings (Form W-2G)',
        'OVERTIME: If your W-2 does not reflect overtime income, provide your last December 2025 pay stub',
      ],
    },
    {
      title: 'Health Savings Account (HSA)',
      items: [
        'Form 5498-SA',
      ],
    },
    {
      title: 'Property',
      items: [
        'Annual mortgage interest (Form 1098)',
        'Property tax and homeowners insurance statements',
      ],
    },
    {
      title: 'Medical Expenses & Donations',
      items: [
        'Uncovered medical and dental expenses (receipts)',
        'Charitable donation letters or certification documents',
      ],
    },
    {
      title: 'Self-Employed / Independent Work',
      items: [
        '1099-NEC or 1099-MISC',
        'Uber / Lyft earnings summary',
        'If you did not receive a 1099: email bank statements or deposit records to taxes@hispanusa.com',
      ],
    },
    {
      title: 'Education',
      items: [
        'Form 1098-T (tuition statement from school)',
        'If no form: receipts for books, supplies, registration, computer, loans',
      ],
    },
    {
      title: 'Banking Information',
      items: [
        'Bank routing number and account number',
        'A voided check is preferred',
      ],
    },
  ],
  sendTo: 'taxes@hispanusa.com',
};

export default checklist1En;
