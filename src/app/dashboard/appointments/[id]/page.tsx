'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import { formatDate, formatTime } from '@/lib/utils';
import type { AppointmentDetail, DocStatus } from '@/types';

const DOC_STATUS_SEQUENCE: DocStatus[] = [
  'not_sent',
  'checklist_sent',
  'confirmed',
  'folder_opened',
  'docs_received',
];

const statusLabels: Record<DocStatus, string> = {
  not_sent: 'Not Sent',
  checklist_sent: 'Checklist Sent',
  confirmed: 'Appt Confirmed',
  folder_opened: 'Folder Opened',
  docs_received: 'Docs Received',
};

const checklistLabels: Record<string, string> = {
  checklist_1: 'Personal Tax (No Dependents)',
  checklist_2: 'Dependent Documents',
  checklist_3: 'New Client Intake Form',
  checklist_4: 'Corporate & Accounting Docs',
};

const triggerLabels: Record<string, string> = {
  immediate: 'Booking Confirmation',
  '7_day': '7-Day Reminder',
  '3_day': '3-Day Reminder',
  '1_day': '1-Day Reminder',
  manual_resend: 'Manual Resend',
};

export default function AppointmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [appt, setAppt] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resending, setResending] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/appointments/${params.id}`);
    if (res.ok) {
      setAppt(await res.json());
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const updateStatus = async (status: DocStatus) => {
    setUpdatingStatus(true);
    const res = await fetch(`/api/appointments/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc_status: status }),
    });
    if (res.ok) {
      await load();
      showToast('Status updated');
    }
    setUpdatingStatus(false);
  };

  const resendChecklist = async () => {
    setResending(true);
    const res = await fetch(`/api/appointments/${params.id}/send-checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: 'both' }),
    });
    if (res.ok) {
      await load();
      showToast('Checklist resent successfully');
    } else {
      showToast('Failed to resend checklist');
    }
    setResending(false);
  };

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
          <button onClick={() => router.back()} className="mt-2 text-sm text-blue-600">Go back</button>
        </div>
      </>
    );
  }

  const { client } = appt;

  return (
    <>
      <Header title="Appointment Detail" />
      {toast && (
        <div className="fixed top-4 right-4 bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          {toast}
        </div>
      )}
      <div className="flex-1 p-6 space-y-6 max-w-3xl">

        {/* Client + Appointment Info */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader><h3 className="font-semibold text-gray-900">Client</h3></CardHeader>
            <CardBody className="space-y-1 text-sm text-gray-700">
              <p className="font-medium text-lg text-gray-900">{client.first_name} {client.last_name}</p>
              <p>{client.phone ?? '—'}</p>
              <p>{client.email ?? '—'}</p>
              <p className="text-xs text-gray-400 uppercase">{client.language_preference === 'es' ? 'Spanish' : 'English'}</p>
              <button
                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                className="text-xs text-blue-600 hover:underline mt-1"
              >
                View client profile →
              </button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="font-semibold text-gray-900">Appointment</h3></CardHeader>
            <CardBody className="space-y-1 text-sm text-gray-700">
              <p className="font-medium">{formatDate(appt.appointment_date)} at {formatTime(appt.appointment_time)}</p>
              <p>{appt.duration_minutes} min · {appt.method.replace('_', ' ')}</p>
              <p className="capitalize">{appt.appointment_type.replace(/_/g, ' ')}</p>
              {appt.booked_by && <p className="text-gray-400 text-xs">Booked by: {appt.booked_by}</p>}
              {appt.notes && <p className="text-gray-500 italic text-xs mt-1">{appt.notes}</p>}
            </CardBody>
          </Card>
        </div>

        {/* Status Update */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Document Status</h3>
            <Badge status={appt.doc_status} />
          </CardHeader>
          <CardBody>
            <div className="flex gap-2 flex-wrap">
              {DOC_STATUS_SEQUENCE.map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={updatingStatus || s === appt.doc_status}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors disabled:cursor-default ${
                    s === appt.doc_status
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {statusLabels[s]}
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Checklists sent */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Checklists Sent</h3>
            <Button
              variant="secondary"
              isLoading={resending}
              onClick={resendChecklist}
              className="text-xs"
            >
              Resend Checklist
            </Button>
          </CardHeader>
          <CardBody>
            {appt.checklists.length === 0 ? (
              <p className="text-sm text-gray-400">No checklists recorded.</p>
            ) : (
              <ul className="space-y-1">
                {appt.checklists.map(c => (
                  <li key={c.id} className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="text-green-500">&#10003;</span>
                    {checklistLabels[c.checklist_type] ?? c.checklist_type}
                    <span className="text-gray-400 text-xs">({c.language.toUpperCase()})</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Message History */}
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">Message History</h3></CardHeader>
          <CardBody className="p-0">
            {appt.messages.length === 0 ? (
              <p className="text-sm text-gray-400 px-6 py-4">No messages sent yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Channel</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Trigger</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sent</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Recipient</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {appt.messages.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 capitalize font-medium">{m.channel}</td>
                      <td className="px-4 py-3 text-gray-600">{triggerLabels[m.trigger] ?? m.trigger}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {m.sent_at ? new Date(m.sent_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          m.status === 'sent' ? 'bg-green-100 text-green-700' :
                          m.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{m.recipient}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
