'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import { formatTime } from '@/lib/utils';
import type { Preparer, Appointment, AppointmentStatus } from '@/types/scheduling';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MessageRow {
  id: string;
  channel: 'sms' | 'email';
  message_type: string;
  status: 'sent' | 'failed' | 'pending';
  error_message: string | null;
  sent_at: string;
}

interface AppointmentDetail extends Appointment {
  preparer: Pick<Preparer, 'id' | 'name' | 'color_hex' | 'color_name'>;
  messages: MessageRow[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────

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

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
  completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700' },
};

const MESSAGE_TYPE_LABELS: Record<string, string> = {
  confirmation:      'Booking Confirmation',
  reminder_7d:       '7-Day Reminder',
  reminder_3d:       '3-Day Reminder',
  reminder_1d:       '1-Day Reminder',
  approval:          'Approval',
  rejection:         'Rejection',
  checklist_manual:  'Checklist (Manual)',
};

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AppointmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [appt, setAppt]             = useState<AppointmentDetail | null>(null);
  const [preparers, setPreparers]   = useState<Preparer[]>([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState('');
  const [toastType, setToastType]   = useState<'success' | 'error'>('success');

  // Reassign state
  const [showReassign, setShowReassign]   = useState(false);
  const [reassignTo, setReassignTo]       = useState('');
  const [reassigning, setReassigning]     = useState(false);

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Send checklist
  const [sendingChecklist, setSendingChecklist] = useState(false);

  // ── Toast ────────────────────────────────────────────────────────────────
  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3500);
  }

