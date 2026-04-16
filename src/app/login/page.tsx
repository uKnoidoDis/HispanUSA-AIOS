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
    <div className="bg-white rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.12)] p-8">
      <h2 className="text-lg font-bold text-[#0F2137] mb-1">
        Sign in
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Staff access only
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-[4px] text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/40 focus:border-[#1B3A5C]
                       placeholder:text-gray-400 transition-colors duration-150"
            placeholder="you@hispanusa.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-[4px] text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/40 focus:border-[#1B3A5C]
                       transition-colors duration-150"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-md text-sm font-semibold text-white
                     bg-[#1B3A5C] hover:bg-[#244B75] disabled:opacity-60 disabled:cursor-not-allowed
                     transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/40 focus:ring-offset-2
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
    <div className="min-h-screen bg-[#0F2137] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Image src="/hispanusa-logo.png" alt="HispanUSA" width={220} height={73} style={{ height: 'auto' }} className="mx-auto mb-2" />
          <p className="text-sm text-blue-300/70 mt-1">AIOS Dashboard</p>
        </div>

        <Suspense fallback={
          <div className="bg-white rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.12)] p-8 text-center text-sm text-gray-400">
            Loading...
          </div>
        }>
          <LoginForm />
        </Suspense>

        {/* DHS Footer */}
        <div className="flex items-center justify-center mt-6">
          <Image src="/dhs-logo.png" alt="Dark Horse Systems" width={100} height={33} style={{ height: 'auto', opacity: 0.3 }} />
        </div>
      </div>
    </div>
  );
}
