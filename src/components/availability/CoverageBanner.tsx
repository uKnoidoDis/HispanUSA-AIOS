'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import { COVERAGE_WARNING_DAYS } from '@/lib/availability-utils';
import { daysBetweenDateStrings } from '@/lib/utils';

export interface CoverageData {
  /** Furthest-out date with an open, unbooked, not-yet-started slot. Null means
   *  there is no open future availability at all. This is the sole coverage signal. */
  last_open_date: string | null;
  /** Exact count of today's slots that are open and have not started yet. */
  live_slots_today: number;
  /** Eastern calendar date the server computed against. Runway is measured from this. */
  today: string;
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.33 16a2 2 0 001.74 3z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Coverage banner
//
// Three states, driven entirely by how far out open availability runs:
//   1. Runway >= COVERAGE_WARNING_DAYS  -> renders NOTHING (no standing noise)
//   2. Runway <  COVERAGE_WARNING_DAYS  -> amber, names the end date
//   3. No open future availability      -> red, larger, stated plainly
//
// Runway is computed with daysBetweenDateStrings against the Eastern "today"
// the server returned, NOT daysUntil(), which builds today from local time and
// drifts a day in the Eastern evening (Applied Learning #21).
// ---------------------------------------------------------------------------
export default function CoverageBanner({ data }: { data: CoverageData | null }) {
  if (!data) return null; // loading or failed: say nothing rather than guess

  // ── State 3: nothing open at all ────────────────────────────────────────
  if (data.last_open_date === null) {
    return (
      <div
        role="alert"
        className="mb-4 flex items-start gap-3 rounded-xl border-2 border-red-300 bg-red-50 px-5 py-4 shadow-sm"
      >
        <WarningIcon className="h-6 w-6 flex-shrink-0 text-red-600 mt-0.5" />
        <div>
          <p className="text-base font-bold text-red-800">No open availability</p>
          <p className="mt-1 text-sm text-red-700">
            There are no open slots on any preparer&apos;s calendar. Clients cannot book an
            appointment at all right now, and the booking page will show nothing available. Open
            availability below to fix this.
          </p>
        </div>
      </div>
    );
  }

  const daysLeft = daysBetweenDateStrings(data.today, data.last_open_date);

  // ── State 1: plenty of runway, stay quiet ───────────────────────────────
  if (daysLeft >= COVERAGE_WARNING_DAYS) return null;

  // ── State 2: running out ────────────────────────────────────────────────
  const endLabel = format(parseISO(data.last_open_date), 'EEEE, MMMM d');
  const dayPhrase =
    daysLeft <= 0
      ? 'today is the last day'
      : daysLeft === 1
        ? '1 day of availability left'
        : `${daysLeft} days of availability left`;

  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-sm"
    >
      <WarningIcon className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
      <p className="text-sm text-amber-800">
        <span className="font-semibold">Open availability is running out ({dayPhrase}).</span>{' '}
        There is no open availability after <span className="font-semibold">{endLabel}</span>.
        Clients will not be able to book beyond that date.
      </p>
    </div>
  );
}
