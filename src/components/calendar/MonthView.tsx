'use client';

import React, { useMemo } from 'react';
import type { CalendarAppt } from './calendarTypes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonthGridDays(year: number, month: number): Date[] {
  // month is 0-indexed (JS Date convention)
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);

  // Start grid on the Monday on or before the 1st
  const startDow = firstDay.getDay(); // 0=Sun, 1=Mon, …
  const startOffset = startDow === 0 ? -6 : 1 - startDow;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() + startOffset);

  // Always show 6 rows × 7 cols = 42 cells
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Props ────────────────────────────────────────────────────────────────────

interface MonthViewProps {
  currentDate: Date;
  appointments: CalendarAppt[];
  hiddenPreparerIds: Set<string>;
  onDayClick: (date: Date) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MonthView({
  currentDate,
  appointments,
  hiddenPreparerIds,
  onDayClick,
}: MonthViewProps) {
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const gridDays = useMemo(() => getMonthGridDays(year, month), [year, month]);
  const todayStr = new Date().toISOString().slice(0, 10);

  // Index appointments by date
  const apptsByDate = useMemo(() => {
    const map = new Map<string, CalendarAppt[]>();
    for (const appt of appointments) {
      if (hiddenPreparerIds.has(appt.preparer_id)) continue;
      const list = map.get(appt.date) ?? [];
      list.push(appt);
      map.set(appt.date, list);
    }
    return map;
  }, [appointments, hiddenPreparerIds]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-white flex-shrink-0">
        {WEEKDAY_LABELS.map(name => (
          <div key={name} className="py-2 text-center text-xs font-semibold uppercase tracking-widest text-gray-400 border-r border-gray-200 last:border-r-0">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 h-full" style={{ gridAutoRows: 'minmax(100px, 1fr)' }}>
          {gridDays.map((day, idx) => {
            const dateStr    = day.toISOString().slice(0, 10);
            const isToday    = dateStr === todayStr;
            const isThisMonth = day.getMonth() === month;
            const dayAppts   = apptsByDate.get(dateStr) ?? [];
            const maxVisible = 3;
            const overflow   = dayAppts.length - maxVisible;

            return (
              <button
                key={idx}
                onClick={() => onDayClick(day)}
                className={`text-left p-2 border-b border-r border-gray-200 transition-colors duration-100 hover:bg-[#EDF2F8] focus:outline-none group ${
                  isThisMonth ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                {/* Day number */}
                <div className="flex items-start justify-between mb-1.5">
                  <span
                    className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                      isToday
                        ? 'bg-[#1B3A5C] text-white'
                        : isThisMonth
                        ? 'text-gray-800 group-hover:bg-[#1B3A5C] group-hover:text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {/* Appointment chips */}
                <div className="space-y-0.5">
                  {dayAppts.slice(0, maxVisible).map(appt => {
                    const color     = appt.preparer?.color_hex ?? '#94A3B8';
                    const isPending = appt.status === 'pending';

                    return (
                      <div
                        key={appt.id}
                        className={`flex items-center gap-1 px-1 py-0.5 rounded text-[11px] leading-tight truncate ${
                          isPending ? 'opacity-70' : ''
                        }`}
                        style={{ backgroundColor: `${color}1A` }}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPending ? 'animate-pulse' : ''}`}
                          style={{ backgroundColor: color }}
                        />
                        <span className="truncate font-medium" style={{ color }}>
                          {appt.client_name}
                        </span>
                      </div>
                    );
                  })}

                  {overflow > 0 && (
                    <p className="text-[11px] text-gray-400 font-medium pl-1">
                      +{overflow} more
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
