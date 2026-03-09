'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import BookingModal from '@/components/appointments/BookingModal';
import ToastContainer, { type ToastItem } from '@/components/ui/Toast';
import { Table, TableRow, TableCell } from '@/components/ui/Table';
import { formatTime } from '@/lib/utils';
import type { Preparer, Appointment, AppointmentStatus } from '@/types/scheduling';

interface AppointmentRow extends Appointment {
  preparer: Pick<Preparer, 'id' | 'name' | 'color_hex' | 'color_name'> | null;
}

const TYPE_LABELS: Record<string, string> = {
  personal_tax:          'Personal Tax',
  corporate_tax:         'Corporate Tax',
  professional_services: 'Professional Services',
};

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
  completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700' },
};

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string): string {
  if (dateStr === todayString()) return 'Today';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [date, setDate]                 = useState(todayString);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const showToast = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const fetchAppointments = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments?date=${d}`);
      if (!res.ok) throw new Error();
      const data: AppointmentRow[] = await res.json();
      setAppointments(data);
    } catch {
      showToast('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAppointments(date); }, [date, fetchAppointments]);

  const confirmed = appointments.filter(a => a.status === 'confirmed').length;
  const cancelled = appointments.filter(a => a.status === 'cancelled').length;

  return (
    <>
      <Header title="Dashboard" />

      <div className="flex-1 p-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
            <p className="text-xs text-gray-400 uppercase font-medium mb-1">Total</p>
            <p className="text-2xl font-bold text-[#1B3A5C]">{appointments.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
            <p className="text-xs text-gray-400 uppercase font-medium mb-1">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">{confirmed}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
            <p className="text-xs text-gray-400 uppercase font-medium mb-1">Cancelled</p>
            <p className="text-2xl font-bold text-red-500">{cancelled}</p>
          </div>
        </div>

        {/* Date nav + New Appointment */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-800">
              {formatDateLabel(date)}
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]"
              />
              {date !== todayString() && (
                <button
                  onClick={() => setDate(todayString())}
                  className="text-xs text-[#1B3A5C] border border-[#1B3A5C]/30 rounded-md px-2.5 py-1.5 hover:bg-[#EDF2F8] transition-colors"
                >
                  Today
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B3A5C] text-white text-sm font-medium hover:bg-[#1B3A5C]/90 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Appointment
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">
            Loading...
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-400 mb-3">No appointments for this date.</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-sm text-[#1B3A5C] font-medium hover:underline"
            >
              Book one now →
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table headers={['Time', 'Client', 'Type', 'Preparer', 'Status']}>
              {appointments.map(appt => {
                const statusCfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.pending;
                return (
                  <TableRow
                    key={appt.id}
                    onClick={() => router.push(`/dashboard/appointments/${appt.id}`)}
                  >
                    <TableCell className="font-medium text-gray-700">
                      {formatTime(appt.start_time)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">{appt.client_name}</div>
                      <div className="text-xs text-gray-400">{appt.client_phone}</div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type}
                    </TableCell>
                    <TableCell>
                      {appt.preparer ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: appt.preparer.color_hex }}
                          />
                          <span className="text-gray-700">{appt.preparer.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}>
                        {statusCfg.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </Table>
          </div>
        )}
      </div>

      {showModal && (
        <BookingModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            showToast('Appointment booked');
            fetchAppointments(date);
          }}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
