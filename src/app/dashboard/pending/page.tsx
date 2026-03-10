'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, Clock, Phone, Mail, Calendar, User, RefreshCw, Inbox } from 'lucide-react';
import { formatDate, formatTime, formatPhone } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingAppt {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  appointment_type: 'personal_tax' | 'corporate_tax' | 'professional_services';
  service_subtype: string | null;
  date: string;
  start_time: string;
  end_time: string;
  language: 'en' | 'es';
  created_at: string;
  preparer: { id: string; name: string; color_hex: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  personal_tax:          'Taxes — Personal',
  corporate_tax:         'Taxes — Corporate',
  professional_services: 'Professional Services',
};

const SUBTYPE_LABELS: Record<string, string> = {
  divorce:                'Divorce',
  immigration_consulting: 'Immigration Consulting',
  general_consulting:     'General Consulting',
  bankruptcy:             'Bankruptcy',
  offer_in_compromise:    'Offer in Compromise',
  other:                  'Other',
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PendingPage() {
  const [items,    setItems   ] = useState<PendingAppt[]>([]);
  const [loading,  setLoading ] = useState(true);
  const [error,    setError   ] = useState<string | null>(null);

  // Track per-item action state: 'idle' | 'approving' | 'rejecting' | 'approved' | 'rejected'
  const [actionState, setActionState] = useState<Record<string, string>>({});

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/appointments/pending');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setError('Could not load pending appointments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  async function approve(id: string) {
    setActionState(s => ({ ...s, [id]: 'approving' }));
    try {
      const res = await fetch(`/api/appointments/${id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error();
      setActionState(s => ({ ...s, [id]: 'approved' }));
      // Remove from list after brief delay to show feedback
      setTimeout(() => setItems(prev => prev.filter(a => a.id !== id)), 1200);
    } catch {
      setActionState(s => ({ ...s, [id]: 'idle' }));
    }
  }

  async function reject(id: string) {
    setActionState(s => ({ ...s, [id]: 'rejecting' }));
    try {
      const res = await fetch(`/api/appointments/${id}/reject`, { method: 'POST' });
      if (!res.ok) throw new Error();
      setActionState(s => ({ ...s, [id]: 'rejected' }));
      setTimeout(() => setItems(prev => prev.filter(a => a.id !== id)), 1200);
    } catch {
      setActionState(s => ({ ...s, [id]: 'idle' }));
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Pending Approvals</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${items.length} request${items.length !== 1 ? 's' : ''} awaiting review`}
          </p>
        </div>
        <button
          onClick={fetchPending}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 ml-8 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-40" />
                  <div className="h-3 bg-gray-100 rounded w-28" />
                  <div className="h-3 bg-gray-100 rounded w-52" />
                </div>
                <div className="flex gap-2">
                  <div className="h-9 w-24 bg-gray-100 rounded-lg" />
                  <div className="h-9 w-24 bg-gray-100 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">All caught up</h3>
          <p className="text-sm text-gray-400">No pending appointment requests.</p>
        </div>
      )}

      {/* ── Appointment list ─────────────────────────────────────────────── */}
      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map(appt => {
            const state = actionState[appt.id] ?? 'idle';
            const isActing = state === 'approving' || state === 'rejecting';
            const isDone   = state === 'approved' || state === 'rejected';

            return (
              <div
                key={appt.id}
                className={`bg-white rounded-xl border-2 p-5 transition-all duration-300 ${
                  state === 'approved' ? 'border-green-300 bg-green-50' :
                  state === 'rejected' ? 'border-red-200 bg-red-50' :
                  'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                  {/* ── Info ───────────────────────────────────────────── */}
                  <div className="flex-1 min-w-0">

                    {/* Name + type badge */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-bold text-gray-900 text-base">{appt.client_name}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EDF2F8] text-[#1B3A5C]">
                        {TYPE_LABELS[appt.appointment_type]}
                      </span>
                      {appt.service_subtype && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {SUBTYPE_LABELS[appt.service_subtype] ?? appt.service_subtype}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        appt.language === 'es' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {appt.language === 'es' ? 'ES' : 'EN'}
                      </span>
                    </div>

                    {/* Date + time */}
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="font-medium">{formatDate(appt.date)}</span>
                      <span className="text-gray-400">·</span>
                      <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{formatTime(appt.start_time)} – {formatTime(appt.end_time)}</span>
                    </div>

                    {/* Contact info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <a href={`tel:${appt.client_phone}`} className="hover:text-[#1B3A5C] hover:underline">
                          {formatPhone(appt.client_phone)}
                        </a>
                      </div>
                      {appt.client_email && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <a href={`mailto:${appt.client_email}`} className="hover:text-[#1B3A5C] hover:underline truncate max-w-[200px]">
                            {appt.client_email}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Preparer + submitted time */}
                    <div className="flex items-center gap-3 mt-2">
                      {appt.preparer && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: appt.preparer.color_hex }}
                          />
                          <User className="w-3 h-3" />
                          {appt.preparer.name}
                        </div>
                      )}
                      <span className="text-xs text-gray-400">
                        Submitted {new Date(appt.created_at).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* ── Action buttons ──────────────────────────────────── */}
                  <div className="flex items-center gap-2 flex-shrink-0 sm:flex-col sm:items-stretch">
                    {isDone ? (
                      <div className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold ${
                        state === 'approved' ? 'text-green-700 bg-green-100' : 'text-red-600 bg-red-100'
                      }`}>
                        {state === 'approved' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        {state === 'approved' ? 'Approved' : 'Rejected'}
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => approve(appt.id)}
                          disabled={isActing}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors min-w-[90px]"
                        >
                          {state === 'approving' ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => reject(appt.id)}
                          disabled={isActing}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-red-50 disabled:opacity-60 text-red-600 text-sm font-semibold rounded-lg border-2 border-red-200 hover:border-red-400 transition-colors min-w-[90px]"
                        >
                          {state === 'rejecting' ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <X className="w-4 h-4" />
                              Reject
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
