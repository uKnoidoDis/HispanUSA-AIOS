// SESSION-COOKIE POLICY (#7): the auth cookie must not survive a browser
// restart, so no writer may stamp Max-Age/Expires on a set. @supabase/ssr
// force-sets a ~400-day Max-Age on every write, so every setAll that persists
// cookies must strip it. Deletions (maxAge <= 0) keep their Max-Age or
// sign-out/chunk-cleanup would stop clearing cookies.
//
// Writers using this helper: auth/confirm route, login/reset action, settings
// password-change action, force-password-change action. The other two writers
// implement the same rule inline (different cookie APIs): the custom adapter in
// src/lib/supabase/client.ts and the middleware setAll in src/middleware.ts.
// A new auth-cookie writer MUST apply this helper (or the same rule).
export function sessionCookieOptions<
  T extends { maxAge?: number; expires?: Date },
>(options: T): T {
  const isDeletion = typeof options?.maxAge === 'number' && options.maxAge <= 0;
  return isDeletion ? options : { ...options, maxAge: undefined, expires: undefined };
}
