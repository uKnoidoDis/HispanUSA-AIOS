'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, X } from 'lucide-react';
import Header from '@/components/dashboard/Header';
import BookingModal from '@/components/appointments/BookingModal';
import ToastContainer, { type ToastItem } from '@/components/ui/Toast';
import { Table, TableRow, TableCell } from '@/components/ui/Table';
import { formatTime } from '@/lib/utils';
import type { Preparer, Appointment, AppointmentStatus } from '@/types/scheduling';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AppointmentRow extends Appointment {
  preparer: Pick<Preparer, 'id' | 'name' | 'color_hex' | 'color_name'>;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  personal_tax:          'Personal Tax',
  corporate_tax:         'Corporate Tax',
  professional_services: 'Professional Services',
};

const SUBTYPE_LABELS: Record<string, string> = {
  divorce:                'Divorce',
  immigration_consulting: 'Immigration',
  general_consulting:     'Consulting',
  bankruptcy:             'Bankruptcy',
  offer_in_compromise:    'OIC',
  other:                  'Other',
};

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  confirmed: { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-600 border border-red-200' },
  completed: { label: 'Completed', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
};

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const router = useRouter();

  const [appointments, setAppointments]       = useState<AppointmentRow[]>([]);
  const [preparers, setPreparers]             = useState<Preparer[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [showModal, setShowModal]             = useState(false);
  const [cancelling, setCancelling]           = useState<string | null>(null);

  // Filters
  const [search, setSearch]                   = useState('');
  const [filterStatus, setFilterStatus]       = useState('');
  const [filterPreparer, setFilterPreparer]   = useState('');
  const [filterType, setFilterType]           = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd]     = useState('');

  // Toast
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const showToast = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus)    params.set('status',      filterStatus);
      if (filterPreparer)  params.set('preparer_id', filterPreparer);
      if (filterDateStart) params.set('date_start',  filterDateStart);
      if (filterDateEnd)   params.set('date_end',    filterDateEnd);

      const [apptRes, prepRes] = await Promise.all([
        fetch(`/api/appointments?${params}`),
        fetch('/api/preparers'),
      ]);

      if (!apptRes.ok) throw new Error('Failed to load appointments');
      const apptData: AppointmentRow[] = await apptRes.json();
      setAppointments(apptData);

      if (prepRes.ok) {
        const prepData: Preparer[] = await prepRes.json();
        setPreparers(prepData);
      }
    } catch {
      showToast('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPreparer, filterDateStart, filterDateEnd, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Client-side search & type filter ─────────────────────────────────────
  const filtered = useMemo(() => {
    let result = appointments;
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(a =>
        a.client_name.toLowerCase().includes(lower) ||
        a.client_phone.includes(search)
      );
    }
    if (filterType) {
      result = result.filter(a => a.appointment_type === filterType);
    }
    return result;
  }, [appointments, search, filterType]);

  // ── Cancel ───────────────────────────────────────────────────────────────
  async function handleCancel(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Cancel this appointment? This will free the time slot.')) return;
    setCancelling(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!res.ok) throw new Error();
      showToast('Appointment cancelled');
      await fetchData();
    } catch {
      showToast('Failed to cancel appointment', 'error');
    } finally {
      setCancelling(null);
    }
  }

  function handleReassign(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    router.push(`/dashboard/appointments/${id}`);
  }

  const hasFilters = search || filterStatus || filterPreparer || filterType || filterDateStart || filterDateEnd;

  return (
    <>
      <Header title="Appointments" />

      <div className="flex-1 p-6">

        {/* Top bar — single "New Appointment" button top-right */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500 font-normal">
            {loading ? 'Loading...' : `${filtered.length} appointment${filtered.length !== 1 ? 's' : ''}`}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#1B3A5C] text-white text-sm font-medium hover:bg-[#244B75] transition-colors duration-150 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/40 focus:border-[#1B3A5C] w-56 transition-colors duration-150"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/40 focus:border-[#1B3A5C] transition-colors duration-150"
          >
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filterPreparer}
            onChange={e => setFilterPreparer(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/40 focus:border-[#1B3A5C] transition-colors duration-150"
          >
            <option value="">All Preparers</option>
            {preparers.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/40 focus:border-[#1B3A5C] transition-colors duration-150"
          >
            <option value="">All Types</option>
            <option value="personal_tax">Personal Tax</option>
            <option value="corporate_tax">Corporate Tax</option>
            <option value="professional_services">Professional Services</option>
          </select>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={filterDateStart}
              onChange={e => setFilterDateStart(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/40 focus:border-[#1B3A5C] transition-colors duration-150"
              aria-label="From date"
            />
            <span className="text-gray-400 text-xs">–</span>
            <input
              type="date"
              value={filterDateEnd}
              onChange={e => setFilterDateEnd(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/40 focus:border-[#1B3A5C] transition-colors duration-150"
              aria-label="To date"
            />
          </div>
          {hasFilters && (
            <button
              onClick={() => {
                setSearch(''); setFilterStatus(''); setFilterPreparer('');
                setFilterType(''); setFilterDateStart(''); setFilterDateEnd('');
              }}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors duration-150"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-12 text-center text-gray-400">
            Loading appointments...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-12 text-center">
            <p className="text-gray-400 mb-3">No appointments found.</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-sm text-[#1B3A5C] font-medium hover:text-[#244B75] transition-colors duration-150"
            >
              Book the first one
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
            <Table headers={['Date', 'Time', 'Client', 'Type', 'Preparer', 'Status', 'Actions']}>
              {filtered.map(appt => {
                const statusCfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.pending;
                const isPast = appt.date < todayString();

                return (
                  <TableRow
                    key={appt.id}
                    onClick={() => router.push(`/dashboard/appointments/${appt.id}`)}
                    className={isPast && appt.status !== 'cancelled' ? 'opacity-60' : ''}
                  >
                    <TableCell className="font-medium text-gray-900">
                      {formatDateDisplay(appt.date)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {formatTime(appt.start_time)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">{appt.client_name}</div>
                      <div className="text-xs text-gray-400">{appt.client_phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-700">{TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type}</div>
                      {appt.service_subtype && (
                        <div className="text-xs text-gray-400">{SUBTYPE_LABELS[appt.service_subtype] ?? appt.service_subtype}</div>
                      )}
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusCfg.className}`}>
                        {statusCfg.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      {appt.status !== 'cancelled' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={e => handleReassign(appt.id, e)}
                            className="text-xs text-[#1B3A5C] font-medium hover:text-[#244B75] transition-colors duration-150"
                          >
                            Reassign
                          </button>
                          <span className="text-gray-200">|</span>
                          <button
                            onClick={e => handleCancel(appt.id, e)}
                            disabled={cancelling === appt.id}
                            className="text-xs text-red-500 font-medium hover:text-red-600 disabled:opacity-50 transition-colors duration-150"
                          >
                            {cancelling === appt.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        </div>
                      )}
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
            fetchData();
          }}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
