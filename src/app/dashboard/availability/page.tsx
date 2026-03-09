'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

  // ── Toast state ───────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // ── Derived grid config (tax season drives dimensions) ─────────────────
  const taxSeason = useMemo(() => isTaxSeason(), []);
  const weekDays = useMemo(
    () => getWeekDays(currentWeekStart, taxSeason),
    [currentWeekStart, taxSeason]
  );
  const timeSlots = useMemo(
    () => (taxSeason ? generateTimeSlots(9, 19) : generateTimeSlots(9, 17)),
    [taxSeason]
  );
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

      // Fire one bulk request per visible day (sequential to avoid DB contention)
      for (const day of weekDays) {
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
    [selectedPreparer, isBulkLoading, weekDays, fetchSlots, showToast]
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

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  const isAnyBulkBusy = isBulkLoading || isCopyLoading;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-[1280px] mx-auto">
          <h1 className="text-xl font-bold text-[#1B3A5C]">Availability</h1>
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
          <div className="relative">
            <select
              value={selectedPreparer?.id ?? ''}
              onChange={e => {
                const p = preparers.find(x => x.id === e.target.value) ?? null;
                setSelectedPreparer(p);
              }}
              className="
                appearance-none pl-8 pr-8 py-2 text-sm font-medium border border-gray-300
                rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2
                focus:ring-[#1B3A5C] focus:border-[#1B3A5C] min-w-[180px] cursor-pointer
                transition-colors hover:border-gray-400
              "
            >
              <option value="">Select preparer</option>
              {preparers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {/* Color dot overlaid on the left */}
            <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
              {selectedPreparer ? (
                <span
                  className="h-3 w-3 rounded-full block border border-white shadow-sm"
                  style={{ backgroundColor: selectedPreparer.color_hex }}
                />
              ) : (
                <span className="h-3 w-3 rounded-full block bg-gray-300" />
              )}
            </div>
            {/* Chevron */}
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 hidden sm:block" />

          {/* Week navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevWeek}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A5C]"
              aria-label="Previous week"
            >
              <ChevronLeftIcon />
            </button>

            <span className="text-sm font-semibold text-gray-700 min-w-[130px] text-center select-none">
              {weekLabel}
            </span>

            <button
              onClick={goToNextWeek}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A5C]"
              aria-label="Next week"
            >
              <ChevronRightIcon />
            </button>

            <button
              onClick={goToToday}
              className="ml-1 px-3 py-1.5 text-xs font-medium text-[#1B3A5C] border border-[#1B3A5C]/30 rounded-md hover:bg-[#EDF2F8] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A5C]"
            >
              Today
            </button>
          </div>
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
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A5C]
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
                text-[#1B3A5C] border border-[#1B3A5C]/40 bg-[#EDF2F8]
                hover:bg-[#1B3A5C]/10 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A5C]
              "
            >
              {isCopyLoading ? (
                <span className="h-2 w-2 rounded-full bg-[#1B3A5C] animate-pulse" />
              ) : (
                <CopyIcon />
              )}
              Copy Week →
            </button>

            {/* Color legend for selected preparer */}
            <div className="ml-auto flex items-center gap-4 text-xs text-gray-500 select-none">
              <span className="flex items-center gap-1.5">
                <span
                  className="h-3 w-3 rounded-sm inline-block border"
                  style={{ backgroundColor: `${selectedPreparer.color_hex}40`, borderColor: selectedPreparer.color_hex }}
                />
                Open
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm inline-block bg-gray-200 border border-gray-300" />
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
      <div className="flex-1 px-6 py-6 overflow-auto">
        <div className="max-w-[1280px] mx-auto">
          {/* No preparer selected — empty state */}
          {!selectedPreparer && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-gray-300 mb-4">
                <CalendarIcon />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">
                Select a preparer to manage their availability
              </h3>
              <p className="text-sm text-gray-400 max-w-xs">
                Use the dropdown above to choose a preparer. Then click any cell to open or close a time slot.
              </p>
              {/* Preparer color chips */}
              {preparers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6 justify-center">
                  {preparers.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPreparer(p)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-400 bg-white transition-colors text-sm font-medium text-gray-700"
                    >
                      <span
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: p.color_hex }}
                      />
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
