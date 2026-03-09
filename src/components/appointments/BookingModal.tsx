'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { normalizePhone } from '@/lib/utils';
import { addThirtyMinutes, formatTimeDisplay } from '@/lib/availability-utils';
import type { Preparer, AvailabilitySlot, AppointmentType, ServiceSubtype } from '@/types/scheduling';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type FormState = {
  client_name:      string;
  client_phone:     string;
  client_email:     string;
  appointment_type: AppointmentType | '';
  service_subtype:  ServiceSubtype | '';
  preparer_id:      string;
  date:             string;
  start_time:       string;
  language:         'en' | 'es';
  notes:            string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  personal_tax:          'Taxes — Personal',
  corporate_tax:         'Taxes — Corporate',
  professional_services: 'Professional Services',
};

const SERVICE_SUBTYPE_LABELS: Record<ServiceSubtype, string> = {
  divorce:                'Divorce',
  immigration_consulting: 'Immigration Consulting',
  general_consulting:     'General Consulting',
  bankruptcy:             'Bankruptcy',
  offer_in_compromise:    'Offer in Compromise',
  other:                  'Other',
};

const INITIAL_FORM: FormState = {
  client_name:      '',
  client_phone:     '',
  client_email:     '',
  appointment_type: '',
  service_subtype:  '',
  preparer_id:      '',
  date:             '',
  start_time:       '',
  language:         'es',
  notes:            '',
};

// ─── Phone validation (E.164) ─────────────────────────────────────────────────

function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits[0] === '1');
}

// ─── BookingModal ─────────────────────────────────────────────────────────────

