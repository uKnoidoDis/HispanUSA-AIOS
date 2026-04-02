import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

// Use @supabase/ssr so session tokens are stored in cookies,
// allowing the middleware to read and validate them server-side.
export function createBrowserClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
