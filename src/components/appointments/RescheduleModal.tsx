'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { easternDateString, isBookableEastern } from '@/lib/utils';
import {
  formatTimeDisplay,
  slotsForType,
  slotStartTimesFor,
  consecutiveFreeFrom,
  endTimeFor,
} from '@/lib/availability-utils';
import type { Preparer, AvailabilitySlot } from '@/types/scheduling';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RescheduleAppt {
  id: string;
  client_name: string;
  appointment_type: string;
  preparer_id: string;
  date: string;       // YYYY-MM-DD
  start_time: string; // HH:MM:SS
}

interface RescheduleModalProps {
  appt: RescheduleAppt;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── RescheduleModal ──────────────────────────────────────────────────────────
// Staff-only: move an appointment to a new date/time (and/or preparer).
// Picks from open slots (multi-slot types need N consecutive — same eligibility
// logic as BookingModal) or a custom-time override. Submits a PATCH with the new
// date/start_time; the server frees the old slots, guards occupancy + expiry,
// books the new slots, and emails the client a "moved from X to Y" notice.

export default function RescheduleModal({ appt, onClose, onSuccess }: RescheduleModalProps) {
  const [preparers, setPreparers]         = useState<Preparer[]>([]);
  const [preparerId, setPreparerId]       = useState(appt.preparer_id);
  const [date, setDate]                   = useState('');
  const [startTime, setStartTime]         = useState('');
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customTime, setCustomTime]       = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState('');

  const slotCount = slotsForType(appt.appointment_type);

  // The appointment's own currently-booked slots: when picking a new time on the
  // SAME preparer + date, these count as free (the server frees them before
  // booking the new ones), so overlapping/adjacent moves show up in the picker.
  const ownStarts = useMemo(
    () => new Set(slotStartTimesFor(appt.start_time, appt.appointment_type)),
    [appt.start_time, appt.appointment_type]
  );

  // ── Fetch preparers on mount ─────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/preparers')
      .then(r => r.json())
      .then((data: Preparer[]) => setPreparers(data))
      .catch(() => setError('Failed to load preparers'));
  }, []);

  // ── Fetch slots when preparer + date change ──────────────────────────────
  const fetchSlots = useCallback(async (pid: string, d: string) => {
    if (!pid || !d) { setAvailableSlots([]); return; }
    setIsFetchingSlots(true);
    try {
      const res = await fetch(
        `/api/availability?preparer_id=${pid}&start_date=${d}&end_date=${d}`
      );
      if (!res.ok) throw new Error();
      const data: AvailabilitySlot[] = await res.json();
      setAvailableSlots(data);
    } catch {
      setAvailableSlots([]);
    } finally {
      setIsFetchingSlots(false);
    }
  }, []);

  useEffect(() => {
    setStartTime('');
    setShowCustomTime(false);
    setCustomTime('');
    if (preparerId && date) {
      fetchSlots(preparerId, date);
    } else {
      setAvailableSlots([]);
    }
  }, [preparerId, date, fetchSlots]);

  // ── Eligible slots (mirrors BookingModal, + own-slot allowance) ──────────
  const isSamePlacement = preparerId === appt.preparer_id && date === appt.date;
  const eligibleSlots = useMemo(() => {
    const freeStarts = new Set(
      availableSlots
        .filter(s => !s.is_booked || (isSamePlacement && ownStarts.has(s.start_time)))
        .map(s => s.start_time)
    );
    return availableSlots.filter(
      s =>
        freeStarts.has(s.start_time) &&
        isBookableEastern(date, s.start_time) &&
        consecutiveFreeFrom(freeStarts, s.start_time, slotCount)
    );
  }, [availableSlots, isSamePlacement, ownStarts, date, slotCount]);

  const hasOpenSlots = eligibleSlots.length > 0;
  const effectiveStartTime = showCustomTime ? customTime : startTime;
  const isUnchanged =
    isSamePlacement && effectiveStartTime &&
    (effectiveStartTime.length === 5 ? `${effectiveStartTime}:00` : effectiveStartTime) === appt.start_time;

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setError('');
    if (!date) return setError('Select a new date');
    if (!effectiveStartTime) return setError('Select a new time');
    if (isUnchanged) return setError('That is the appointment’s current time — pick a different one');

    setSubmitting(true);
    try {
      const res = await fetch(`/api/appointments/${appt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          start_time: effectiveStartTime.length === 5 ? `${effectiveStartTime}:00` : effectiveStartTime,
          ...(preparerId !== appt.preparer_id ? { preparer_id: preparerId } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.formErrors?.[0] ?? err.error ?? 'Reschedule failed');
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reschedule Appointment"
          className="pointer-events-auto w-full max-w-[480px] bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-[#03296A]">Reschedule Appointment</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {appt.client_name} · {slotCount * 30} min
                {slotCount > 1 && ` (needs ${slotCount} consecutive slots)`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Preparer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preparer</label>
              <select
                value={preparerId}
                onChange={e => setPreparerId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#03296A] focus:border-[#03296A]"
              >
                {preparers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.id === appt.preparer_id ? ' (current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={easternDateString()}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03296A] focus:border-[#03296A]"
                required
              />
            </div>

            {/* Time slot picker */}
            {date && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Time <span className="text-red-500">*</span>
                </label>

                {isFetchingSlots ? (
                  <p className="text-sm text-gray-400 py-2">Loading available slots...</p>
                ) : (
                  <>
                    {hasOpenSlots && !showCustomTime && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {eligibleSlots.map(slot => {
                          const isSelected = startTime === slot.start_time;
                          const label = slotCount > 1
                            ? `${formatTimeDisplay(slot.start_time)} – ${formatTimeDisplay(endTimeFor(slot.start_time, appt.appointment_type))}`
                            : formatTimeDisplay(slot.start_time);
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => { setStartTime(slot.start_time); setShowCustomTime(false); }}
                              className={`py-2 px-2 rounded-lg border text-xs font-medium text-center transition-colors ${
                                isSelected
                                  ? 'bg-[#03296A] text-white border-[#03296A]'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#244B75] hover:bg-[#EDF2F8]'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {!hasOpenSlots && !showCustomTime && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 mb-3">
                        No open slots for this date — entering a time will create an override booking.
                      </div>
                    )}

                    {!showCustomTime ? (
                      <button
                        type="button"
                        onClick={() => { setShowCustomTime(true); setStartTime(''); }}
                        className="text-xs text-[#03296A] hover:underline font-medium"
                      >
                        {hasOpenSlots ? '+ Enter a custom time (override)' : '+ Enter time'}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                          Override — new slots will be created for this time if none exist.
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={customTime}
                            onChange={e => setCustomTime(e.target.value)}
                            step="1800"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03296A]"
                          />
                          {hasOpenSlots && (
                            <button
                              type="button"
                              onClick={() => { setShowCustomTime(false); setCustomTime(''); }}
                              className="text-xs text-gray-500 hover:text-gray-700 underline"
                            >
                              Back to slots
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Info note */}
            <p className="text-xs text-amber-600">
              Frees the current time slot{slotCount > 1 ? 's' : ''}, books the new time, and emails
              the client the new appointment time.
            </p>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting || !date || !effectiveStartTime}
              onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-lg bg-[#03296A] text-white text-sm font-medium hover:bg-[#244B75]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Rescheduling...' : 'Reschedule'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
