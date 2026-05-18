'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import PasswordField from '@/components/auth/PasswordField';
import PasswordRequirementsList from '@/components/auth/PasswordRequirementsList';
import { allRulesPassExcept } from '@/components/auth/password-rules';
import { completeResetPassword } from './actions';

type Status = 'detecting' | 'ready' | 'invalid';

const EXCLUDE_KEYS = ['different'];

function ResetForm() {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<Status>('detecting');
  const [statusError, setStatusError] = useState('');

  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Token detection + session establishment.
  useEffect(() => {
    let cancelled = false;

    async function establish() {
      // 1. URL ?error= param (set by /auth/confirm route handler on failure).
      const urlError = searchParams.get('error');
      if (urlError === 'invalid') {
        setStatus('invalid');
        setStatusError(
          'This reset link is invalid or has expired. Request a new one to continue.'
        );
        return;
      }
      if (urlError === 'missing') {
        setStatus('invalid');
        setStatusError(
          'This reset link is missing required information. Request a new one to continue.'
        );
        return;
      }

      const supabase = createBrowserClient();

      // 2. Recovery session pre-established server-side by /auth/confirm.
      // Only honored when /auth/confirm explicitly marked the redirect with
      // ?verified=1. This prevents a normally-logged-in user who navigates
      // directly to /login/reset from seeing the password form.
      if (searchParams.get('verified') === '1') {
        const {
          data: { user: preEstablished },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (preEstablished) {
          setStatus('ready');
          return;
        }
        // verified=1 but no session — cookies were lost or expired between
        // /auth/confirm and this page load. Treat as invalid.
        setStatus('invalid');
        setStatusError(
          'This reset link is invalid or has expired. Request a new one to continue.'
        );
        return;
      }

      // 3. Edge-case local sign-out. With the verified-gated branch 2 in
      // place, this also clears any non-recovery session that the user
      // might have so the implicit-flow detection below starts clean.
      // 'local' scope leaves other tabs and devices alone.
      await supabase.auth.signOut({ scope: 'local' });

      // 4. Implicit flow: #access_token=... in URL hash. The Supabase SDK
      // auto-processes this when detectSessionInUrl=true (default).
      if (
        typeof window !== 'undefined' &&
        window.location.hash.includes('access_token')
      ) {
        await new Promise<void>((resolve) => {
          let resolved = false;
          const finish = () => {
            if (resolved) return;
            resolved = true;
            sub.subscription.unsubscribe();
            resolve();
          };
          const { data: sub } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
              finish();
            }
          });
          // Hard timeout in case the SDK never fires (malformed hash, etc).
          setTimeout(finish, 3000);
        });

        if (cancelled) return;
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setStatus('ready');
          return;
        }
        setStatus('invalid');
        setStatusError(
          'This reset link is invalid or has expired. Request a new one to continue.'
        );
        return;
      }

      // 5. No way to establish a recovery session — invalid.
      setStatus('invalid');
      setStatusError(
        'This reset link is missing required information. Request a new one to continue.'
      );
    }

    establish();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit =
    status === 'ready' &&
    !submitting &&
    allRulesPassExcept(newPw, '', confirm, EXCLUDE_KEYS);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitError(null);
    setSubmitting(true);
    const result = await completeResetPassword({ newPassword: newPw });
    // Success: action redirects server-side; we never see a result.
    if (result && !result.success) {
      setSubmitError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-[#03296A] rounded-xl shadow-[0_8px_32px_rgba(3,41,106,0.25)] p-8">
      {status === 'detecting' && (
        <p className="text-sm text-blue-100">Validating your reset link…</p>
      )}

      {status === 'invalid' && (
        <div className="space-y-4">
          <h1 className="text-lg font-bold text-white">Link expired or invalid</h1>
          <div
            className="bg-red-500/20 border border-red-400/30 rounded-md px-3 py-3"
            role="alert"
          >
            <p className="text-sm text-red-100">{statusError}</p>
          </div>
          <Link
            href="/login/forgot-password"
            className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-[#C1282D] hover:bg-[#a82226] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#C1282D]/40 focus:ring-offset-2 focus:ring-offset-[#03296A] shadow-sm"
          >
            Request a new reset link
          </Link>
        </div>
      )}

      {status === 'ready' && (
        <>
          <h1 className="text-lg font-bold text-white mb-1">
            Choose a new password
          </h1>
          <p className="text-sm text-blue-100 mb-6">
            Pick something you&apos;ll remember. You&apos;ll use this to sign in
            next time.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
              currentPassword=""
              confirmPassword={confirm}
              variant="dark"
              excludeKeys={EXCLUDE_KEYS}
            />

            {submitError && (
              <div
                className="bg-red-500/20 border border-red-400/30 rounded-md px-3 py-2"
                role="alert"
              >
                <p className="text-sm text-red-100">{submitError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-[#C1282D] hover:bg-[#a82226] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#C1282D]/40 focus:ring-offset-2 focus:ring-offset-[#03296A] shadow-sm"
            >
              {submitting ? 'Updating…' : 'Set new password'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      className="min-h-screen bg-white flex items-center justify-center px-4 py-10"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/hispanusa-logo.png"
            alt="HispanUSA"
            width={440}
            height={147}
            style={{ height: 'auto' }}
            className="mx-auto mb-3"
            priority
          />
          <p className="text-sm font-medium text-[#03296A] mt-1">AIOS Dashboard</p>
        </div>

        <Suspense
          fallback={
            <div className="bg-[#03296A] rounded-xl shadow-[0_8px_32px_rgba(3,41,106,0.25)] p-8">
              <p className="text-sm text-blue-100">Loading…</p>
            </div>
          }
        >
          <ResetForm />
        </Suspense>

        <div className="flex justify-center mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#03296A] hover:text-[#02214F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to login
          </Link>
        </div>

        <div className="flex flex-col items-center mt-6">
          <Image
            src="/dhs-logo-dark.png"
            alt="Dark Horse Systems"
            width={150}
            height={50}
            style={{ height: 'auto' }}
          />
          <p className="text-[11px] text-[#111827] font-medium mt-1">
            Powered by Dark Horse Systems
          </p>
        </div>
      </div>
    </div>
  );
}
