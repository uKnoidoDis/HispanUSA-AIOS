'use client';

import React, { useMemo } from 'react';
import { formatTime } from '@/lib/utils';
import type { CalendarAppt } from './calendarTypes';

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOT_HEIGHT = 60;      // px per 30-min slot  (= 2 px/min)
const PX_PER_MIN  = SLOT_HEIGHT / 30;

const TYPE_LABELS: Record<string, string> = {
  personal_tax:          'Personal Tax',
  corporate_tax:         'Corporate Tax',
  professional_services: 'Professional',
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Overlap Layout Algorithm ─────────────────────────────────────────────────

interface PositionedAppt {
  appt: CalendarAppt;
  top: number;
  height: number;
  leftFrac: number;
  widthFrac: number;
}

function timeToMin(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function layoutDayAppts(appts: CalendarAppt[], startHour: number): PositionedAppt[] {
  if (appts.length === 0) return [];

  // Sort by start time, then longer duration first
  const sorted = [...appts].sort((a, b) => {
    const diff = timeToMin(a.start_time) - timeToMin(b.start_time);
    if (diff !== 0) return diff;
    return (timeToMin(b.end_time) - timeToMin(b.start_time)) -
           (timeToMin(a.end_time) - timeToMin(a.start_time));
  });

  // Greedy column assignment: assign each appointment to the first column
  // whose last appointment has already ended
  const colEndTimes: number[] = [];
  const colAssignments: number[] = [];

  for (const appt of sorted) {
    const startMin = timeToMin(appt.start_time);
    const endMin   = timeToMin(appt.end_time);

    let col = colEndTimes.findIndex(e => e <= startMin);
    if (col === -1) {
      col = colEndTimes.length;
      colEndTimes.push(endMin);
    } else {
      colEndTimes[col] = endMin;
    }
    colAssignments.push(col);
  }

  const numCols = colEndTimes.length;

  return sorted.map((appt, i) => {
    const startMin = timeToMin(appt.start_time);
    const endMin   = timeToMin(appt.end_time);
    const col      = colAssignments[i];

    return {
      appt,
      top:       (startMin - startHour * 60) * PX_PER_MIN,
      height:    Math.max((endMin - startMin) * PX_PER_MIN, 28),
      leftFrac:  col / numCols,
      widthFrac: 1 / numCols,
    };
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface WeekViewProps {
  days: Date[];                 // 1 day (day view) or 5–6 days (week view)
  startHour: number;            // 9
  endHour: number;              // 17 or 19
  appointments: CalendarAppt[];
  hiddenPreparerIds: Set<string>;
  selectedId: string | null;
  onSelect: (appt: CalendarAppt) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeekView({
  days,
  startHour,
  endHour,
  appointments,
  hiddenPreparerIds,
  selectedId,
  onSelect,
}: WeekViewProps) {
  const totalMinutes = (endHour - startHour) * 60;
  const gridHeight   = totalMinutes * PX_PER_MIN;
  const todayStr     = new Date().toISOString().slice(0, 10);

  // Group visible appointments by date
  const apptsByDate = useMemo(() => {
    const map = new Map<string, CalendarAppt[]>();
    for (const day of days) {
      map.set(day.toISOString().slice(0, 10), []);
    }
    for (const appt of appointments) {
      if (hiddenPreparerIds.has(appt.preparer_id)) continue;
      const list = map.get(appt.date);
      if (list) list.push(appt);
    }
    return map;
  }, [appointments, days, hiddenPreparerIds]);

  // Hour labels for the time axis
  const hourLines = Array.from({ length: (endHour - startHour) + 1 }, (_, i) => {
    const h    = startHour + i;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr   = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return { label: `${hr}:00 ${ampm}`, top: i * SLOT_HEIGHT * 2 };
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Day headers (sticky) ─────────────────────────────────────────── */}
      <div className="flex flex-shrink-0 border-b border-gray-200 bg-white">
        {/* Time gutter spacer */}
        <div className="w-16 flex-shrink-0 border-r border-gray-200" />

        {days.map((day, i) => {
          const dateStr = day.toISOString().slice(0, 10);
          const isToday = dateStr === todayStr;
          const dayIdx  = day.getDay();
          const name    = DAY_NAMES[dayIdx === 0 ? 6 : dayIdx - 1];

          return (
            <div
              key={dateStr}
              className={`flex-1 text-center py-3 border-r border-gray-200 last:border-r-0 ${
                isToday ? 'bg-blue-50' : ''
              }`}
            >
              <p className={`text-xs font-semibold uppercase tracking-widest ${
                isToday ? 'text-[#1B3A5C]' : 'text-gray-400'
              }`}>
                {name}
              </p>
              <div className="flex justify-center mt-1">
                <span className={`text-xl font-bold w-9 h-9 flex items-center justify-center rounded-full ${
                  isToday
                    ? 'bg-[#1B3A5C] text-white'
                    : 'text-gray-800'
                }`}>
                  {day.getDate()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Scrollable time grid ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: gridHeight }}>

          {/* Time axis */}
          <div className="w-16 flex-shrink-0 relative border-r border-gray-200 bg-white">
            {hourLines.map(({ label, top }, i) => (
              <div
                key={i}
                className="absolute right-0 left-0 flex justify-end pr-2"
                style={{ top: top - 9 }}
              >
                <span className="text-[11px] text-gray-400 font-medium leading-none">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dateStr  = day.toISOString().slice(0, 10);
            const isToday  = dateStr === todayStr;
            const dayAppts = apptsByDate.get(dateStr) ?? [];
            const positioned = layoutDayAppts(dayAppts, startHour);

            return (
              <div
                key={dateStr}
                className={`flex-1 relative border-r border-gray-200 last:border-r-0 ${
                  isToday ? 'bg-blue-50/20' : ''
                }`}
                style={{ height: gridHeight }}
              >
                {/* Hour lines (solid) and half-hour lines (dashed) */}
                {Array.from({ length: (endHour - startHour) * 2 }, (_, i) => (
                  <div
                    key={i}
                    className={`absolute left-0 right-0 ${
                      i % 2 === 0
                        ? 'border-t border-gray-200'
                        : 'border-t border-gray-100 border-dashed'
                    }`}
                    style={{ top: i * SLOT_HEIGHT }}
                  />
                ))}
                {/* Final hour line at bottom */}
                <div
                  className="absolute left-0 right-0 border-t border-gray-200"
                  style={{ top: gridHeight }}
                />

                {/* Appointment blocks */}
                {positioned.map(({ appt, top, height, leftFrac, widthFrac }) => {
                  const color      = appt.preparer?.color_hex ?? '#94A3B8';
                  const isPending  = appt.status === 'pending';
                  const isCancelled = appt.status === 'cancelled';
                  const isSelected = appt.id === selectedId;
                  const typeLabel  = TYPE_LABELS[appt.appointment_type] ?? '';

                  return (
                    <button
                      key={appt.id}
                      onClick={() => onSelect(appt)}
                      title={`${appt.client_name} · ${appt.appointment_type.replace(/_/g, ' ')} · ${formatTime(appt.start_time)}`}
                      className={`absolute text-left rounded-md overflow-hidden transition-all duration-150 focus:outline-none group ${
                        isCancelled ? 'opacity-40' : 'hover:brightness-[0.97] hover:shadow-md'
                      } ${
                        isSelected ? 'ring-2 ring-[#0F2137] ring-offset-1 z-20' : 'z-10 hover:z-20'
                      }`}
                      style={{
                        top:    `${top + 1}px`,
                        height: `${height - 2}px`,
                        left:   `calc(${leftFrac * 100}% + 3px)`,
                        width:  `calc(${widthFrac * 100}% - 6px)`,
                        backgroundColor: `${color}1A`,
                        ...(isPending
                          ? { border: `2px dashed ${color}` }
                          : { borderLeft: `4px solid ${color}` }
                        ),
                      }}
                    >
                      {/* Pending pulse indicator */}
                      {isPending && (
                        <span
                          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse"
                          style={{ backgroundColor: color }}
                        />
                      )}

                      <div className="px-2 py-1 h-full overflow-hidden">
                        <p
                          className="text-xs font-bold leading-tight truncate"
                          style={{ color }}
                        >
                          {appt.client_name}
                        </p>
                        {height > 38 && (
                          <p
                            className="text-[10px] leading-tight truncate mt-0.5"
                            style={{ color, opacity: 0.7 }}
                          >
                            {formatTime(appt.start_time)} · {typeLabel}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
