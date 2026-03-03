'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate, formatTime } from '@/lib/utils';
import type { Client, AppointmentWithClient } from '@/types';

export default function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState<'en' | 'es'>('es');
  const [hasDependents, setHasDependents] = useState(false);
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    const [clientRes, apptRes] = await Promise.all([
      fetch(`/api/clients/${params.id}`),
      fetch(`/api/appointments?client_id=${params.id}`),
    ]);
    if (clientRes.ok) {
      const c: Client = await clientRes.json();
      setClient(c);
      setPhone(c.phone ?? '');
      setEmail(c.email ?? '');
      setLanguage(c.language_preference);
      setHasDependents(c.has_dependents);
      setNotes(c.notes ?? '');
    }
    if (apptRes.ok) {
      const appts = await apptRes.json();
      setAppointments(Array.isArray(appts) ? appts.filter((a: AppointmentWithClient) => a.client_id === params.id) : []);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const saveChanges = async () => {
    setSaving(true);
    const res = await fetch(`/api/clients/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone || null, email: email || null, language_preference: language, has_dependents: hasDependents, notes: notes || null }),
    });
    if (res.ok) {
      await load();
      setEditing(false);
      showToast('Client updated');
    }
    setSaving(false);
  };

  if (loading) return (
    <>
      <Header title="Client" />
      <div className="flex-1 p-6 text-gray-400">Loading...</div>
    </>
  );

  if (!client) return (
    <>
      <Header title="Client" />
      <div className="flex-1 p-6 text-red-600">Client not found.</div>
    </>
  );

  return (
    <>
      <Header title="Client Profile" />
      {toast && (
        <div className="fixed top-4 right-4 bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          {toast}
        </div>
      )}
      <div className="flex-1 p-6 space-y-6 max-w-2xl">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {client.first_name} {client.last_name}
            </h3>
            {editing ? (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                <Button variant="primary" isLoading={saving} onClick={saveChanges}>Save</Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
            )}
          </CardHeader>
          <CardBody className="space-y-4">
            {editing ? (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Language</label>
                    <select value={language} onChange={e => setLanguage(e.target.value as 'en' | 'es')} className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="es">Spanish (Español)</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={hasDependents} onChange={e => setHasDependents(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                    Has Dependents
                  </label>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </>
            ) : (
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-gray-500">Phone</dt><dd className="text-gray-900 font-medium">{client.phone ?? '—'}</dd></div>
                <div><dt className="text-gray-500">Email</dt><dd className="text-gray-900">{client.email ?? '—'}</dd></div>
                <div><dt className="text-gray-500">Language</dt><dd className="text-gray-900">{client.language_preference === 'es' ? 'Spanish' : 'English'}</dd></div>
                <div><dt className="text-gray-500">Has Dependents</dt><dd className="text-gray-900">{client.has_dependents ? 'Yes' : 'No'}</dd></div>
                <div><dt className="text-gray-500">Type</dt><dd>{client.is_corporate ? 'Corporate' : client.is_new_client ? 'New' : 'Returning'}</dd></div>
                {client.canopy_id && <div><dt className="text-gray-500">Canopy ID</dt><dd>{client.canopy_id}</dd></div>}
                {client.notes && <div className="col-span-2"><dt className="text-gray-500">Notes</dt><dd className="italic">{client.notes}</dd></div>}
              </dl>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">Appointment History ({appointments.length})</h3></CardHeader>
          <CardBody className="p-0">
            {appointments.length === 0 ? (
              <p className="px-6 py-4 text-sm text-gray-400">No appointments on record.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {appointments.map(appt => (
                  <li
                    key={appt.id}
                    onClick={() => router.push(`/dashboard/appointments/${appt.id}`)}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatDate(appt.appointment_date)} at {formatTime(appt.appointment_time)}</p>
                      <p className="text-xs text-gray-500 capitalize">{appt.appointment_type.replace(/_/g, ' ')}</p>
                    </div>
                    <Badge status={appt.doc_status} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
