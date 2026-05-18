'use server';

import { cookies } from 'next/headers';
import { createServerClient as createSsrClient } from '@supabase/ssr';
import { createServerClient } from '@/lib/supabase/server';

// Records the current user's last_login_at. Called by the login page right
// after a successful sign-in, before the redirect to /dashboard.
// Best-effort: failures are logged and swallowed, never thrown — a login that
// succeeds in auth must never be blocked by this observability write.
export async function recordLogin(): Promise<void> {
  try {
    const cookieStore = cookies();
    const ssr = createSsrClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await ssr.auth.getUser();
    if (!user) {
      console.error('[login] recordLogin: no authenticated user found');
      return;
    }

    const admin = createServerClient();
    const { error } = await admin
      .from('staff_profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) {
      console.error('[login] recordLogin: last_login_at update failed', error);
    }
  } catch (err) {
    console.error('[login] recordLogin: unexpected error', err);
  }
}
