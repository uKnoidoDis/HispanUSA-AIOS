import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

// Use @supabase/ssr so session tokens are stored in cookies,
// allowing the middleware to read and validate them server-side.
//
// SESSION-COOKIE POLICY: the auth cookie must NOT survive a browser restart —
// staff must sign in again every time they open the browser (client feedback
// item #7). @supabase/ssr force-sets a ~400-day Max-Age on every cookie write
// (its setItem hardcodes maxAge back to the default AFTER merging cookieOptions,
// so the documented cookieOptions lever cannot produce a session cookie). The
// only reliable lever is a custom cookies adapter: we write document.cookie
// ourselves and OMIT Max-Age/Expires on sets, which makes the browser drop the
// cookie when it fully closes. Deletions (maxAge <= 0) must keep Max-Age or
// sign-out would stop working.
//
// ⚠️ Keep in sync with src/middleware.ts, which strips maxAge/expires the same
// way in its setAll — otherwise the middleware token refresh would silently
// re-persist a long-lived cookie and undo this policy.
export function createBrowserClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return document.cookie
            .split('; ')
            .filter(Boolean)
            .map(chunk => {
              const eq = chunk.indexOf('=');
              return {
                name: chunk.slice(0, eq),
                value: decodeURIComponent(chunk.slice(eq + 1)),
              };
            });
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookie = `${name}=${encodeURIComponent(value)}`;
            cookie += `; Path=${options?.path ?? '/'}`;
            cookie += `; SameSite=${options?.sameSite ?? 'Lax'}`;
            if (options?.domain) cookie += `; Domain=${options.domain}`;
            if (options?.secure) cookie += '; Secure';
            // Session cookie: omit Max-Age/Expires on sets; keep them only for
            // deletions (maxAge <= 0) so removals still take effect.
            if (typeof options?.maxAge === 'number' && options.maxAge <= 0) {
              cookie += `; Max-Age=${options.maxAge}`;
            }
            document.cookie = cookie;
          });
        },
      },
    }
  );
}