  // ── Load ─────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    const [apptRes, prepRes] = await Promise.all([
      fetch(`/api/appointments/${params.id}`),
      fetch('/api/preparers'),
    ]);
    if (apptRes.ok) setAppt(await apptRes.json());
    if (prepRes.ok) setPreparers(await prepRes.json());
    setLoading(false);
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  // ── Status update ────────────────────────────────────────────────────────
  async function updateStatus(status: AppointmentStatus) {
    if (!appt || appt.status === status) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/appointments/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      await load();
      showToast('Status updated');
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  }

  // ── Reassign ─────────────────────────────────────────────────────────────
  async function handleReassign() {
    if (!reassignTo || reassignTo === appt?.preparer_id) return;
    setReassigning(true);
    try {
      const res = await fetch(`/api/appointments/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preparer_id: reassignTo }),
      });
      if (!res.ok) throw new Error();
      setShowReassign(false);
      setReassignTo('');
      await load();
      showToast('Appointment reassigned');
    } catch {
      showToast('Failed to reassign appointment', 'error');
    } finally {
      setReassigning(false);
    }
  }

  // ── Send checklist ────────────────────────────────────────────────────────
  async function handleSendChecklist() {
    setSendingChecklist(true);
    try {
      const res = await fetch(`/api/appointments/${params.id}/send-checklist`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to send checklist');
      }
      await load();
      showToast('Document checklist sent');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send checklist', 'error');
    } finally {
      setSendingChecklist(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Header title="Appointment" />
        <div className="flex-1 p-6 text-gray-400">Loading...</div>
      </>
    );
  }

  if (!appt) {
    return (
      <>
        <Header title="Appointment" />
        <div className="flex-1 p-6">
          <p className="text-red-600">Appointment not found.</p>
          <button onClick={() => router.back()} className="mt-2 text-sm text-[#1B3A5C] hover:underline">
            ← Go back
          </button>
        </div>
      </>
    );
  }

  const statusCfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.pending;
  const isCancelled = appt.status === 'cancelled';

  return (
    <>
      <Header title="Appointment Detail" />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium text-white ${
          toastType === 'error' ? 'bg-red-600' : 'bg-green-700'
        }`}>
          {toast}
        </div>
      )}

      <div className="flex-1 p-6 space-y-5 max-w-3xl">

        {/* Back */}
        <button
          onClick={() => router.push('/dashboard/appointments')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All appointments
        </button>

        {/* Client + Appointment */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader><h3 className="font-semibold text-gray-900">Client</h3></CardHeader>
            <CardBody className="space-y-1 text-sm text-gray-700">
              <p className="font-medium text-base text-gray-900">{appt.client_name}</p>
              <p>{appt.client_phone}</p>
              {appt.client_email && <p className="text-gray-500">{appt.client_email}</p>}
              <p className="text-xs text-gray-400 uppercase mt-1">
                {appt.language === 'es' ? 'Spanish' : 'English'}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="font-semibold text-gray-900">Appointment</h3></CardHeader>
            <CardBody className="space-y-1.5 text-sm text-gray-700">
              <p className="font-medium text-gray-900">{formatDateDisplay(appt.date)}</p>
              <p>{formatTime(appt.start_time)} – {formatTime(appt.end_time)}</p>
              <p>{TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type}</p>
              {appt.service_subtype && (
                <p className="text-gray-500 text-xs">{SUBTYPE_LABELS[appt.service_subtype] ?? appt.service_subtype}</p>
              )}
              {appt.notes && (
                <p className="text-gray-400 italic text-xs mt-2 border-t border-gray-100 pt-2">{appt.notes}</p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Preparer + Reassign */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Preparer</h3>
            {!isCancelled && (
              <button
                onClick={() => { setShowReassign(s => !s); setReassignTo(''); }}
                className="text-xs text-[#1B3A5C] font-medium hover:underline"
              >
                {showReassign ? 'Cancel' : 'Reassign'}
              </button>
            )}
          </CardHeader>
          <CardBody>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: appt.preparer.color_hex }}
              />
              <span className="text-sm font-medium text-gray-900">{appt.preparer.name}</span>
            </div>

            {showReassign && (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
                <p className="text-xs text-gray-500 font-medium">Reassign to:</p>
                <div className="flex gap-2">
                  <select
                    value={reassignTo}
                    onChange={e => setReassignTo(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]"
                  >
                    <option value="">Select preparer...</option>
                    {preparers
                      .filter(p => p.id !== appt.preparer_id)
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </select>
                  <Button
                    variant="primary"
                    isLoading={reassigning}
                    disabled={!reassignTo}
                    onClick={handleReassign}
                    className="text-xs"
                  >
                    Confirm
                  </Button>
                </div>
                <p className="text-xs text-amber-600">
                  Frees the old time slot and books the same time for the new preparer.
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Status</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}>
              {statusCfg.label}
            </span>
          </CardHeader>
          <CardBody>
            {isCancelled ? (
              <p className="text-sm text-gray-400">This appointment has been cancelled.</p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {(['pending', 'confirmed', 'completed', 'cancelled'] as AppointmentStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    disabled={updatingStatus || s === appt.status}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors disabled:cursor-default ${
                      s === appt.status
                        ? s === 'cancelled'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-[#1B3A5C] text-white border-[#1B3A5C]'
                        : s === 'cancelled'
                        ? 'bg-white text-red-500 border-red-200 hover:bg-red-50'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Document Checklist */}
        {appt.status === 'confirmed' && (
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Document Checklist</h3>
              {appt.checklist_sent && (
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                  Sent
                </span>
              )}
            </CardHeader>
            <CardBody>
              {appt.checklist_sent ? (
                <p className="text-sm text-gray-500">
                  Document checklist has been sent to the client.
                </p>
              ) : (
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-500 flex-1">
                    No checklist has been sent yet.
                  </p>
                  <Button
                    variant="primary"
                    isLoading={sendingChecklist}
                    onClick={handleSendChecklist}
                    className="text-sm whitespace-nowrap"
                  >
                    Send Document Checklist
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Message history */}
        {appt.messages && appt.messages.length > 0 && (
          <Card>
            <CardHeader><h3 className="font-semibold text-gray-900">Message History</h3></CardHeader>
            <CardBody className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Channel</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sent</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {appt.messages.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 capitalize font-medium text-gray-700">{m.channel}</td>
                      <td className="px-4 py-3 text-gray-600">{MESSAGE_TYPE_LABELS[m.message_type] ?? m.message_type}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {m.sent_at ? new Date(m.sent_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          m.status === 'sent'   ? 'bg-green-100 text-green-700' :
                          m.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                  'bg-yellow-100 text-yellow-700'
                        }`}>
                          {m.status}
                        </span>
                        {m.error_message && (
                          <span className="text-xs text-red-400 ml-2">{m.error_message}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
