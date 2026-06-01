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
 * Source of truth for subtype colors — FINAL values, locked in the calendar
 * color recode (Chat #16). Consumed by `appointmentColor()` in
 * `src/components/calendar/calendarColors.ts` to color appointment blocks/chips
 * and the appointment dots in list views. Consulting + Case within a service
 * share a color.
 */
export const SERVICE_SUBTYPE_COLORS: Record<ServiceSubtype, string> = {
  immigration_consulting:         '#FB923C', // light orange
  immigration_case:               '#FB923C', // light orange
  divorce_consulting:             '#86EFAC', // light green
  divorce_case:                   '#86EFAC', // light green
  bankruptcy_consulting:          '#14B8A6', // teal
  bankruptcy_case:                '#14B8A6', // teal
  offer_in_compromise_consulting: '#EAB308', // gold
  offer_in_compromise_case:       '#EAB308', // gold
  general_consulting:             '#F9A8D4', // light pink
  other:                          '#64748B', // slate
};
