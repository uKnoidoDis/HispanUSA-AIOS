import type { ChecklistContent } from '@/types';

const checklist3En: ChecklistContent = {
  type: 'checklist_3',
  language: 'en',
  title: 'New Client Intake Form',
  sections: [
    {
      title: 'Personal Information',
      items: [
        'Full legal name',
        'Social Security Number (SSN)',
        'Date of Birth',
        'Phone number',
        'Occupation',
        'Filing status (Single, Married Filing Jointly, Married Filing Separately, Head of Household)',
        'Current address',
        'Email address',
      ],
    },
    {
      title: 'Health Insurance',
      items: [
        'Do you have health insurance? (Yes / No)',
        'If yes: Private insurance or Obama Care (Marketplace)?',
      ],
    },
    {
      title: 'Cryptocurrency',
      items: [
        'Did you buy, sell, or receive cryptocurrency in 2025? (Yes / No)',
      ],
    },
    {
      title: 'Spouse Information (if married)',
      items: [
        "Spouse's full legal name",
        "Spouse's Social Security Number (SSN)",
        "Spouse's Date of Birth",
        "Spouse's phone number",
        "Spouse's occupation",
        "Spouse's email address",
      ],
    },
    {
      title: 'Dependents (complete for each dependent)',
      items: [
        'Full name',
        'Relationship to you',
        'Date of Birth',
        'Social Security Number (SSN)',
        'Daycare provider name, address, and Tax ID (if applicable)',
        'Amount paid to daycare in 2025',
      ],
    },
    {
      title: 'Banking Information',
      items: [
        'Bank routing number',
        'Bank account number',
        'Voided check preferred',
      ],
    },
    {
      title: 'Education',
      items: [
        'Tuition paid in 2025',
        'Books and supplies expenses',
        'Tutoring expenses',
        'Computer or equipment purchased for school',
        'Additional courses or training',
        'Form 1098-T from your school, or receipts if form not available',
      ],
    },
    {
      title: 'Deductions (Property Owners)',
      items: [
        'Medical and dental expenses (out-of-pocket)',
        'Charitable donations (with receipts or letters)',
        'Property taxes paid',
        'Mortgage interest (Form 1098)',
        'Pension contributions',
      ],
    },
    {
      title: 'Self-Employed / Business Income',
      items: [
        'Total business income for 2025',
        'Vehicle information: make/model, total mileage, business mileage, gas, maintenance, repairs',
        'Business expenses: phone, utilities, materials, wages paid, subcontractor payments (with W-9s), equipment, entertainment, transportation',
      ],
    },
  ],
  sendTo: 'taxes@hispanusa.com',
};

export default checklist3En;
