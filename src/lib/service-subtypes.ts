import type { ServiceSubtype } from '@/types/scheduling';

/**
 * Canonical Professional Services subtype metadata.
 *
 * The 10 values match the `appointments.service_subtype` CHECK from migration
 * 007. Within a service, "Consulting" and "Case" are distinct bookable reasons
 * that share a color and the same 30-min duration.
 */
export const SERVICE_SUBTYPE_VALUES: ServiceSubtype[] = [
  'immigration_consulting',
  'immigration_case',
  'divorce_consulting',
  'divorce_case',
  'bankruptcy_consulting',
  'bankruptcy_case',
  'offer_in_compromise_consulting',
  'offer_in_compromise_case',
  'general_consulting',
  'other',
];

/**
 * Source of truth for subtype colors.
 *
 * NOT yet wired into any UI — the calendar and pending views currently color by
 * PREPARER, not by subtype. This constant exists so the separate calendar
 * color-recode prompt can consume it. The light-orange / light-green / light-pink
 * hexes are PROVISIONAL (Troy specified hexes only for teal / amber / slate);
 * finalize them during the recode.
 */
export const SERVICE_SUBTYPE_COLORS: Record<ServiceSubtype, string> = {
  immigration_consulting:         '#FB923C', // light orange
  immigration_case:               '#FB923C', // light orange
  divorce_consulting:             '#4ADE80', // light green
  divorce_case:                   '#4ADE80', // light green
  bankruptcy_consulting:          '#14B8A6', // teal
  bankruptcy_case:                '#14B8A6', // teal
  offer_in_compromise_consulting: '#F59E0B', // amber
  offer_in_compromise_case:       '#F59E0B', // amber
  general_consulting:             '#F9A8D4', // light pink
  other:                          '#64748B', // slate
};
