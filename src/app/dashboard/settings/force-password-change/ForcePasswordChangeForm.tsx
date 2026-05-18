'use client';

import { useState, useTransition, FormEvent } from 'react';
import PasswordField from '@/components/auth/PasswordField';
import PasswordRequirementsList from '@/components/auth/PasswordRequirementsList';
import { allRulesPass } from '@/components/auth/password-rules';
import { changeForcedPassword } from './actions';

export default function ForcePasswordChangeForm() {
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit = allRulesPass(newPw, current, confirm) && !isPending;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const result = await changeForcedPassword({
        currentPassword: current,
        newPassword: newPw,
      });
      if (result && !result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <PasswordField
        id="current-password"
        label="Current password"
        value={current}
        onChange={setCurrent}
        autoComplete="current-password"
        variant="dark"
      />
      <PasswordField
        id="new-password"
        label="New password"
        value={newPw}
        onChange={setNewPw}
        autoComplete="new-password"
        variant="dark"
      />
      <PasswordField
        id="confirm-password"
        label="Confirm new password"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
        variant="dark"
      />

      <PasswordRequirementsList
        newPassword={newPw}
        currentPassword={current}
        confirmPassword={confirm}
        variant="dark"
      />

      {error && (
        <div
          className="bg-red-500/20 border border-red-400/30 rounded-md px-3 py-2"
          role="alert"
        >
          <p className="text-sm text-red-100">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-[#C1282D] hover:bg-[#a82226] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#C1282D]/40 focus:ring-offset-2 focus:ring-offset-[#03296A] shadow-sm"
      >
        {isPending ? 'Updating…' : 'Set new password'}
      </button>
    </form>
  );
}
