/**
 * Feature flags for gradual rollout of Module 2 features.
 *
 * Flags are controlled by environment variables read at build time
 * (NEXT_PUBLIC_ prefix so they're available client-side).
 *
 * In production (.env.production or Vercel production env vars):
 *   - Module 2 flags should default to false until each feature is verified
 *
 * In staging (.env.development or Vercel preview/staging env vars):
 *   - Module 2 flags can be set to true for testing
 *
 * In local dev:
 *   - Use .env.local to override per-developer
 *
 * Usage:
 *   import { FEATURES } from '@/lib/feature-flags';
 *   if (FEATURES.module2Clients) { ... }
 */

export const FEATURES = {
  // Module 2: Clients / CRM
  module2Clients: process.env.NEXT_PUBLIC_FEATURE_MODULE2_CLIENTS === 'true',

  // Module 2: Tasks
  module2Tasks: process.env.NEXT_PUBLIC_FEATURE_MODULE2_TASKS === 'true',

  // Module 2: Invoicing + payments
  module2Invoicing: process.env.NEXT_PUBLIC_FEATURE_MODULE2_INVOICING === 'true',

  // Module 2: Document storage + client portal
  module2Documents: process.env.NEXT_PUBLIC_FEATURE_MODULE2_DOCUMENTS === 'true',

  // Module 2: Bank statement automation
  module2BankStatements: process.env.NEXT_PUBLIC_FEATURE_MODULE2_BANK_STATEMENTS === 'true',

  // Module 2: IRS letter triage
  module2IrsTriage: process.env.NEXT_PUBLIC_FEATURE_MODULE2_IRS_TRIAGE === 'true',
} as const;

export type FeatureFlag = keyof typeof FEATURES;
