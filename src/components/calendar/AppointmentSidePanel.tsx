'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Phone, Mail, User, Clock, Tag, MessageSquare, Globe, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { formatTime, formatPhone, formatDate } from '@/lib/utils';
import type { CalendarAppt, CalendarPreparer, CalendarApptDetail, CalendarMessage } from './calendarTypes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  personal_tax:          'Personal Tax',
  corporate_tax:         'Corporate Tax',
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

const STATUS_OPTIONS = [
  { value: 'pending',   label: 'Pending',   color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  { value: 'confirmed', label: 'Confirmed', color: 'text-green-700 bg-green-50 border-green-200'   },
  { value: 'completed', label: 'Completed', color: 'text-blue-700 bg-blue-50 border-blue-200'      },
  { value: 'cancelled', label: 'Cancelled', color: 'text-red-700 bg-red-50 border-red-200'         },
] as const;

function statusBadgeClass(status: string) {
  return STATUS_OPTIONS.find(o => o.value === status)?.color
    ?? 'text-gray-700 bg-gray-50 border-gray-200';
}

function formatMessageTime(sentAt: string | null): string {
  if (!sentAt) return '—';
  const d = new Date(sentAt);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppointmentSidePanelProps {
  appt: CalendarAppt;
  preparers: CalendarPreparer[];
  onClose: () => void;
  onSave: (updated: CalendarAppt) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppointmentSidePanel({
  appt,
  preparers,
  onClose,
  onSave,
}: AppointmentSidePanelProps) {
  // Editable fields
  const [preparerId, setPreparerId] = useState(appt.preparer_id);
  const [status,     setStatus    ] = useState(appt.status);
  const [notes,      setNotes     ] = useState(appt.notes ?? '');
  const [language,   setLanguage  ] = useState(appt.language);

  // Messages (fetched separately)
  const [messages,      setMessages     ] = useState<CalendarMessage[]>([]);
  const [messagesLoading, setMsgLoading ] = useState(true);
  const [messagesError,   setMsgError   ] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // ── Fetch full detail (messages) on mount ─────────────────────────────────
  useEffect(() => {
    setMsgLoading(true);
    setMsgError(false);

    fetch(`/api/appointments/${appt.id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((detail: CalendarApptDetail) => setMessages(detail.messages ?? []))
      .catch(() => setMsgError(true))
      .finally(() => setMsgLoading(false));
  }, [appt.id]);

  // ── Re-sync editable fields when a different appointment is selected ───────
  useEffect(() => {
    setPreparerId(appt.preparer_id);
    setStatus(appt.status);
    setNotes(appt.notes ?? '');
    setLanguage(appt.language);
    setSaveError(null);
    setSaved(false);
  }, [appt.id]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      const body: Record<string, unknown> = { notes: notes || null, language };
      if (preparerId !== appt.preparer_id) body.preparer_id = preparerId;
      if (status     !== appt.status)      body.status      = status;

      const res = await fetch(`/api/appointments/${appt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? 'Save failed');
      }

      const updated: CalendarAppt = await res.json();
      onSave(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }, [appt.id, appt.preparer_id, appt.status, preparerId, status, notes, language, onSave]);

  const selectedPreparer = preparers.find(p => p.id === preparerId);
  const isDirty = preparerId !== appt.preparer_id
    || status    !== appt.status
    || notes     !== (appt.notes ?? '')
    || language  !== appt.language;

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
        <div>
          <h2 className="text-base font-semibold text-[#1B3A5C] truncate max-w-[240px]">
            {appt.client_name}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(appt.date)} · {formatTime(appt.start_time)}–{formatTime(appt.end_time)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Status badge + type */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass(appt.status)}`}>
              {STATUS_OPTIONS.find(o => o.value === appt.status)?.label ?? appt.status}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {TYPE_LABELS[appt.appointment_type]}
            </span>
            {appt.service_subtype && (
              <span className="text-xs text-gray-400">
                · {SUBTYPE_LABELS[appt.service_subtype] ?? appt.service_subtype}
              </span>
            )}
          </div>
        </div>

        {/* Client info */}
        <div className="px-5 py-4 space-y-3 border-b border-gray-100">
          <SectionLabel icon={<User className="w-3.5 h-3.5" />} label="Client" />

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>{formatPhone(appt.client_phone)}</span>
          </div>

          {appt.client_email && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{appt.client_email}</span>
            </div>
          )}
        </div>

        {/* Editable fields */}
        <div className="px-5 py-4 space-y-4 border-b border-gray-100">
          <SectionLabel icon={<Tag className="w-3.5 h-3.5" />} label="Appointment Details" />

          {/* Preparer */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Preparer
            </label>
            <div className="relative">
              <select
                value={preparerId}
                onChange={e => setPreparerId(e.target.value)}
                className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2.5 pr-9 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:border-transparent transition-all"
              >
                {preparers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {selectedPreparer && (
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedPreparer.color_hex }}
                  />
                )}
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Status
            </label>
            <div className="relative">
              <select
                value={status}
                onChange={e => setStatus(e.target.value as typeof status)}
                className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2.5 pr-9 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:border-transparent transition-all"
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Language
            </label>
            <div className="relative">
              <select
                value={language}
                onChange={e => setLanguage(e.target.value as 'en' | 'es')}
                className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2.5 pr-9 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:border-transparent transition-all"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
              <Globe className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:border-transparent resize-none transition-all"
            />
          </div>
        </div>

        {/* Message history */}
        <div className="px-5 py-4">
          <SectionLabel icon={<MessageSquare className="w-3.5 h-3.5" />} label="Message History" />

          <div className="mt-3">
            {messagesLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-4 justify-center">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading messages…
              </div>
            ) : messagesError ? (
              <p className="text-xs text-red-500 py-2">Could not load message history.</p>
            ) : messages.length === 0 ? (
              <p className="text-xs text-gray-400 py-2 text-center">No messages sent yet.</p>
            ) : (
              <div className="space-y-2">
                {messages.map(msg => (
                  <div key={msg.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                    {/* Channel icon */}
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 mt-0.5 ${
                      msg.channel === 'sms'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {msg.channel === 'sms' ? 'S' : 'E'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-gray-700 capitalize">
                          {(msg.message_type ?? msg.channel).replace(/_/g, ' ')}
                        </span>
                        <span className={`text-[11px] font-medium ${
                          msg.status === 'sent'   ? 'text-green-600' :
                          msg.status === 'failed' ? 'text-red-500' :
                          'text-gray-400'
                        }`}>
                          {msg.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {formatMessageTime(msg.sent_at)}
                      </p>
                      {msg.error_message && (
                        <p className="text-[11px] text-red-500 mt-0.5 truncate">
                          {msg.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Save footer ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-5 py-4 border-t border-gray-200 bg-gray-50">
        {saveError && (
          <div className="flex items-center gap-2 text-xs text-red-600 mb-3">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {saveError}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 ${
            saved
              ? 'bg-green-600 text-white'
              : isDirty
              ? 'bg-[#1B3A5C] text-white hover:bg-[#244B75] active:scale-[0.98]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : saved ? (
            'Saved ✓'
          ) : (
            'Save Changes'
          )}
        </button>
        {!isDirty && !saving && !saved && (
          <p className="text-center text-[11px] text-gray-400 mt-1.5">No unsaved changes</p>
        )}
      </div>
    </div>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <span className="text-gray-400">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
    </div>
  );
}
