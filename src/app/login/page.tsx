'use client';

import { useState, FormEvent, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="bg-[#03296A] rounded-xl shadow-[0_8px_32px_rgba(3,41,106,0.25)] p-8">
      <h2 className="text-lg font-bold text-white mb-1">
        Sign in
      </h2>
      <p className="text-sm text-blue-200/60 mb-6">
        Staff access only
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm bg-white text-gray-900
                       focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white
                       placeholder:text-gray-400 transition-colors duration-150"
            placeholder="you@hispanusa.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-white mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm bg-white text-gray-900
                       focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white
                       placeholder:text-gray-400 transition-colors duration-150"
          />
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-md px-3 py-2">
            <p className="text-sm text-red-100">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-md text-sm font-semibold text-white
                     bg-[#C1282D] hover:bg-[#a82226] disabled:opacity-60 disabled:cursor-not-allowed
                     transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#C1282D]/40 focus:ring-offset-2 focus:ring-offset-[#03296A]
                     shadow-sm"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-full max-w-sm">

        {/* Logo — large and prominent */}
        <div className="text-center mb-8">
          <Image src="/hispanusa-logo.png" alt="HispanUSA" width={300} height={100} style={{ height: 'auto' }} className="mx-auto mb-3" priority />
          <p className="text-sm font-medium text-[#03296A] mt-1">AIOS Dashboard</p>
        </div>

        <Suspense fallback={
          <div className="bg-[#03296A] rounded-xl shadow-[0_8px_32px_rgba(3,41,106,0.25)] p-8 text-center text-sm text-blue-200/60">
            Loading...
          </div>
        }>
          <LoginForm />
        </Suspense>

        {/* DHS Footer — visible on white background */}
        <div className="flex flex-col items-center mt-8">
          <Image src="/dhs-logo.png" alt="Dark Horse Systems" width={150} height={50} style={{ height: 'auto' }} />
          <p className="text-[11px] text-[#03296A]/50 font-medium mt-1">Powered by Dark Horse Systems</p>
        </div>
      </div>
    </div>
  );
}
