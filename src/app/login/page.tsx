'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

// Inner component isolates useSearchParams() so the outer page can be
// wrapped in Suspense, satisfying Next.js 14's static prerender requirement.
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
    <div className="bg-white rounded-xl shadow-2xl p-8">
      <h2 className="text-lg font-semibold text-[#1B3A5C] mb-1">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:border-transparent
                       placeholder:text-gray-400"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:border-transparent"
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
                     transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:ring-offset-2"
        >
          {loading ? 'Signing in…' : 'Sign in'}
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
          <h1 className="text-2xl font-bold text-white tracking-tight">
            HispanUSA
          </h1>
          <p className="text-sm text-blue-300/70 mt-1">AIOS Dashboard</p>
        </div>

        <Suspense fallback={
          <div className="bg-white rounded-xl shadow-2xl p-8 text-center text-sm text-gray-400">
            Loading…
          </div>
        }>
          <LoginForm />
        </Suspense>

        {/* Footer */}
        <p className="text-center text-xs text-blue-300/40 mt-6">
          Dark Horse Systems
        </p>
      </div>
    </div>
  );
}
