// ─── Calendar Color Helpers ──────────────────────────────────────────────────
// Preparer fills span light (orange/green) to dark (brown), so a single text
// color can't stay readable on all of them. readableTextColor() picks whichever
// of near-black or white has the higher WCAG contrast on a given fill, keeping
// appointment text ≥ 4.5:1 (WCAG AA) per the HispanUSA brand skill.

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
