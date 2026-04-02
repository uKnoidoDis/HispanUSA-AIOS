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
