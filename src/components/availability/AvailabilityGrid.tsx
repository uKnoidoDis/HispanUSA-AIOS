'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { format } from 'date-fns';
import type { Preparer, SlotWithMeta } from '@/types/scheduling';
import { formatTimeDisplay, slotKey, addThirtyMinutes } from '@/lib/availability-utils';
import { isBookableEastern, easternDateString, hasSlotStartedEastern } from '@/lib/utils';

// How often to recompute expiry. Expiry is derived at render time from the
// current instant, but React does not re-render as the clock moves, so a 10:00
// slot would keep rendering as Open past 10:00 until some unrelated state
// change forced a render. This interval makes expiry visible as time passes.
// 30s is ample granularity for 30-minute slots. Nothing is stored or written.
const EXPIRY_TICK_MS = 30_000;

// -----------------------------------------------------------------------
// Lock icon (inline — no external icon library)
// -----------------------------------------------------------------------
function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

// Find the nearest scrollable ancestor (robust to the page/layout owning the scroll)
function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let p = el?.parentElement ?? null;
  while (p) {
    const oy = getComputedStyle(p).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight) return p;
    p = p.parentElement;
  }
  return (document.scrollingElement as HTMLElement) ?? document.documentElement;
}

// Approx. height of the sticky header row — used so ~8 AM lands just below it.
const HEADER_OFFSET = 56;

// -----------------------------------------------------------------------
// Grid props
// -----------------------------------------------------------------------
interface AvailabilityGridProps {
  weekDays: Date[];
  timeSlots: string[];     // e.g. ['05:00:00', '05:30:00', ...]
  slots: Map<string, SlotWithMeta>;
  selectedPreparer: Preparer;
  loadingCells: Set<string>;
  onCellClick: (date: string, startTime: string, slot: SlotWithMeta | null) => void;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Per-cell membership inside a contiguous run of open (unbooked) slots.
type RunPos = 'single' | 'start' | 'mid' | 'end';
interface RunInfo {
  pos: RunPos;
  label: string; // e.g. "9:00 AM – 5:00 PM"
}

// -----------------------------------------------------------------------
// Main grid component
// -----------------------------------------------------------------------
export default function AvailabilityGrid({
  weekDays,
  timeSlots,
  slots,
  selectedPreparer,
  loadingCells,
  onCellClick,
}: AvailabilityGridProps) {
  // Re-render every EXPIRY_TICK_MS so slots visibly expire as their start time
  // passes, without a reload. The counter value is intentionally unused: the
  // state update alone is what triggers recomputation of the derived expiry.
  const [, setNowTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNowTick(t => t + 1), EXPIRY_TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Eastern "today" — Applied Learning #21: never derive today from local/UTC
  // now (evening drift); easternDateString() is the canonical rule.
  const todayStr = easternDateString();
  const colCount = weekDays.length;

  // Time column is 72px; each day column splits the remaining space equally
  const gridTemplate = `72px repeat(${colCount}, minmax(80px, 1fr))`;

  // ── Auto-scroll to ~8 AM on mount (initial position only) ─────────────
  const eightRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = eightRef.current;
    if (!row) return;
    const scroller = getScrollParent(row);
    if (!scroller) return;
    const scrollerTop =
      scroller === document.scrollingElement ? 0 : scroller.getBoundingClientRect().top;
    const rowTop = row.getBoundingClientRect().top;
    scroller.scrollTop += rowTop - scrollerTop - HEADER_OFFSET;
  }, []);

  // ── Compute contiguous open-slot runs per day (visual merge) ──────────
  const runInfo = useMemo(() => {
    const info = new Map<string, RunInfo>();

    for (const day of weekDays) {
      const dateStr = format(day, 'yyyy-MM-dd');
      let runStart = -1; // index into timeSlots where the current run began

      const flush = (endIdx: number) => {
        if (runStart < 0) return;
        const startTime = timeSlots[runStart];
        const endTime = addThirtyMinutes(timeSlots[endIdx]);
        const label = `${formatTimeDisplay(startTime)} – ${formatTimeDisplay(endTime)}`;
        for (let i = runStart; i <= endIdx; i++) {
          const pos: RunPos =
            runStart === endIdx ? 'single' : i === runStart ? 'start' : i === endIdx ? 'end' : 'mid';
          info.set(slotKey(dateStr, timeSlots[i]), { pos, label });
        }
        runStart = -1;
      };

      timeSlots.forEach((t, idx) => {
        const slot = slots.get(slotKey(dateStr, t));
        const isOpen = !!slot && !slot.is_booked;
        if (isOpen) {
          if (runStart < 0) runStart = idx;
        } else {
          flush(idx - 1);
        }
      });
      flush(timeSlots.length - 1);
    }

    return info;
  }, [weekDays, timeSlots, slots]);

