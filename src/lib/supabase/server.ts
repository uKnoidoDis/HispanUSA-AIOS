import { createClient } from '@supabase/supabase-js';

export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      // Force every server-side query to read live data. supabase-js calls
      // PostgREST via fetch(), and Next.js's App Router Data Cache will cache
      // that fetch (keyed on the Supabase URL, not our route) and replay stale
      // rows — the pending queue kept returning deleted/edited appointments
      // even with `force-dynamic` and a no-store response header, because those
      // govern the route/HTTP layer, not the inner fetch. cache: 'no-store'
      // opts every read out of the Data Cache. This client is service-role and
      // only ever reads/writes live admin data, so caching is never desirable.
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  });
}
