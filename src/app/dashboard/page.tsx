'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BookingModal from '@/components/appointments/BookingModal';
import ToastContainer, { type ToastItem } from '@/components/ui/Toast';
import { formatTime } from '@/lib/utils';
import type { Preparer, Appointment, AppointmentStatus } from '@/types/scheduling';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AppointmentRow extends Appointment {
  preparer: Pick<Preparer, 'id' | 'name' | 'color_hex' | 'color_name'> | null;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  personal_tax:          'Personal Tax',
  corporate_tax:         'Corporate Tax',
  professional_services: 'Professional',
};

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
  completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700' },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── SVG Icons ─────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Toast state
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const showToast = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch today's appointments
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments?date=${todayString()}`);
      if (!res.ok) throw new Error();
      const data: AppointmentRow[] = await res.json();
      setAppointments(data);
    } catch {
      showToast('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch pending count
  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch('/api/appointments/pending');
      if (res.ok) {
        const data = await res.json();
        setPendingCount(data.count ?? 0);
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchPending();
  }, [fetchAppointments, fetchPending]);

  // Derive stats
  const total = appointments.length;
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;
  const pending = appointments.filter(a => a.status === 'pending').length;
  const completed = appointments.filter(a => a.status === 'completed').length;

  // Next 5 upcoming (confirmed or pending, sorted by time)
  const upcoming = appointments
    .filter(a => a.status === 'confirmed' || a.status === 'pending')
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .slice(0, 5);

  // Today's date formatted
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#1B3A5C]">
                {getGreeting()}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{todayFormatted}</p>
            </div>

            {/* SMS Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-medium text-amber-700">
                SMS Pending A2P Registration
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* ── Stats Cards ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total today */}
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Today</p>
              <p className="text-3xl font-bold text-[#1B3A5C]">
                {loading ? '—' : total}
              </p>
              <p className="text-xs text-gray-400 mt-1">appointments</p>
            </div>

            {/* Confirmed */}
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Confirmed</p>
              <p className="text-3xl font-bold text-green-600">
                {loading ? '—' : confirmed}
              </p>
              <p className="text-xs text-gray-400 mt-1">ready to go</p>
            </div>

            {/* Pending Approval — links to /dashboard/pending */}
            <Link
              href="/dashboard/pending"
              className={`rounded-xl border-2 px-5 py-4 shadow-sm transition-all hover:shadow-md ${
                pendingCount > 0
                  ? 'bg-amber-50 border-amber-300 hover:border-amber-400'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Pending</p>
              <div className="flex items-center gap-2">
                <p className={`text-3xl font-bold ${pendingCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {loading ? '—' : pendingCount}
                </p>
                {pendingCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wide animate-pulse">
                    Review
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">need approval</p>
            </Link>

            {/* Completed */}
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Completed</p>
              <p className="text-3xl font-bold text-blue-600">
                {loading ? '—' : completed}
              </p>
              <p className="text-xs text-gray-400 mt-1">finished today</p>
            </div>
          </div>

          {/* ── Quick Actions ───────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1B3A5C] text-white text-sm font-semibold hover:bg-[#244B75] transition-colors shadow-sm"
            >
              <PlusIcon />
              New Appointment
            </button>
            <Link
              href="/dashboard/availability"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <ClockIcon />
              Manage Availability
            </Link>
            <Link
              href="/dashboard/calendar"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <CalendarIcon />
              View Calendar
            </Link>
          </div>

          {/* ── Upcoming Appointments ───────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-[#1B3A5C] uppercase tracking-wide">
                Upcoming Today
              </h2>
              <Link
                href="/dashboard/appointments"
                className="flex items-center gap-1 text-xs font-medium text-[#1B3A5C] hover:text-[#244B75] transition-colors"
              >
                View all
                <ArrowRightIcon />
              </Link>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="h-10 w-16 bg-gray-100 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-gray-100 rounded w-36" />
                      <div className="h-3 bg-gray-50 rounded w-24" />
                    </div>
                    <div className="h-6 w-20 bg-gray-100 rounded-full" />
                  </div>
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-gray-400 mb-2">No upcoming appointments today.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-sm font-medium text-[#1B3A5C] hover:underline"
                >
                  Book one now →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {upcoming.map(appt => {
                  const statusCfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.pending;
                  return (
                    <button
                      key={appt.id}
                      onClick={() => router.push(`/dashboard/appointments/${appt.id}`)}
                      className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/80 transition-colors text-left"
                    >
                      {/* Time badge */}
                      <div className="flex-shrink-0 w-[70px] text-center bg-[#EDF2F8] rounded-lg py-1.5">
                        <p className="text-sm font-bold text-[#1B3A5C]">
                          {formatTime(appt.start_time)}
                        </p>
                      </div>

                      {/* Client + type */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {appt.client_name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type}
                        </p>
                      </div>

                      {/* Preparer with color dot */}
                      {appt.preparer && (
                        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: appt.preparer.color_hex }}
                          />
                          <span className="text-xs text-gray-500 font-medium">
                            {appt.preparer.name}
                          </span>
                        </div>
                      )}

                      {/* Status badge */}
                      <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusCfg.className}`}>
                        {statusCfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Booking Modal ───────────────────────────────────────────── */}
      {showModal && (
        <BookingModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            showToast('Appointment booked');
            fetchAppointments();
            fetchPending();
          }}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