  return (
    <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="min-w-fit">
        {/* ── Header row ─────────────────────────────────────────────── */}
        <div
          className="grid sticky top-0 z-10 bg-white border-b border-gray-200"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {/* Time gutter header */}
          <div className="px-2 py-3 border-r border-gray-100" />

          {weekDays.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isToday = dateStr === todayStr;
            return (
              <div
                key={dateStr}
                className={`
                  px-2 py-3 text-center border-r border-gray-100 last:border-r-0
                  ${isToday ? 'bg-[#EDF2F8]' : ''}
                `}
              >
                <div
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    isToday ? 'text-[#03296A]' : 'text-gray-400'
                  }`}
                >
                  {DAY_NAMES[i]}
                </div>
                <div
                  className={`text-sm font-bold mt-0.5 ${
                    isToday ? 'text-[#03296A]' : 'text-gray-700'
                  }`}
                >
                  {format(day, 'M/d')}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Time rows ──────────────────────────────────────────────── */}
        {timeSlots.map(startTime => {
          const isHourBoundary = startTime.endsWith(':00:00');
          const isEightAm = startTime === '08:00:00';

          return (
            <div
              key={startTime}
              ref={isEightAm ? eightRef : undefined}
              className="grid"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              {/* Time gutter — label every half-hour */}
              <div
                className={`
                  flex items-center justify-end pr-3 h-10 border-r border-gray-100 flex-shrink-0
                  border-b border-gray-100 ${isHourBoundary ? 'border-t border-gray-200' : ''}
                  text-xs ${isHourBoundary ? 'font-medium text-gray-500' : 'text-gray-400'}
                `}
              >
                {formatTimeDisplay(startTime)}
              </div>

              {/* One cell per day */}
              {weekDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const key = slotKey(dateStr, startTime);
                const slot = slots.get(key) ?? null;
                const isLoading = loadingCells.has(key);
                const isToday = dateStr === todayStr;

                return (
                  <SlotCell
                    key={dateStr}
                    slot={slot}
                    isLoading={isLoading}
                    isToday={isToday}
                    cannotOpen={!isBookableEastern(dateStr, startTime)}
                    isExpired={hasSlotStartedEastern(dateStr, startTime)}
                    isHourBoundary={isHourBoundary}
                    preparerColor="#03296A"
                    run={slot && !slot.is_booked ? runInfo.get(key) ?? null : null}
                    onClick={() => onCellClick(dateStr, startTime, slot)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Diagonal hatch for the expired state. Nothing else in the grid is hatched, so
// it reads as a deliberate "this is switched off" treatment rather than as a
// rendering glitch, which flat opacity alone does not achieve.
const EXPIRED_HATCH =
  'repeating-linear-gradient(45deg, #E2E8F0 0px, #E2E8F0 6px, #CBD5E1 6px, #CBD5E1 12px)';

// -----------------------------------------------------------------------
// Individual cell component
// Four visual states: empty | open | expired | booked
// -----------------------------------------------------------------------
interface SlotCellProps {
  slot: SlotWithMeta | null;
  isLoading: boolean;
  isToday: boolean;
  // 15-min booking lead: an EMPTY cell this close to its start can no longer be
  // opened, mirroring the API's 400 from the write-time guard.
  cannotOpen: boolean;
  // Zero lead: this slot's own start time has passed. Drives the expired state.
  isExpired: boolean;
  isHourBoundary: boolean;
  preparerColor: string;    // preparer's hex color
  run: RunInfo | null;      // run membership for open slots (visual merge)
  onClick: () => void;
}

function SlotCell({
  slot,
  isLoading,
  isToday,
  cannotOpen,
  isExpired,
  isHourBoundary,
  preparerColor,
  run,
  onClick,
}: SlotCellProps) {
  const state = slot === null ? 'empty' : slot.is_booked ? 'booked' : 'open';

  // Horizontal dividers live on the cell now (so open runs can hide them).
  const hBorder = `border-b border-gray-100 ${isHourBoundary ? 'border-t border-gray-200' : ''}`;

  // ── BOOKED: locked, shows first name, not clickable ─────────────────
  if (state === 'booked') {
    return (
      <div
        className={`
          h-10 border-r border-gray-100 last:border-r-0 ${hBorder}
          flex items-center gap-1.5 px-2 cursor-not-allowed
          ${isToday ? 'bg-gray-400/60' : 'bg-gray-300'}
        `}
        title={slot?.client_name ? `Booked: ${slot.client_name}` : 'Booked'}
      >
        <LockIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
        {slot?.client_name && (
          <span className="text-xs font-medium text-gray-700 truncate leading-none">
            {slot.client_name.split(' ')[0]}
          </span>
        )}
      </div>
    );
  }

  // ── EXPIRED (open slot whose start time has passed): greyed, hatched and
  // LOCKED. Rendered as a div, not a button, so it cannot be selected, edited
  // or booked. Bulk cleanup still works: Clear Day / Clear Week delete unbooked
  // slots regardless of date. Booked slots fall through to the booked branch
  // below and keep their existing treatment, since a past booked slot is a
  // historical record rather than a problem.
  if (state === 'open' && isExpired) {
    const pos = run?.pos ?? 'single';
    const showLabel = pos === 'start' || pos === 'single';
    const rounding = `${pos === 'start' || pos === 'single' ? 'rounded-t-md' : ''} ${
      pos === 'end' || pos === 'single' ? 'rounded-b-md' : ''
    }`;

    return (
      <div
        aria-disabled="true"
        className={`
          relative h-10 w-full border-r border-gray-100 last:border-r-0 ${rounding}
          overflow-hidden cursor-not-allowed select-none
        `}
        style={{ background: EXPIRED_HATCH }}
        title={run ? `${run.label} · Expired, this time has passed` : 'Expired, this time has passed'}
      >
        <span className="flex items-center h-full gap-1 px-1.5">
          <LockIcon className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
          {showLabel && (
            <span className="text-[11px] font-semibold leading-tight truncate text-slate-600">
              <span className="line-through">{run?.label}</span> · Expired
            </span>
          )}
        </span>
      </div>
    );
  }

  // ── OPEN: solid preparer fill, merged into a block, clickable to close ─
  if (state === 'open') {
    const pos = run?.pos ?? 'single';
    const showLabel = pos === 'start' || pos === 'single';
    const rounding = `${pos === 'start' || pos === 'single' ? 'rounded-t-md' : ''} ${
      pos === 'end' || pos === 'single' ? 'rounded-b-md' : ''
    }`;

    return (
      <button
        onClick={onClick}
        disabled={isLoading}
        className={`
          relative h-10 w-full border-r border-gray-100 last:border-r-0 ${rounding}
          overflow-hidden transition-all duration-150 focus:outline-none
          focus-visible:ring-2 focus-visible:ring-offset-1
          ${isLoading ? 'opacity-60 cursor-wait' : 'hover:brightness-95 active:brightness-90 cursor-pointer'}
        `}
        style={{ backgroundColor: preparerColor, color: '#FFFFFF' }}
        title={run ? `${run.label} · Open — click to close this slot` : 'Click to close this slot'}
      >
        {isLoading ? (
          <span className="flex items-center justify-center h-full">
            <span className="h-1.5 w-1.5 rounded-full animate-pulse bg-white" />
          </span>
        ) : (
          showLabel && (
            <span className="flex items-start h-full px-1.5 pt-1">
              <span
                className="text-[11px] font-semibold leading-tight truncate"
                style={{ color: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}
              >
                {run?.label} · Open
              </span>
            </span>
          )
        )}
      </button>
    );
  }

  // ── EMPTY + too late to open: dimmed, not clickable. Availability can't be
  // created for a time that already passed. This uses the 15-minute BOOKING
  // lead (cannotOpen), not the zero-lead expiry rule, so it stays an exact
  // mirror of the API's 400 from the write-time guard in POST /api/availability.
  // Loosening it to zero lead would offer a click the server rejects.
  if (cannotOpen) {
    return (
      <div
        className={`
          h-10 border-r border-gray-100 last:border-r-0 ${hBorder}
          bg-gray-50 cursor-not-allowed
        `}
        title="This time has passed"
        aria-disabled="true"
      />
    );
  }

  // ── EMPTY: blank, clickable to open ─────────────────────────────────
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
        h-10 border-r border-gray-100 last:border-r-0 ${hBorder} w-full group
        transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#03296A] focus-visible:ring-offset-1
        ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
        ${isToday ? 'bg-[#EDF2F8]/30 hover:bg-[#EDF2F8]/70' : 'bg-white hover:bg-gray-50'}
      `}
      title="Click to open this slot"
    >
      {isLoading && (
        <div className="flex items-center justify-center h-full">
          <div className="h-1.5 w-1.5 rounded-full bg-gray-300 animate-pulse" />
        </div>
      )}
    </button>
  );
}

