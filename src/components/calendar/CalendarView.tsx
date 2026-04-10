'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sun, Layers } from 'lucide-react';
import WeekView from './WeekView';
import MonthView from './MonthView';
import AppointmentSidePanel from './AppointmentSidePanel';
import type { CalendarAppt, CalendarPreparer, CalendarViewMode } from './calendarTypes';

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function isTaxSeason(date: Date): boolean {
  const m = date.getMonth() + 1; // 1-indexed
  const d = date.getDate();
  return (m === 1 && d >= 15) || m === 2 || m === 3 || (m === 4 && d <= 15);
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow  = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow; // back to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatWeekRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return start.toLocaleDateString('en-US', { month: 'long' })
      + ` ${start.getDate()}–${end.getDate()}, `
      + start.getFullYear();
  }
  return (
    start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    + ' – '
    + end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  );
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarView() {
  const [viewMode,    setViewMode   ] = useState<CalendarViewMode>('week');
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const [appointments, setAppointments] = useState<CalendarAppt[]>([]);
  const [preparers,    setPreparers   ] = useState<CalendarPreparer[]>([]);
  const [loading,      setLoading     ] = useState(false);
  const [fetchError,   setFetchError  ] = useState(false);

  const [hiddenPrepIds,  setHiddenPrepIds ] = useState<Set<string>>(new Set());
  const [selectedAppt,   setSelectedAppt  ] = useState<CalendarAppt | null>(null);

  // Derived values
  const taxSeason = isTaxSeason(currentDate);
  const startHour = 9;
  const endHour   = taxSeason ? 19 : 17;
  const numDays   = viewMode === 'day' ? 1 : (taxSeason ? 6 : 5);

  // Memoized so useCallback deps get stable references — prevents infinite refetch loop
  // (plain `new Date()` creates a new object reference every render, causing the callback
  //  to be recreated, which triggers the useEffect, which calls setLoading(true)…)
  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekEnd   = useMemo(() => addDays(weekStart, numDays - 1), [weekStart, numDays]);

  // Days array passed to WeekView
  const days = useMemo(() => {
    if (viewMode === 'day') {
      return [new Date(currentDate)];
    }
    return Array.from({ length: numDays }, (_, i) => addDays(weekStart, i));
  }, [viewMode, currentDate, weekStart, numDays]);

  // ── Fetch preparers (once) ─────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/preparers')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: CalendarPreparer[]) => setPreparers(data))
      .catch(() => {}); // preparers failure is non-critical
  }, []);

  // ── Fetch appointments when date range or view changes ─────────────────────
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setFetchError(false);

    let url: string;
    if (viewMode === 'day') {
      url = `/api/appointments?date=${toDateStr(currentDate)}`;
    } else if (viewMode === 'week') {
      url = `/api/appointments?date_start=${toDateStr(weekStart)}&date_end=${toDateStr(weekEnd)}`;
    } else {
      // Month view: fetch entire month + padding week on each side
      const year  = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const first = new Date(year, month, 1);
      const last  = new Date(year, month + 1, 0);
      const gridStart = addDays(first, first.getDay() === 0 ? -6 : 1 - first.getDay());
      const gridEnd   = addDays(last, 7 - (last.getDay() === 0 ? 7 : last.getDay()));
      url = `/api/appointments?date_start=${toDateStr(gridStart)}&date_end=${toDateStr(gridEnd)}`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data: CalendarAppt[] = await res.json();
      setAppointments(data);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [viewMode, currentDate, weekStart, weekEnd]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  function goToday()  { setCurrentDate(new Date()); }
  function goPrev() {
    if (viewMode === 'day')   setCurrentDate(d => addDays(d, -1));
    else if (viewMode === 'week') setCurrentDate(d => addDays(d, -7));
    else {
      setCurrentDate(d => {
        const n = new Date(d);
        n.setMonth(d.getMonth() - 1);
        return n;
      });
    }
  }
  function goNext() {
    if (viewMode === 'day')   setCurrentDate(d => addDays(d, 1));
    else if (viewMode === 'week') setCurrentDate(d => addDays(d, 7));
    else {
      setCurrentDate(d => {
        const n = new Date(d);
        n.setMonth(d.getMonth() + 1);
        return n;
      });
    }
  }

  // ── Preparer filter toggle ─────────────────────────────────────────────────
  function togglePreparer(id: string) {
    setHiddenPrepIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function showAllPreparers() {
    setHiddenPrepIds(new Set());
  }

  // ── Appointment selection ─────────────────────────────────────────────────
  function handleSelect(appt: CalendarAppt) {
    setSelectedAppt(prev => prev?.id === appt.id ? null : appt);
  }

  // ── Save from side panel ──────────────────────────────────────────────────
  function handleSave(updated: CalendarAppt) {
    setAppointments(prev =>
      prev.map(a => a.id === updated.id ? updated : a)
    );
    setSelectedAppt(updated);
  }

  // ── Month view: click day → switch to that day in week view ───────────────
  function handleMonthDayClick(date: Date) {
    setCurrentDate(date);
    setViewMode('week');
  }

  // ── Header label ──────────────────────────────────────────────────────────
  const headerLabel = useMemo(() => {
    if (viewMode === 'month') return formatMonthLabel(currentDate);
    if (viewMode === 'day')   return formatDayLabel(currentDate);
    return formatWeekRange(days[0], days[days.length - 1]);
  }, [viewMode, currentDate, days]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const isThisWeek = toDateStr(weekStart) === toDateStr(getWeekStart(new Date()));

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: '100vh' }}>

      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0 gap-4">

        {/* Left: nav controls + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={goToday}
            className="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-150"
          >
            Today
          </button>
          <div className="flex items-center">
            <button
              onClick={goPrev}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors duration-150"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goNext}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors duration-150"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-base font-bold text-[#0F2137] min-w-0">
            {headerLabel}
          </h2>
          {taxSeason && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
              <Sun className="w-3 h-3" />
              Tax Season
            </span>
          )}
        </div>

        {/* Right: view switcher — segmented control */}
        <div className="flex items-center rounded-md border border-gray-300 overflow-hidden flex-shrink-0">
          {(['day', 'week', 'month'] as CalendarViewMode[]).map((mode, i) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3.5 py-1.5 text-sm font-medium transition-all duration-150 capitalize ${
                i > 0 ? 'border-l border-gray-300' : ''
              } ${
                viewMode === mode
                  ? 'bg-[#0F2137] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* ── Preparer filter ────────────────────────────────────────────── */}
      {preparers.length > 0 && (
        <div className="flex items-center gap-2 px-6 py-2.5 bg-white border-b border-gray-200 flex-shrink-0 overflow-x-auto">
          <span className="text-[11px] text-gray-400 font-medium flex-shrink-0 mr-1 uppercase tracking-wide">Preparers</span>

          {/* Show All button */}
          {hiddenPrepIds.size > 0 && (
            <button
              onClick={showAllPreparers}
              className="px-2.5 py-1 rounded-md text-xs font-medium border border-gray-300 text-gray-500 hover:bg-gray-100 hover:border-gray-400 transition-all duration-150 flex-shrink-0"
            >
              Show All
            </button>
          )}

          {preparers.map(prep => {
            const hidden = hiddenPrepIds.has(prep.id);
            return (
              <button
                key={prep.id}
                onClick={() => togglePreparer(prep.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border transition-all duration-150 flex-shrink-0 ${
                  hidden
                    ? 'border-gray-200 text-gray-400 bg-white hover:border-gray-300'
                    : 'border-transparent text-white shadow-sm'
                }`}
                style={hidden ? {} : { backgroundColor: prep.color_hex }}
                title={hidden ? `Show ${prep.name}` : `Hide ${prep.name}`}
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${hidden ? 'opacity-30' : ''}`}
                  style={{ backgroundColor: hidden ? prep.color_hex : 'rgba(255,255,255,0.7)' }}
                />
                {prep.name}
              </button>
            );
          })}

          {/* Legend key */}
          <div className="ml-auto pl-4 flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="w-4 h-4 rounded border-2 border-dashed border-gray-300 inline-block flex-shrink-0" />
              Pending
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="w-4 h-4 rounded border-l-[3px] border-gray-400 bg-gray-100 inline-block flex-shrink-0" />
              Confirmed
            </div>
          </div>
        </div>
      )}

      {/* ── Calendar body ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Grid area */}
        <div className="flex-1 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 z-30 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader className="w-4 h-4 animate-spin" />
                Loading…
              </div>
            </div>
          )}

          {fetchError && (
            <div className="absolute inset-0 flex items-center justify-center z-30">
              <div className="text-center">
                <p className="text-gray-500 mb-3">Could not load appointments.</p>
                <button
                  onClick={fetchAppointments}
                  className="text-sm text-[#1B3A5C] font-medium underline"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {viewMode === 'month' ? (
            <MonthView
              currentDate={currentDate}
              appointments={appointments}
              hiddenPreparerIds={hiddenPrepIds}
              onDayClick={handleMonthDayClick}
            />
          ) : (
            <WeekView
              days={days}
              startHour={startHour}
              endHour={endHour}
              appointments={appointments}
              hiddenPreparerIds={hiddenPrepIds}
              selectedId={selectedAppt?.id ?? null}
              onSelect={handleSelect}
            />
          )}
        </div>

        {/* Side panel */}
        {selectedAppt && (
          <div className="w-[360px] flex-shrink-0 overflow-hidden shadow-xl border-l border-gray-200">
            <AppointmentSidePanel
              key={selectedAppt.id}
              appt={selectedAppt}
              preparers={preparers}
              onClose={() => setSelectedAppt(null)}
              onSave={handleSave}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inline spinner (avoids adding a dependency just for loading) ─────────────
function Loader({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
