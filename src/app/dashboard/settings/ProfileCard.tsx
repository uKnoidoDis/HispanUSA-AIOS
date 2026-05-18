'use client';

import { useState, useTransition, FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { updateOwnProfile } from './actions';

interface Props {
  email: string;
  initialDisplayName: string;
  initialPhoneE164: string;
}

const DISPLAY_NAME_RE = /^[A-Za-zÀ-ÿ '\-]+$/;

// "+13055551234" → "(305) 555-1234". Empty or malformed input → "".
function formatPhoneForDisplay(e164: string): string {
  if (!e164.startsWith('+1') || e164.length !== 12) return '';
  const d = e164.slice(2);
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

// Strips formatting and leading country code so two visually different
// strings representing the same US number compare equal.
function toNationalDigits(input: string): string {
  const d = input.replace(/\D/g, '');
  if (d.length === 11 && d[0] === '1') return d.slice(1);
  return d;
}

export default function ProfileCard({
  email,
  initialDisplayName,
  initialPhoneE164,
}: Props) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [phone, setPhone] = useState(formatPhoneForDisplay(initialPhoneE164));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const trimmedName = displayName.trim();
  const nameChanged = trimmedName !== initialDisplayName.trim();
  const phoneChanged =
    toNationalDigits(phone) !== toNationalDigits(initialPhoneE164);
  const hasChanged = nameChanged || phoneChanged;

  const nameValid =
    trimmedName === '' ||
    (trimmedName.length >= 2 &&
      trimmedName.length <= 60 &&
      DISPLAY_NAME_RE.test(trimmedName));

  const phoneDigits = toNationalDigits(phone);
  const phoneValid = phoneDigits === '' || phoneDigits.length === 10;

  const canSubmit = hasChanged && nameValid && phoneValid && !isPending;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateOwnProfile({
        displayName: trimmedName,
        phone: phone.trim(),
      });
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <section className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200">
      <header className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-[#111827]">Profile</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          How your name appears in the dashboard. Email is used to sign in and
          cannot be changed here.
        </p>
      </header>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label
            htmlFor="display-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Display name
          </label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#03296A]/40 focus:border-[#03296A] placeholder:text-gray-400 transition-colors duration-150"
            placeholder="Your full name"
            autoComplete="name"
          />
          {!nameValid && (
            <p className="mt-1 text-xs text-red-600">
              Display name must be 2–60 characters: letters, spaces, hyphens,
              apostrophes only.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#03296A]/40 focus:border-[#03296A] placeholder:text-gray-400 transition-colors duration-150"
            placeholder="(305) 555-1234"
            autoComplete="tel"
          />
          {!phoneValid && (
            <p className="mt-1 text-xs text-red-600">
              Enter a 10-digit US phone number.
            </p>
          )}
        </div>

        {error && (
          <div
            className="bg-red-50 border border-red-200 rounded-md px-3 py-2"
            role="alert"
          >
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div
            className="bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 flex items-center gap-2"
            role="status"
          >
            <CheckCircle2
              className="w-4 h-4 text-emerald-600 shrink-0"
              aria-hidden="true"
            />
            <p className="text-sm text-emerald-700">Profile saved.</p>
          </div>
        )}

        <div className="pt-1">
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-5 py-2 rounded-md text-sm font-semibold text-white bg-[#03296A] hover:bg-[#02214F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#03296A]/40 focus:ring-offset-2 shadow-sm"
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </section>
  );
}
