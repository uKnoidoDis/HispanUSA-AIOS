'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ChecklistPreview from '@/components/appointments/ChecklistPreview';
import type { Client, AppointmentType } from '@/types';

export default function NewAppointmentPage() {
  const router = useRouter();

  // Client search
  const [clientSearch, setClientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isNewClient, setIsNewClient] = useState(false);
  const [searching, setSearching] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState<'en' | 'es'>('es');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [method, setMethod] = useState('in_person');
  const [appointmentType, setAppointmentType] = useState<AppointmentType | ''>('');
  const [hasDependents, setHasDependents] = useState(false);
  const [clientIsNew, setClientIsNew] = useState(false);
  const [bookedBy, setBookedBy] = useState('');
  const [notes, setNotes] = useState('');

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const searchClients = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/clients?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchClients(clientSearch), 300);
    return () => clearTimeout(t);
  }, [clientSearch, searchClients]);

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setFirstName(client.first_name);
    setLastName(client.last_name);
    setPhone(client.phone ?? '');
    setEmail(client.email ?? '');
    setLanguage(client.language_preference);
    setHasDependents(client.has_dependents);
    setIsNewClient(false);
    setClientIsNew(false);
    setSearchResults([]);
    setClientSearch('');
  };

  const clearClient = () => {
    setSelectedClient(null);
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setIsNewClient(true);
    setClientIsNew(true);
  };

  const canSubmit =
    (firstName || selectedClient) &&
    (phone || email) &&
    appointmentDate &&
    appointmentTime &&
    appointmentType;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError('');

    try {
      const body = {
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        email: email || null,
        language_preference: language,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        duration_minutes: Number(duration),
        method,
        appointment_type: appointmentType,
        has_dependents: hasDependents,
        is_new_client: clientIsNew || appointmentType === 'personal_new',
        booked_by: bookedBy || null,
        notes: notes || null,
      };

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.formErrors?.join(', ') ?? data.error ?? 'Something went wrong');
        return;
      }

      router.push(`/dashboard/appointments/${data.appointment_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header title="Add Appointment" />
      <div className="flex-1 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* 1. Find or Create Client */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">1. Client</h3>

            {selectedClient ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 flex justify-between items-start">
                <div>
                  <p className="font-medium text-green-800">{selectedClient.first_name} {selectedClient.last_name}</p>
                  <p className="text-sm text-green-600">{selectedClient.phone} · {selectedClient.email}</p>
                  <p className="text-xs text-green-500 mt-0.5">Returning client</p>
                </div>
                <button type="button" onClick={clearClient} className="text-sm text-gray-500 hover:text-gray-700">
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label="Search existing clients"
                    placeholder="Type name, phone, or email..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                  />
                  {searching && (
                    <p className="text-xs text-gray-400 mt-1">Searching...</p>
                  )}
                  {searchResults.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map(c => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => selectClient(c)}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50"
                          >
                            <span className="font-medium">{c.first_name} {c.last_name}</span>
                            <span className="text-gray-400 ml-2">{c.phone ?? c.email}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <p className="text-sm text-gray-500 text-center">— or enter new client info —</p>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                  <Input label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} required />
                  <Input label="Phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(954) 000-0000" />
                  <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>

                <Select
                  label="Language"
                  value={language}
                  onChange={e => setLanguage(e.target.value as 'en' | 'es')}
                  options={[
                    { value: 'es', label: 'Spanish (Español)' },
                    { value: 'en', label: 'English' },
                  ]}
                />
              </div>
            )}
          </section>

          {/* 2. Appointment Details */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">2. Appointment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date"
                type="date"
                value={appointmentDate}
                onChange={e => setAppointmentDate(e.target.value)}
                required
              />
              <Input
                label="Time"
                type="time"
                value={appointmentTime}
                onChange={e => setAppointmentTime(e.target.value)}
                required
              />
              <Select
                label="Duration"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                options={[
                  { value: '30', label: '30 minutes' },
                  { value: '60', label: '60 minutes' },
                  { value: '90', label: '90 minutes' },
                ]}
              />
              <Select
                label="Method"
                value={method}
                onChange={e => setMethod(e.target.value)}
                options={[
                  { value: 'in_person', label: 'In Person' },
                  { value: 'zoom', label: 'Zoom' },
                  { value: 'telephone', label: 'Phone Call' },
                  { value: 'whatsapp', label: 'WhatsApp' },
                ]}
              />
            </div>
          </section>

          {/* 3. Appointment Type */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">3. Appointment Type</h3>
            <div className="flex gap-3 flex-wrap">
              {([
                { value: 'personal_returning', label: 'Personal — Returning' },
                { value: 'personal_new', label: 'Personal — New' },
                { value: 'corporate', label: 'Corporate' },
              ] as { value: AppointmentType; label: string }[]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setAppointmentType(opt.value);
                    if (opt.value === 'personal_new') setClientIsNew(true);
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                    appointmentType === opt.value
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDependents}
                  onChange={e => setHasDependents(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Has Dependents
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clientIsNew}
                  onChange={e => setClientIsNew(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                New Client
              </label>
            </div>
          </section>

          {/* 4. Staff */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">4. Staff</h3>
            <div className="space-y-4">
              <Input
                label="Booked by"
                placeholder="Your name"
                value={bookedBy}
                onChange={e => setBookedBy(e.target.value)}
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Optional notes..."
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          {/* 5. Live Checklist Preview */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-3">Checklist Preview</h3>
            <ChecklistPreview
              appointmentType={appointmentType}
              hasDependents={hasDependents}
              isNewClient={clientIsNew || appointmentType === 'personal_new'}
              language={language}
            />
          </section>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit}
            isLoading={isSubmitting}
            className="w-full py-3 text-base"
          >
            Confirm and Send Checklist
          </Button>
        </form>
      </div>
    </>
  );
}
