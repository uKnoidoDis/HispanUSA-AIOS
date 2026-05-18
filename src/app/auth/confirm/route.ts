import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  const resetUrl = (params?: { error?: string; verified?: boolean }) => {
    const url = new URL('/login/reset', request.nextUrl.origin);
    if (params?.error) url.searchParams.set('error', params.error);
    if (params?.verified) url.searchParams.set('verified', '1');
    return url;
  };

  if (!tokenHash || !type) {
    return NextResponse.redirect(resetUrl({ error: 'missing' }));
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    console.error('[auth/confirm] verifyOtp failed', error);
    return NextResponse.redirect(resetUrl({ error: 'invalid' }));
  }

  return NextResponse.redirect(resetUrl({ verified: true }));
}
