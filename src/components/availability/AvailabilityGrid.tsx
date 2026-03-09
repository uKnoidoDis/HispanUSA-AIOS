'use client';

import React from 'react';
import { format } from 'date-fns';
import type { Preparer, SlotWithMeta } from '@/types/scheduling';
import { formatTimeDisplay, slotKey } from '@/lib/availability-utils';

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

// -----------------------------------------------------------------------
// Grid props
// -----------------------------------------------------------------------
interface AvailabilityGridProps {
  weekDays: Date[];
  timeSlots: string[];     // e.g. ['09:00:00', '09:30:00', ...]
  slots: Map<string, SlotWithMeta>;
  selectedPreparer: Preparer;
  loadingCells: Set<string>;
  onCellClick: (date: string, startTime: string, slot: SlotWithMeta | null) => void;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const colCount = weekDays.length;

  // Time column is 72px; each day column splits the remaining space equally
  const gridTemplate = `72px repeat(${colCount}, minmax(80px, 1fr))`;

  return (
    <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
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
                    isToday ? 'text-[#1B3A5C]' : 'text-gray-400'
                  }`}
                >
                  {DAY_NAMES[i]}
                </div>
                <div
                  className={`text-sm font-bold mt-0.5 ${
                    isToday ? 'text-[#1B3A5C]' : 'text-gray-700'
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
          // Show the time label only on the hour, not the half-hour
          const isHourBoundary = startTime.endsWith(':00:00');

          return (
            <div
              key={startTime}
              className={`
                grid border-b border-gray-100 last:border-b-0
                ${isHourBoundary ? 'border-t border-t-gray-200' : ''}
              `}
              style={{ gridTemplateColumns: gridTemplate }}
            >
              {/* Time gutter */}
              <div
                className={`
                  flex items-center justify-end pr-3 h-10 border-r border-gray-100 flex-shrink-0
                  text-xs ${isHourBoundary ? 'font-medium text-gray-500' : 'text-gray-300'}
                `}
              >
                {isHourBoundary ? formatTimeDisplay(startTime) : ''}
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
                    preparerColor={selectedPreparer.color_hex}
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

// -----------------------------------------------------------------------
// Individual cell component
// Three visual states: empty | open | booked
// -----------------------------------------------------------------------
interface SlotCellProps {
  slot: SlotWithMeta | null;
  isLoading: boolean;
  isToday: boolean;
  preparerColor: string;    // preparer's hex color
  onClick: () => void;
}

function SlotCell({ slot, isLoading, isToday, preparerColor, onClick }: SlotCellProps) {
  const state = slot === null ? 'empty' : slot.is_booked ? 'booked' : 'open';

  // ── BOOKED: locked, shows first name, not clickable ─────────────────
  if (state === 'booked') {
    return (
      <div
        className={`
          h-10 border-r border-gray-100 last:border-r-0
          flex items-center gap-1 px-2
          cursor-not-allowed bg-gray-100
          ${isToday ? 'bg-gray-200/60' : ''}
        `}
        title={slot?.client_name ? `Booked: ${slot.client_name}` : 'Booked'}
      >
        <LockIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
        {slot?.client_name && (
          <span className="text-xs text-gray-500 truncate leading-none">
            {slot.client_name.split(' ')[0]}
          </span>
        )}
      </div>
    );
  }

  // ── OPEN: colored, clickable to close ───────────────────────────────
  if (state === 'open') {
    // Use the preparer's color at 25% opacity for the fill,
    // and the full color as a bottom border stripe for accessibility
    const bgColor = `${preparerColor}40`;   // ~25% alpha
    const borderColor = preparerColor;

    return (
      <button
        onClick={onClick}
        disabled={isLoading}
        className={`
          h-10 border-r border-gray-100 last:border-r-0 w-full
          transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
          ${isLoading ? 'opacity-50 cursor-wait' : 'hover:brightness-95 active:brightness-75 cursor-pointer'}
        `}
        style={{
          backgroundColor: bgColor,
          borderBottom: `2px solid ${borderColor}`,
        }}
        title="Click to close this slot"
      >
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: preparerColor }}
            />
          </div>
        )}
      </button>
    );
  }

  // ── EMPTY: blank, clickable to open ─────────────────────────────────
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
        h-10 border-r border-gray-100 last:border-r-0 w-full group
        transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A5C] focus-visible:ring-offset-1
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
  colCount = 5,
  rowCount = 16,
}: {
  colCount?: number;
  rowCount?: number;
}) {
  const gridTemplate = `72px repeat(${colCount}, minmax(80px, 1fr))`;

  return (
    <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm animate-pulse">
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