export default function BookingModal({ onClose, onSuccess }: BookingModalProps) {
  const [preparers, setPreparers]         = useState<Preparer[]>([]);
  const [form, setForm]                   = useState<FormState>(INITIAL_FORM);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState('');
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customTime, setCustomTime]       = useState('');
  const [phoneError, setPhoneError]       = useState('');

  // ── Derived ──────────────────────────────────────────────────────────────
  const isCorporate = form.appointment_type === 'corporate_tax';
  const selectedPreparer = preparers.find(p => p.id === form.preparer_id) ?? null;

  // Unbooked slots, filtered by duration (corporate needs 2 consecutive unbooked)
  const eligibleSlots = useMemo(() => {
    const unbooked = availableSlots.filter(s => !s.is_booked);
    if (!isCorporate) return unbooked;
    // For 60-min: slot AND its consecutive 30-min slot must both be free
    const slotSet = new Set(unbooked.map(s => s.start_time));
    return unbooked.filter(s => slotSet.has(addThirtyMinutes(s.start_time)));
  }, [availableSlots, isCorporate]);

  const hasOpenSlots = eligibleSlots.length > 0;

  // The final selected time (slot button OR custom time)
  const effectiveStartTime = showCustomTime ? customTime : form.start_time;

  // ── Fetch preparers on mount ─────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/preparers')
      .then(r => r.json())
      .then((data: Preparer[]) => setPreparers(data))
      .catch(() => setError('Failed to load preparers'));
  }, []);

  // ── Fetch slots when preparer + date changes ─────────────────────────────
  const fetchSlots = useCallback(async (preparerId: string, date: string) => {
    if (!preparerId || !date) { setAvailableSlots([]); return; }
    setIsFetchingSlots(true);
    try {
      const res = await fetch(
        `/api/availability?preparer_id=${preparerId}&start_date=${date}&end_date=${date}`
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

  // Reset slot selection when preparer, date, or appointment type changes
  useEffect(() => {
    setForm(f => ({ ...f, start_time: '' }));
    setShowCustomTime(false);
    setCustomTime('');
    if (form.preparer_id && form.date) {
      fetchSlots(form.preparer_id, form.date);
    } else {
      setAvailableSlots([]);
    }
  }, [form.preparer_id, form.date, form.appointment_type]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Form helpers ─────────────────────────────────────────────────────────
  function set(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  }

  function handlePhoneBlur() {
    if (form.client_phone && !isValidPhone(form.client_phone)) {
      setPhoneError('Enter a valid 10-digit US phone number');
    } else {
      setPhoneError('');
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.client_name.trim()) return setError('Client name is required');
    if (!form.client_phone.trim()) return setError('Client phone is required');
    if (!isValidPhone(form.client_phone)) return setError('Invalid phone number');
    if (!form.appointment_type) return setError('Select an appointment type');
    if (form.appointment_type === 'professional_services' && !form.service_subtype) {
      return setError('Select a service type for Professional Services');
    }
    if (!form.preparer_id) return setError('Select a preparer');
    if (!form.date) return setError('Select a date');

    const selectedTime = effectiveStartTime;
    if (!selectedTime) return setError('Select a time slot');

    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name:      form.client_name.trim(),
          client_phone:     normalizePhone(form.client_phone),
          client_email:     form.client_email.trim() || null,
          appointment_type: form.appointment_type,
          service_subtype:  form.service_subtype || null,
          preparer_id:      form.preparer_id,
          date:             form.date,
          start_time:       selectedTime.length === 5 ? `${selectedTime}:00` : selectedTime,
          language:         form.language,
          notes:            form.notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.formErrors?.[0] ?? err.error ?? 'Booking failed');
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New Appointment"
        className="
          fixed inset-y-0 right-0 z-50 w-full max-w-xl
          bg-white shadow-2xl flex flex-col
          overflow-y-auto
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-[#1B3A5C]">New Appointment</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 px-6 py-6 space-y-6">

          {/* ── Section: Client Info ────────────────────────────────── */}
          <fieldset>
            <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Client Info
            </legend>
            <div className="space-y-3">
              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.client_name}
                  onChange={e => set('client_name', e.target.value)}
                  placeholder="Maria Lopez"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:border-[#1B3A5C]"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.client_phone}
                  onChange={e => { set('client_phone', e.target.value); setPhoneError(''); }}
                  onBlur={handlePhoneBlur}
                  placeholder="(954) 555-0100"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] ${
                    phoneError ? 'border-red-400' : 'border-gray-300 focus:border-[#1B3A5C]'
                  }`}
                  required
                />
                {phoneError && (
                  <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-gray-400 text-xs font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  value={form.client_email}
                  onChange={e => set('client_email', e.target.value)}
                  placeholder="maria@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:border-[#1B3A5C]"
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language Preference
                </label>
                <div className="flex gap-3">
                  {(['es', 'en'] as const).map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => set('language', lang)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        form.language === lang
                          ? 'bg-[#1B3A5C] text-white border-[#1B3A5C]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {lang === 'es' ? 'Spanish' : 'English'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </fieldset>

          {/* ── Section: Appointment Type ───────────────────────────── */}
          <fieldset>
            <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Appointment Type
            </legend>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {(Object.entries(APPOINTMENT_TYPE_LABELS) as [AppointmentType, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      set('appointment_type', value);
                      set('service_subtype', '');
                    }}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-lg border text-sm font-medium text-left transition-colors ${
                      form.appointment_type === value
                        ? 'bg-[#1B3A5C] text-white border-[#1B3A5C]'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <span>{label}</span>
                    {value === 'corporate_tax' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        form.appointment_type === value
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}>60 min</span>
                    )}
                    {value !== 'corporate_tax' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        form.appointment_type === value
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}>30 min</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Service subtype (professional_services only) */}
              {form.appointment_type === 'professional_services' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.service_subtype}
                    onChange={e => set('service_subtype', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:border-[#1B3A5C]"
                    required
                  >
                    <option value="">Select service type...</option>
                    {(Object.entries(SERVICE_SUBTYPE_LABELS) as [ServiceSubtype, string][]).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </fieldset>

          {/* ── Section: Schedule ──────────────────────────────────── */}
          <fieldset>
            <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Schedule
            </legend>
            <div className="space-y-3">

              {/* Preparer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preparer <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.preparer_id}
                    onChange={e => set('preparer_id', e.target.value)}
                    className="w-full appearance-none border border-gray-300 rounded-lg pl-8 pr-10 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:border-[#1B3A5C]"
                    required
                  >
                    <option value="">Select preparer...</option>
                    {preparers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {/* Color dot */}
                  <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                    <span
                      className="h-3 w-3 rounded-full block"
                      style={{
                        backgroundColor: selectedPreparer
                          ? selectedPreparer.color_hex
                          : '#D1D5DB',
                      }}
                    />
                  </div>
                  <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => set('date', e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:border-[#1B3A5C]"
                  required
                />
              </div>

              {/* Time slot picker — visible once preparer + date are both selected */}
              {form.preparer_id && form.date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Slot <span className="text-red-500">*</span>
                    {isCorporate && (
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        (60-min — shows consecutive pairs)
                      </span>
                    )}
                  </label>

                  {isFetchingSlots ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading available slots...
                    </div>
                  ) : (
                    <>
                      {/* Available slot buttons */}
                      {hasOpenSlots && !showCustomTime && (
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {eligibleSlots.map(slot => {
                            const isSelected = form.start_time === slot.start_time;
                            const label = isCorporate
                              ? `${formatTimeDisplay(slot.start_time)} – ${formatTimeDisplay(addThirtyMinutes(addThirtyMinutes(slot.start_time)))}`
                              : formatTimeDisplay(slot.start_time);
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => {
                                  set('start_time', slot.start_time);
                                  setShowCustomTime(false);
                                }}
                                className={`py-2 px-3 rounded-lg border text-xs font-medium text-center transition-colors ${
                                  isSelected
                                    ? 'bg-[#1B3A5C] text-white border-[#1B3A5C]'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#1B3A5C] hover:bg-[#EDF2F8]'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* No open slots message */}
                      {!hasOpenSlots && !showCustomTime && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 mb-3">
                          No open slots for this date — entering a time will create an override booking.
                        </div>
                      )}

                      {/* Custom time toggle & input */}
                      {!showCustomTime ? (
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomTime(true);
                            set('start_time', '');
                          }}
                          className="text-xs text-[#1B3A5C] hover:underline font-medium"
                        >
                          {hasOpenSlots ? '+ Enter a custom time (override)' : '+ Enter time'}
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                            Override booking — a new slot will be created for this time.
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={customTime}
                              onChange={e => setCustomTime(e.target.value)}
                              step="1800"
                              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]"
                              required={showCustomTime}
                            />
                            {hasOpenSlots && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCustomTime(false);
                                  setCustomTime('');
                                }}
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
            </div>
          </fieldset>

          {/* ── Section: Notes ─────────────────────────────────────── */}
          <fieldset>
            <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Notes <span className="normal-case font-normal text-gray-400 text-xs">(internal only)</span>
            </legend>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Walk-in, phone booking, special instructions..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:border-[#1B3A5C] resize-none"
            />
          </fieldset>

          {/* ── Error message ──────────────────────────────────────── */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 bg-white flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="booking-form"
            disabled={submitting}
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-lg bg-[#1B3A5C] text-white text-sm font-medium hover:bg-[#1B3A5C]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {submitting ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </div>
    </>
  );
}