// -----------------------------------------------------------------------
// Skeleton — shown while initial data is loading
// -----------------------------------------------------------------------
export function AvailabilityGridSkeleton({
  colCount = 7,
  rowCount = 16,
}: {
  colCount?: number;
  rowCount?: number;
}) {
  const gridTemplate = `72px repeat(${colCount}, minmax(80px, 1fr))`;

  return (
    <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm animate-pulse">
      <div className="min-w-fit">
        {/* Header skeleton */}
        <div
          className="grid border-b border-gray-200"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <div className="h-14 border-r border-gray-100 bg-gray-50" />
          {Array.from({ length: colCount }).map((_, i) => (
            <div key={i} className="h-14 border-r border-gray-100 last:border-r-0 bg-gray-50 p-3">
              <div className="h-2.5 bg-gray-200 rounded w-8 mx-auto mb-1.5" />
              <div className="h-3 bg-gray-200 rounded w-10 mx-auto" />
            </div>
          ))}
        </div>

        {/* Row skeletons */}
        {Array.from({ length: rowCount }).map((_, row) => (
          <div
            key={row}
            className="grid border-b border-gray-100 last:border-b-0"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div className="h-10 border-r border-gray-100 flex items-center justify-end pr-3">
              {row % 2 === 0 && (
                <div className="h-2 bg-gray-200 rounded w-12" />
              )}
            </div>
            {Array.from({ length: colCount }).map((_, col) => (
              <div
                key={col}
                className="h-10 border-r border-gray-100 last:border-r-0"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
