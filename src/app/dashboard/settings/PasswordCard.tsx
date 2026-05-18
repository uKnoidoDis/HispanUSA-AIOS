'use client';

import { useState, useTransition, FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import PasswordField from '@/components/auth/PasswordField';
import PasswordRequirementsList from '@/components/auth/PasswordRequirementsList';
import { allRulesPass } from '@/components/auth/password-rules';
import { changeOwnPassword } from './actions';

export default function PasswordCard() {
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canSubmit = allRulesPass(newPw, current, confirm) && !isPending;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await changeOwnPassword({
        currentPassword: current,
        newPassword: newPw,
      });
      if (result.success) {
        setCurrent('');
        setNewPw('');
        setConfirm('');
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
        <h2 className="text-base font-semibold text-[#111827]">Password</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Change the password you use to sign in.
        </p>
      </header>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4" noValidate>
        <PasswordField
          id="settings-current"
          label="Current password"
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
          variant="light"
        />
        <PasswordField
          id="settings-new"
          label="New password"
          value={newPw}
          onChange={setNewPw}
          autoComplete="new-password"
          variant="light"
        />
        <PasswordField
          id="settings-confirm"
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          variant="light"
        />

        <PasswordRequirementsList
          newPassword={newPw}
          currentPassword={current}
          confirmPassword={confirm}
          variant="light"
        />

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
            <p className="text-sm text-emerald-700">
              Password updated. Confirmation email sent.
            </p>
          </div>
        )}

        <div className="pt-1">
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-5 py-2 rounded-md text-sm font-semibold text-white bg-[#03296A] hover:bg-[#02214F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#03296A]/40 focus:ring-offset-2 shadow-sm"
          >
            {isPending ? 'Updating…' : 'Change password'}
          </button>
        </div>
      </form>
    </section>
  );
}
