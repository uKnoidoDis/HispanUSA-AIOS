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

export function addDaysToDate(dateStr: string, days: number): string {
  const date = parseISO(dateStr);
  date.setDate(date.getDate() + days);
  return format(date, 'yyyy-MM-dd');
}
