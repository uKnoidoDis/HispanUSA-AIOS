// ─── Calendar Color Helpers ──────────────────────────────────────────────────
// Appointments are colored by appointment TYPE/SUBTYPE, except the two preparers
// who keep a personal color (Oraise, Emely) — see appointmentColor(). Fills span
// light (purple/pink) to dark (brown), so a single text color can't stay readable
// on all of them. readableTextColor() picks whichever of near-black or white has
// the higher WCAG contrast on a given fill, keeping text ≥ 4.5:1 (WCAG AA) per
// the HispanUSA brand skill.

import type { ServiceSubtype } from '@/types/scheduling';
import { SERVICE_SUBTYPE_COLORS } from '@/lib/service-subtypes';

const DARK_TEXT = '#111827'; // brand Text Primary (gray-900)
const WHITE_TEXT = '#FFFFFF';

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}

function contrastRatio(lumA: number, lumB: number): number {
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns the text color (#111827 or #FFFFFF) with the higher contrast ratio
 * against the given background fill hex.
 */
export function readableTextColor(bgHex: string): string {
  const bgLum = relativeLuminance(bgHex);
  const darkContrast = contrastRatio(bgLum, relativeLuminance(DARK_TEXT));
  const whiteContrast = contrastRatio(bgLum, relativeLuminance(WHITE_TEXT));
  return whiteContrast > darkContrast ? WHITE_TEXT : DARK_TEXT;
}

// Status treatment tokens (status = border/badge dimension; never opacity).
export const CANCELLED_FILL = '#FEF2F2'; // red-50, muted
export const CANCELLED_BORDER = '#EF4444'; // system red (brand skill: errors use system red, not brand red)
export const CANCELLED_TEXT = '#6B7280'; // gray-500

// ─── Appointment type colors (final, locked in the calendar color recode) ─────
export const APPOINTMENT_TYPE_COLORS: Record<'personal_tax' | 'corporate_tax', string> = {
  personal_tax:  '#C4B5FD', // light purple
  corporate_tax: '#93C5FD', // light blue (also the Personal + Corporate combined)
};

// Neutral dot fill for any preparer without a personal color (everyone but Oraise/Emely).
export const NEUTRAL_PREPARER = '#94A3B8'; // slate-400

// The ONLY two preparers with a personal calendar color. Matched by preparer ID
// (names are fragile). IDs differ per environment, so prod + staging are both listed.
// If preparers are ever re-seeded, update these IDs.
export const PREPARER_COLORS: Record<string, string> = {
  '8901ca0c-7ae9-4440-8905-76c0cace1480': '#92400E', // Oraise (prod) — brown
  '0fe27c9f-f8f2-4e73-94e8-c52c2d3f1e3e': '#92400E', // Oraise (staging) — brown
  'eec7591f-1eb3-406f-9505-cc31efa1ecbd': '#6366F1', // Emely (prod) — indigo
  '0b8029f7-df9a-4fec-8ec2-8d241da2273a': '#6366F1', // Emely (staging) — indigo
};

/** Personal color for Oraise/Emely by preparer ID, else null. */
export function preparerOverrideColor(preparerId?: string | null): string | null {
  if (!preparerId) return null;
  return PREPARER_COLORS[preparerId] ?? null;
}

/**
 * Fill color for an appointment block / chip / dot.
 * Oraise & Emely keep their personal color; every other appointment colors by
 * its appointment type/subtype.
 */
export function appointmentColor(
  appointmentType: string,
  serviceSubtype: string | null,
  preparerId?: string | null,
): string {
  const override = preparerOverrideColor(preparerId);
  if (override) return override;
  if (appointmentType === 'professional_services') {
    return (serviceSubtype && SERVICE_SUBTYPE_COLORS[serviceSubtype as ServiceSubtype]) || '#64748B';
  }
  return APPOINTMENT_TYPE_COLORS[appointmentType as 'personal_tax' | 'corporate_tax'] ?? '#64748B';
}

/** Dot color for a preparer identity (availability / booking modal / side panel): personal color or neutral. */
export function preparerDotColor(preparerId?: string | null): string {
  return preparerOverrideColor(preparerId) ?? NEUTRAL_PREPARER;
}

// ─── Legend data (rendered at the top of the calendar) ────────────────────────
export interface LegendEntry { en: string; es: string; color: string; }

export const APPOINTMENT_TYPE_LEGEND: LegendEntry[] = [
  { en: 'Personal Tax',                         es: 'Impuestos Personales',                   color: '#C4B5FD' },
  { en: 'Corporate Tax',                        es: 'Impuestos Corporativos',                 color: '#93C5FD' },
  { en: 'Personal + Corporate',                 es: 'Personal + Corporativo',                 color: '#93C5FD' },
  { en: 'Immigration (Consult + Case)',         es: 'Inmigración (Consulta + Caso)',          color: '#FB923C' },
  { en: 'Divorce (Consult + Case)',             es: 'Divorcio (Consulta + Caso)',             color: '#86EFAC' },
  { en: 'Bankruptcy (Consult + Case)',          es: 'Bancarrota (Consulta + Caso)',           color: '#14B8A6' },
  { en: 'Offer in Compromise (Consult + Case)', es: 'Oferta de Compromiso (Consulta + Caso)', color: '#EAB308' },
  { en: 'General Consulting',                   es: 'Consulta General',                       color: '#F9A8D4' },
  { en: 'Other',                                es: 'Otro',                                   color: '#64748B' },
];

export const PREPARER_LEGEND: LegendEntry[] = [
  { en: 'Oraise Guardia', es: 'Oraise Guardia', color: '#92400E' },
  { en: 'Emely Bolivar',  es: 'Emely Bolivar',  color: '#6366F1' },
];
