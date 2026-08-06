import { format, differenceInCalendarDays, parseISO } from 'date-fns';

export function formatDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD
  const date = parseISO(dateStr);
  return format(date, 'MMMM d, yyyy');
}

export function formatDateShort(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, 'MM/dd/yyyy');
}

export function formatTime(timeStr: string): string {
  // timeStr is HH:MM:SS or HH:MM
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  return `+${digits}`;
}

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseISO(dateStr);
  return differenceInCalendarDays(target, today);
}

// HispanUSA operates in America/New_York. Returns the Eastern calendar date
// (YYYY-MM-DD) for the given instant — identical on the client (any browser
// timezone) and the server (Vercel runs UTC), so "today" never rolls a day
// early in the Eastern evening (the UTC-vs-local bug). Use this for every
// now-based "today" computation that drives highlights, booking, or availability.
export function easternDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(d);
}

export function todayString(): string {
  return easternDateString();
}

// Returns the Eastern wall-clock time (HH:MM:SS, 24-hour) for the given instant —
// the time-of-day companion to easternDateString(). Identical on client and server
// because the timeZone is pinned to America/New_York regardless of host TZ.
export function easternTimeString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(d);
}

// A slot must stop being bookable this many minutes BEFORE its start time. A client
// can't realistically book-and-arrive in under this window, and it absorbs the gap
// between the picker rendering and the booking POST landing. Single tunable constant.
export const BOOKING_LEAD_MINUTES = 15;

// The single source of truth for "is this (date, start_time) slot still bookable?"
// Derived, read-time only — never persisted (is_booked means "claimed", not "expired").
// Bookable iff the slot starts at least BOOKING_LEAD_MINUTES from now in Eastern time:
//   - future date  -> always bookable (no time check on later days)
//   - today        -> start_time must be >= (now + lead) in Eastern
//   - past date    -> never bookable
// start_time/date are zero-padded (YYYY-MM-DD / HH:MM:SS), so string compare is exact
// and matches the DATE/TIME column formats.
export function isBookableEastern(
  date: string,
  startTime: string,
  leadMinutes: number = BOOKING_LEAD_MINUTES,
): boolean {
  const normalized = startTime.length === 5 ? `${startTime}:00` : startTime;
  const cutoff = new Date(Date.now() + leadMinutes * 60_000);
  const cutoffDate = easternDateString(cutoff);
  if (date > cutoffDate) return true;
  if (date < cutoffDate) return false;
  return normalized >= easternTimeString(cutoff);
}

// Has this slot's own start time already passed in Eastern? The STAFF-VIEW
// expiry rule, deliberately distinct from bookability:
//
//   isBookableEastern(d, t)      -> can a client still book it? 15-min lead.
//   hasSlotStartedEastern(d, t)  -> has its start time passed?  ZERO lead.
//
// A 10:00 slot stops being bookable at 09:45 but is not expired until 10:00.
// Both are correct answers to different questions, so they must not share a
// predicate. Implemented by reusing isBookableEastern with leadMinutes = 0 so
// there is exactly one Eastern comparison in the codebase, not two.
//
// Derived, read-time only. Never persisted: there is no expiry column and
// nothing writes on a schedule.
export function hasSlotStartedEastern(date: string, startTime: string): boolean {
  return !isBookableEastern(date, startTime, 0);
}

// Whole days from one YYYY-MM-DD to another, both parsed as UTC midnight so the
// arithmetic is pure calendar math with no host-timezone influence.
//
// Use this instead of daysUntil() for anything Eastern-anchored: daysUntil()
// builds "today" from local new Date()+setHours, which drifts a day in the
// Eastern evening (Applied Learning #21). Pass easternDateString() as `from`.
export function daysBetweenDateStrings(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

export function addDaysToDate(dateStr: string, days: number): string {
  const date = parseISO(dateStr);
  date.setDate(date.getDate() + days);
  return format(date, 'yyyy-MM-dd');
}

// True iff dateStr (YYYY-MM-DD) is a real calendar date (2026-02-30 fails the
// round-trip), not in the future (Eastern "today" is the boundary), and not
// more than 120 years past. Server-side DOB sanity for spouse/dependent rows —
// the Zod regex only guarantees shape, not validity.
export function isPlausibleDob(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  if (
    parsed.getUTCFullYear() !== y ||
    parsed.getUTCMonth() !== m - 1 ||
    parsed.getUTCDate() !== d
  ) return false;
  const today = easternDateString();
  if (dateStr > today) return false;
  const floor = `${Number(today.slice(0, 4)) - 120}${today.slice(4)}`;
  return dateStr >= floor;
}
