'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/login/reset` }
    );

    setLoading(false);

    if (resetError) {
      // Rate-limit responses are surfaced specifically; everything else gets
      // a generic message. We never confirm or deny that an account exists,
      // so non-existence errors are NOT shown — they just fall through to
      // the generic success state.
      const msg = resetError.message?.toLowerCase() ?? '';
      if (msg.includes('rate') || msg.includes('too many')) {
        setError('Too many requests. Please wait a few minutes and try again.');
        return;
      }
      // Treat all other errors as success to prevent email enumeration —
      // a real network failure on the user's end will manifest as a generic
      // "didn't get the email" experience, same as a non-existent address.
      setSubmitted(true);
      return;
    }

    setSubmitted(true);
  }

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

        <div className="bg-[#03296A] rounded-xl shadow-[0_8px_32px_rgba(3,41,106,0.25)] p-8">
          <h1 className="text-lg font-bold text-white mb-1">Reset your password</h1>
          <p className="text-sm text-blue-100 mb-6">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          {submitted ? (
            <div className="space-y-3">
              <div
                className="bg-emerald-500/20 border border-emerald-400/30 rounded-md px-3 py-3"
                role="status"
              >
                <p className="text-sm text-emerald-100">
                  If an account exists for that email, a reset link has been sent.
                  Check your inbox.
                </p>
              </div>
              <p className="text-xs text-blue-100">
                The link expires in 1 hour. Didn&apos;t get it? Check your spam
                folder, or try again in a few minutes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-white mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@hispanusa.com"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white placeholder:text-gray-400 transition-colors duration-150"
                />
              </div>

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
                disabled={loading || !email.trim()}
                className="w-full py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-[#C1282D] hover:bg-[#a82226] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#C1282D]/40 focus:ring-offset-2 focus:ring-offset-[#03296A] shadow-sm"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

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
