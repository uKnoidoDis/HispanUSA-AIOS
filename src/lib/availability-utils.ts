import { addDays, startOfWeek, format } from 'date-fns';
import type { SlotPreset } from '@/types/scheduling';

// -----------------------------------------------------------------------
// Tax season: Jan 15 – Apr 15. Extends calendar to Mon-Sat + 9 AM-7 PM.
// -----------------------------------------------------------------------
export function isTaxSeason(date: Date = new Date()): boolean {
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();
  if (month === 1 && day >= 15) return true;
  if (month === 2 || month === 3) return true;
  if (month === 4 && day <= 15) return true;
  return false;
}

// -----------------------------------------------------------------------
// Week helpers — always Mon-based
// -----------------------------------------------------------------------
export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

// Returns Mon-Fri (5 days) or Mon-Sat (6 days) depending on includeSaturday
export function getWeekDays(weekStart: Date, includeSaturday: boolean): Date[] {
  const count = includeSaturday ? 6 : 5;
  return Array.from({ length: count }, (_, i) => addDays(weekStart, i));
}

// -----------------------------------------------------------------------
// Time slot generation
// Generates 30-min start times from startHour (inclusive) up to endHour (exclusive).
// e.g. generateTimeSlots(9, 12) → ['09:00:00', '09:30:00', '10:00:00', '10:30:00', '11:00:00', '11:30:00']
// -----------------------------------------------------------------------
export function generateTimeSlots(startHour: number, endHourExclusive: number): string[] {
  const slots: string[] = [];
  let h = startHour;
  let m = 0;
  while (h < endHourExclusive) {
    slots.push(
      `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
    );
    m += 30;
    if (m >= 60) {
      m = 0;
      h++;
    }
  }
  return slots;
}

// -----------------------------------------------------------------------
// Preset definitions
// -----------------------------------------------------------------------
export const PRESET_RANGES: Record<SlotPreset, [number, number]> = {
  morning:      [9, 12],   // 9:00 AM – 12:00 PM  (6 slots)
  afternoon:    [12, 17],  // 12:00 PM – 5:00 PM  (10 slots)
  full_day:     [9, 17],   // 9:00 AM – 5:00 PM   (16 slots)
  full_day_tax: [9, 19],   // 9:00 AM – 7:00 PM   (20 slots)
};

export const PRESET_LABELS: Record<SlotPreset, string> = {
  morning:      'Open Morning',
  afternoon:    'Open Afternoon',
  full_day:     'Open Full Day',
  full_day_tax: 'Open Full Day (Tax Season)',
};

export function getPresetStartTimes(preset: SlotPreset): string[] {
  const [start, end] = PRESET_RANGES[preset];
  return generateTimeSlots(start, end);
}

// -----------------------------------------------------------------------
// Time formatting
// -----------------------------------------------------------------------

// '09:00:00' → '9:00 AM'   |   '13:30:00' → '1:30 PM'
export function formatTimeDisplay(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

// Add 30 minutes to an HH:MM:SS string — used to compute end_time
export function addThirtyMinutes(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const total = h * 60 + m + 30;
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:00`;
}

// Build the Map lookup key from a date string + start_time string
export function slotKey(date: string, startTime: string): string {
  return `${date}_${startTime}`;
}

// Format a week range for display: 'Mar 9 – 15'
export function formatWeekLabel(weekDays: Date[]): string {
  if (weekDays.length === 0) return '';
  const first = weekDays[0];
  const last = weekDays[weekDays.length - 1];
  const sameMonth = format(first, 'M') === format(last, 'M');
  return sameMonth
    ? `${format(first, 'MMM d')} – ${format(last, 'd')}`
    : `${format(first, 'MMM d')} – ${format(last, 'MMM d')}`;
}
