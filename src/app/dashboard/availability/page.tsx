'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { addDays, format } from 'date-fns';
import AvailabilityGrid, { AvailabilityGridSkeleton } from '@/components/availability/AvailabilityGrid';
import ToastContainer, { type ToastItem, type ToastType } from '@/components/ui/Toast';
import {
  isTaxSeason,
  getWeekStart,
  getWeekDays,
  generateTimeSlots,
  slotKey,
  addThirtyMinutes,
  formatWeekLabel,
  PRESET_LABELS,
} from '@/lib/availability-utils';
import type { Preparer, SlotWithMeta, SlotPreset } from '@/types/scheduling';

// -----------------------------------------------------------------------
// Inline SVG icons (no lucide-react)
// -----------------------------------------------------------------------
function ChevronLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

// -----------------------------------------------------------------------
// Custom preparer dropdown — shows each preparer's color dot per option
// (native <option> can't render color dots reliably)
// -----------------------------------------------------------------------
function PreparerSelect({
  preparers,
  selected,
  onSelect,
}: {
  preparers: Preparer[];
  selected: Preparer | null;
  onSelect: (p: Preparer) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="
          flex items-center gap-2 pl-3 pr-2 py-2 text-sm font-medium border border-gray-300
          rounded-lg bg-white text-gray-700 min-w-[200px] hover:border-gray-400
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#03296A] transition-colors
        "
      >
        <span
          className="h-3 w-3 rounded-full flex-shrink-0 border border-white shadow-sm"
          style={{ backgroundColor: selected?.color_hex ?? '#D1D5DB' }}
        />
        <span className={selected ? '' : 'text-gray-400'}>
          {selected?.name ?? 'Select preparer'}
        </span>
        <svg className="h-4 w-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-72 overflow-auto"
        >
          {preparers.map(p => {
            const active = selected?.id === p.id;
            return (
              <li key={p.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(p);
                    setOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors
                    hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-50
                    ${active ? 'font-semibold text-[#03296A]' : 'text-gray-700'}
                  `}
                >
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color_hex }}
                  />
                  {p.name}
                  {active && <CheckIcon className="h-4 w-4 ml-auto text-[#03296A]" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// Main page
// -----------------------------------------------------------------------
export default function AvailabilityPage() {
  // ── Core state ────────────────────────────────────────────────────────
  const [preparers, setPreparers] = useState<Preparer[]>([]);
  const [selectedPreparer, setSelectedPreparer] = useState<Preparer | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    getWeekStart(new Date())
  );
  const [slots, setSlots] = useState<Map<string, SlotWithMeta>>(new Map());
  const [loadingCells, setLoadingCells] = useState<Set<string>>(new Set());

  // ── Loading flags ─────────────────────────────────────────────────────
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [isCopyLoading, setIsCopyLoading] = useState(false);
  const [isClearDayLoading, setIsClearDayLoading] = useState(false);
  const [isClearWeekLoading, setIsClearWeekLoading] = useState(false);

  // ── Toast state ───────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // ── Derived grid config ────────────────────────────────────────────────
  const taxSeason = useMemo(() => isTaxSeason(), []);
  // Display: always the full Mon–Sun week (matches the Calendar tab).
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );
  // Bulk Open presets keep their original target days (Mon–Fri off-season,
  // Mon–Sat in tax season) so those buttons behave exactly as before.
  const bulkDays = useMemo(
    () => getWeekDays(currentWeekStart, taxSeason),
    [currentWeekStart, taxSeason]
  );
  // Display range: 5:00 AM – 10:00 PM (matches the Calendar tab).
  const timeSlots = useMemo(() => generateTimeSlots(5, 22), []);
  const weekLabel = useMemo(() => formatWeekLabel(weekDays), [weekDays]);

  // ── Toast helpers ─────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Fetch preparers on mount ──────────────────────────────────────────
  useEffect(() => {
    fetch('/api/preparers')
      .then(r => r.json())
      .then((data: Preparer[]) => setPreparers(data))
      .catch(() => showToast('Failed to load preparers', 'error'));
  }, [showToast]);

  // ── Fetch slots when preparer or week changes ─────────────────────────
  const fetchSlots = useCallback(async () => {
    if (!selectedPreparer) return;

    setIsFetchingSlots(true);
    const startDate = format(weekDays[0], 'yyyy-MM-dd');
    const endDate = format(weekDays[weekDays.length - 1], 'yyyy-MM-dd');

    try {
      const res = await fetch(
        `/api/availability?start_date=${startDate}&end_date=${endDate}&preparer_id=${selectedPreparer.id}`
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data: SlotWithMeta[] = await res.json();

      // Build Map keyed by date_startTime
      const map = new Map<string, SlotWithMeta>();
      for (const slot of data) {
        map.set(slotKey(slot.date, slot.start_time), slot);
      }
      setSlots(map);
    } catch {
      showToast('Failed to load availability', 'error');
    } finally {
      setIsFetchingSlots(false);
    }
  }, [selectedPreparer, weekDays, showToast]);

  useEffect(() => {
    if (selectedPreparer) fetchSlots();
    else setSlots(new Map());
  }, [selectedPreparer, currentWeekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Week navigation ───────────────────────────────────────────────────
  const goToPrevWeek = () => setCurrentWeekStart(d => addDays(d, -7));
  const goToNextWeek = () => setCurrentWeekStart(d => addDays(d, 7));
  const goToToday = () => setCurrentWeekStart(getWeekStart(new Date()));

  // ── Cell click — optimistic toggle ───────────────────────────────────
  const handleCellClick = useCallback(
    async (date: string, startTime: string, slot: SlotWithMeta | null) => {
      if (!selectedPreparer) return;
      const key = slotKey(date, startTime);

      if (slot === null) {
        // ── Open slot (optimistic) ────────────────────────────────────
        const tempId = `temp_${key}`;
        const optimistic: SlotWithMeta = {
          id: tempId,
          preparer_id: selectedPreparer.id,
          date,
          start_time: startTime,
          end_time: addThirtyMinutes(startTime),
          is_booked: false,
          created_at: new Date().toISOString(),
          preparer_name: selectedPreparer.name,
          preparer_color: selectedPreparer.color_hex,
          client_name: null,
        };
        setSlots(prev => new Map(prev).set(key, optimistic));
        setLoadingCells(prev => new Set(prev).add(key));

        const res = await fetch('/api/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preparer_id: selectedPreparer.id,
            date,
            start_times: [startTime],
          }),
        });

        setLoadingCells(prev => {
          const n = new Set(prev);
          n.delete(key);
          return n;
        });

        if (!res.ok) {
          // Revert
          setSlots(prev => {
            const n = new Map(prev);
            n.delete(key);
            return n;
          });
          showToast('Failed to open slot', 'error');
        } else {
          const data = await res.json();
          // Replace temp slot with real one from DB
          if (data.slots?.[0]) {
            setSlots(prev =>
              new Map(prev).set(key, {
                ...optimistic,
                id: data.slots[0].id,
              })
            );
          }
        }
      } else if (!slot.is_booked) {
        // ── Close slot (optimistic) ───────────────────────────────────
        setSlots(prev => {
          const n = new Map(prev);
          n.delete(key);
          return n;
        });
        setLoadingCells(prev => new Set(prev).add(key));

        const res = await fetch(`/api/availability/${slot.id}`, {
          method: 'DELETE',
        });

        setLoadingCells(prev => {
          const n = new Set(prev);
          n.delete(key);
          return n;
        });

        if (!res.ok) {
          // Revert
          setSlots(prev => new Map(prev).set(key, slot));
          const errData = await res.json().catch(() => ({}));
          showToast(errData.error ?? 'Failed to close slot', 'error');
        }
      }
      // Booked cells: do nothing (no-op, cell is disabled visually)
    },
    [selectedPreparer, showToast]
  );

  // ── Bulk open slots ───────────────────────────────────────────────────
  const handleBulkAction = useCallback(
    async (preset: SlotPreset) => {
      if (!selectedPreparer || isBulkLoading) return;
      setIsBulkLoading(true);

      let totalCreated = 0;
      let anyError = false;

      // Fire one bulk request per business day (sequential to avoid DB contention).
      // Uses bulkDays (Mon–Fri / Mon–Sat) so presets keep their original behavior
      // even though the grid now displays the full Mon–Sun week.
      for (const day of bulkDays) {
        const dateStr = format(day, 'yyyy-MM-dd');
        const res = await fetch('/api/availability/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preparer_id: selectedPreparer.id,
            date: dateStr,
            preset,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          totalCreated += data.created ?? 0;
        } else {
          anyError = true;
        }
      }

      setIsBulkLoading(false);
      await fetchSlots();

      if (anyError) {
        showToast('Some slots could not be created', 'error');
      } else if (totalCreated === 0) {
        showToast('All slots already exist for this week', 'info');
      } else {
        showToast(
          `Opened ${totalCreated} slot${totalCreated === 1 ? '' : 's'}`,
          'success'
        );
      }
    },
    [selectedPreparer, isBulkLoading, bulkDays, fetchSlots, showToast]
  );

  // ── Copy week ─────────────────────────────────────────────────────────
  const handleCopyWeek = useCallback(async () => {
    if (!selectedPreparer || isCopyLoading) return;
    setIsCopyLoading(true);

    const sourceWeekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
    const res = await fetch('/api/availability/copy-week', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preparer_id: selectedPreparer.id,
        source_week_start: sourceWeekStartStr,
      }),
    });

    setIsCopyLoading(false);

    if (res.ok) {
      const data = await res.json();
      const count = data.created ?? 0;
      showToast(
        count === 0
          ? 'Next week already has slots'
          : `Copied ${count} slot${count === 1 ? '' : 's'} to next week`,
        count === 0 ? 'info' : 'success'
      );
    } else {
      showToast('Failed to copy week', 'error');
    }
  }, [selectedPreparer, isCopyLoading, currentWeekStart, showToast]);

  // ── Clear day (delete all open slots for a single day) ────────────────
  const handleClearDay = useCallback(
    async (dayDate: Date) => {
      if (!selectedPreparer || isClearDayLoading) return;

      const dateStr = format(dayDate, 'yyyy-MM-dd');
      const dayLabel = format(dayDate, 'EEEE, MMMM d');

      const confirmed = window.confirm(
        `Are you sure you want to close all open slots for ${dayLabel}?\n\nThis will remove all unbooked availability for ${selectedPreparer.name} on this day. Booked slots will not be affected.`
      );

      if (!confirmed) return;

      setIsClearDayLoading(true);

      // Optimistic UI: remove unbooked slots for this day from the Map
      const removedSlots = new Map<string, SlotWithMeta>();
      setSlots(prev => {
        const next = new Map(prev);
        Array.from(next.entries()).forEach(([key, slot]) => {
          if (slot.date === dateStr && !slot.is_booked) {
            removedSlots.set(key, slot);
            next.delete(key);
          }
        });
        return next;
      });

      const res = await fetch('/api/availability/clear-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preparer_id: selectedPreparer.id,
          date: dateStr,
        }),
      });

      setIsClearDayLoading(false);

      if (res.ok) {
        const data = await res.json();
        const count = data.deleted ?? 0;
        showToast(
          count === 0
            ? 'No open slots to clear'
            : `Cleared ${count} slot${count === 1 ? '' : 's'} for ${dayLabel}`,
          count === 0 ? 'info' : 'success'
        );
      } else {
        // Revert optimistic removal
        setSlots(prev => {
          const next = new Map(prev);
          Array.from(removedSlots.entries()).forEach(([key, slot]) => {
            next.set(key, slot);
          });
          return next;
        });
        showToast('Failed to clear day', 'error');
      }
    },
    [selectedPreparer, isClearDayLoading, showToast]
  );

  // ── Clear week (clear all open slots across the visible Mon–Sun week) ──
  // Reuses the existing per-day clear-day endpoint, one request per day.
  const handleClearWeek = useCallback(async () => {
    if (!selectedPreparer || isClearWeekLoading) return;

    const confirmed = window.confirm(
      `Are you sure you want to close all open slots for the week of ${weekLabel}?\n\nThis will remove all unbooked availability for ${selectedPreparer.name} on every day shown. Booked slots will not be affected.`
    );
    if (!confirmed) return;

    setIsClearWeekLoading(true);

    // Optimistic UI: remove all unbooked slots for the visible week from the Map
    const removedSlots = new Map<string, SlotWithMeta>();
    const weekDateStrs = new Set(weekDays.map(d => format(d, 'yyyy-MM-dd')));
    setSlots(prev => {
      const next = new Map(prev);
      Array.from(next.entries()).forEach(([key, slot]) => {
        if (weekDateStrs.has(slot.date) && !slot.is_booked) {
          removedSlots.set(key, slot);
          next.delete(key);
        }
      });
      return next;
    });

    let totalDeleted = 0;
    let anyError = false;
    for (const day of weekDays) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const res = await fetch('/api/availability/clear-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preparer_id: selectedPreparer.id, date: dateStr }),
      });
      if (res.ok) {
        const data = await res.json();
        totalDeleted += data.deleted ?? 0;
      } else {
        anyError = true;
      }
    }

    setIsClearWeekLoading(false);

    if (anyError) {
      // Revert optimistic removal
      setSlots(prev => {
        const next = new Map(prev);
        Array.from(removedSlots.entries()).forEach(([key, slot]) => {
          next.set(key, slot);
        });
        return next;
      });
      showToast('Failed to clear week', 'error');
    } else {
      showToast(
        totalDeleted === 0
          ? 'No open slots to clear this week'
          : `Cleared ${totalDeleted} slot${totalDeleted === 1 ? '' : 's'} this week`,
        totalDeleted === 0 ? 'info' : 'success'
      );
    }
  }, [selectedPreparer, isClearWeekLoading, weekDays, weekLabel, showToast]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  const isAnyBulkBusy =
    isBulkLoading || isCopyLoading || isClearDayLoading || isClearWeekLoading;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-[1280px] mx-auto">
          <h1 className="text-xl font-bold text-[#03296A]">Availability</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Open and close time slots for each preparer
            {taxSeason && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                Tax Season Hours
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Controls ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-[1280px] mx-auto flex flex-wrap items-center gap-3">

          {/* Preparer selector */}
          <PreparerSelect
            preparers={preparers}
            selected={selectedPreparer}
            onSelect={setSelectedPreparer}
          />

          {/* Week navigation — only once a preparer is selected */}
          {selectedPreparer && (
            <>
              {/* Divider */}
              <div className="h-6 w-px bg-gray-200 hidden sm:block" />

              <div className="flex items-center gap-1">
                <button
                  onClick={goToPrevWeek}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#03296A]"
                  aria-label="Previous week"
                >
                  <ChevronLeftIcon />
                </button>

                <span className="text-sm font-semibold text-gray-700 min-w-[130px] text-center select-none">
                  {weekLabel}
                </span>

                <button
                  onClick={goToNextWeek}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#03296A]"
                  aria-label="Next week"
                >
                  <ChevronRightIcon />
                </button>

                <button
                  onClick={goToToday}
                  className="ml-1 px-3 py-1.5 text-xs font-medium text-[#03296A] border border-[#03296A]/30 rounded-md hover:bg-[#EDF2F8] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#03296A]"
                >
                  Today
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Action bar (bulk + copy) ─────────────────────────────────── */}
      {selectedPreparer && (
        <div className="bg-white border-b border-gray-200 px-6 py-2.5">
          <div className="max-w-[1280px] mx-auto flex flex-wrap items-center gap-2">
            {/* Bulk preset buttons */}
            {(Object.entries(PRESET_LABELS) as [SlotPreset, string][]).map(
              ([preset, label]) => (
                <button
                  key={preset}
                  onClick={() => handleBulkAction(preset)}
                  disabled={isAnyBulkBusy}
                  className="
                    px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300
                    text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400
                    transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#03296A]
                  "
                >
                  {isBulkLoading ? (
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
                      {label}
                    </span>
                  ) : (
                    label
                  )}
                </button>
              )
            )}

            {/* Divider */}
            <div className="h-5 w-px bg-gray-200 mx-1" />

            {/* Copy week button */}
            <button
              onClick={handleCopyWeek}
              disabled={isAnyBulkBusy}
              className="
                flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
                text-[#03296A] border border-[#03296A]/40 bg-[#EDF2F8]
                hover:bg-[#244B75]/10 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#03296A]
              "
            >
              {isCopyLoading ? (
                <span className="h-2 w-2 rounded-full bg-[#03296A] animate-pulse" />
              ) : (
                <CopyIcon />
              )}
              Copy Week →
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-gray-200 mx-1" />

            {/* Clear Day dropdown + button */}
            <div className="flex items-center gap-1.5">
              <select
                id="clear-day-select"
                defaultValue=""
                className="
                  appearance-none px-2.5 py-1.5 text-xs font-medium border border-red-200
                  rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2
                  focus:ring-red-400 focus:border-red-400 cursor-pointer
                  transition-colors hover:border-red-300
                "
              >
                <option value="" disabled>Pick day…</option>
                {weekDays.map(day => (
                  <option key={format(day, 'yyyy-MM-dd')} value={format(day, 'yyyy-MM-dd')}>
                    {format(day, 'EEE M/d')}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const sel = document.getElementById('clear-day-select') as HTMLSelectElement;
                  const val = sel?.value;
                  if (!val) {
                    showToast('Select a day to clear first', 'info');
                    return;
                  }
                  const [y, m, d] = val.split('-').map(Number);
                  handleClearDay(new Date(y, m - 1, d));
                }}
                disabled={isAnyBulkBusy}
                className="
                  flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
                  text-red-600 border border-red-200 bg-red-50
                  hover:bg-red-100 hover:border-red-300 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400
                "
              >
                {isClearDayLoading ? (
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                Clear Day
              </button>
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-gray-200 mx-1" />

            {/* Clear Week button — clears the entire visible week */}
            <button
              onClick={handleClearWeek}
              disabled={isAnyBulkBusy}
              className="
                flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
                text-red-600 border border-red-200 bg-red-50
                hover:bg-red-100 hover:border-red-300 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400
              "
            >
              {isClearWeekLoading ? (
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              Clear Week
            </button>

            {/* Color legend for selected preparer */}
            <div className="ml-auto flex items-center gap-4 text-xs text-gray-500 select-none">
              <span className="flex items-center gap-1.5">
                <span
                  className="h-3 w-3 rounded-sm inline-block border border-black/10"
                  style={{ backgroundColor: selectedPreparer.color_hex }}
                />
                Open
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm inline-block bg-gray-300 border border-gray-400" />
                Booked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm inline-block bg-white border border-gray-200" />
                Empty
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 px-6 py-6 overflow-hidden flex flex-col">
        <div className="max-w-[1280px] mx-auto w-full flex-1 min-h-0 flex flex-col">
          {/* No preparer selected — empty state */}
          {!selectedPreparer && (
            <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
              <div className="text-gray-300 mb-4">
                <CalendarIcon />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                Select a preparer to manage availability
              </h3>
              <p className="text-sm text-gray-400 max-w-md mb-8">
                Choose a preparer to view and edit their weekly availability.
              </p>
              {/* Large color-coded preparer buttons */}
              {preparers.length > 0 && (
                <div className="flex flex-wrap gap-4 justify-center max-w-2xl">
                  {preparers.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPreparer(p)}
                      style={{ backgroundColor: p.color_hex, color: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}
                      className="min-w-[160px] px-6 py-4 rounded-xl text-lg font-semibold shadow-sm hover:brightness-95 active:brightness-90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#03296A]"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Loading skeleton */}
          {selectedPreparer && isFetchingSlots && (
            <AvailabilityGridSkeleton
              colCount={weekDays.length}
              rowCount={timeSlots.length}
            />
          )}

          {/* Grid */}
          {selectedPreparer && !isFetchingSlots && (
            <AvailabilityGrid
              weekDays={weekDays}
              timeSlots={timeSlots}
              slots={slots}
              selectedPreparer={selectedPreparer}
              loadingCells={loadingCells}
              onCellClick={handleCellClick}
            />
          )}
        </div>
      </div>

      {/* ── Toast notifications ─────────────────────────────────────── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
