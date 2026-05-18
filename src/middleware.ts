import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// Public API paths that do NOT require authentication.
// All other /api/* routes matched by the config below are staff-only.
const PUBLIC_API_PATHS = new Set([
  '/api/appointments/book',
  '/api/appointments/available-dates',
  '/api/appointments/available-times',
]);

// The cron endpoint is secured by CRON_SECRET in its own route handler.
const CRON_PATH = '/api/cron/reminders';

// The forced-password-change page is the only dashboard route reachable
// when staff_profiles.must_change_password = true for the current user.
const FORCE_CHANGE_PATH = '/dashboard/settings/force-password-change';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow the cron endpoint through — it verifies CRON_SECRET internally.
  if (pathname === CRON_PATH) {
    return NextResponse.next();
  }

  // Allow explicitly public API paths through.
  if (PUBLIC_API_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // Determine what kind of protection this route needs.
  const isDashboard = pathname.startsWith('/dashboard');
  const isStaffApi =
    pathname.startsWith('/api/appointments') ||
    pathname.startsWith('/api/availability') ||
    pathname.startsWith('/api/clients') ||
    pathname.startsWith('/api/preparers');

  // Route needs no protection — pass through.
  if (!isDashboard && !isStaffApi) {
    return NextResponse.next();
  }

  // Build the response early so we can attach refreshed cookies to it.
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Create an SSR-aware Supabase client that reads/writes session cookies.
  // Uses the ANON key + the user's session JWT — NOT the service role.
  // RLS therefore applies; the staff_profiles_self_read policy is what lets
  // the user read their own row below.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies onto the request (for downstream server components).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Rebuild response so we can attach the refreshed cookies.
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() validates the JWT and refreshes the session token if needed.
  // Using getUser() (not getSession()) to avoid trusting a stale local token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isDashboard) {
      // Redirect unauthenticated users to login, preserving their destination.
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isStaffApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return response;
  }

  // Authenticated. Check whether this user is required to change their
  // password before they can use anything else. The self-read RLS policy
  // on staff_profiles lets the user fetch their own row via the anon key.
  const { data: profile, error: profileError } = await supabase
    .from('staff_profiles')
    .select('must_change_password')
    .eq('id', user.id)
    .single();

  // Fail-safe: if the lookup errors OR no profile row exists (shouldn't happen
  // after migration 004, but defensive against newly created auth users or a
  // transient DB hiccup), treat as if a change is required. The force-change
  // page itself fetches the same flag server-side and will surface a real
  // error to the user if the profile genuinely doesn't exist.
  if (profileError) {
    console.error('[middleware] staff_profiles lookup failed for user', user.id, profileError);
  }
  const mustChange = profileError ? true : (profile?.must_change_password ?? true);

  if (mustChange) {
    if (isDashboard && pathname !== FORCE_CHANGE_PATH) {
      return NextResponse.redirect(new URL(FORCE_CHANGE_PATH, request.url));
    }

    if (isStaffApi) {
      return NextResponse.json(
        { error: 'Password change required' },
        { status: 403 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Dashboard pages
    '/dashboard/:path*',
    // Staff API routes (public sub-paths handled above via PUBLIC_API_PATHS)
    '/api/appointments/:path*',
    '/api/availability/:path*',
    '/api/clients/:path*',
    '/api/preparers/:path*',
    // Cron (passed through immediately above)
    '/api/cron/:path*',
  ],
};
