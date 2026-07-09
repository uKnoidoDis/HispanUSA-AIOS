'use server';

import { cookies, headers } from 'next/headers';
import { createServerClient as createSsrClient } from '@supabase/ssr';
import { sessionCookieOptions } from '@/lib/supabase/session-cookie-options';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { sendPasswordChangeConfirmation } from '@/lib/password-confirmation-email';
import { validatePassword } from '@/components/auth/password-rules';

interface ActionResult {
  success: false;
  error: string;
}

export async function completeResetPassword(input: {
  newPassword: string;
}): Promise<ActionResult | void> {
  // Reset flow has no "current" password — skip the "different from current"
  // rule. The other three rules (length / number / uppercase) still apply.
  const validationError = validatePassword(input.newPassword, '', {
    skipDifferent: true,
  });
  if (validationError) {
    return { success: false, error: validationError };
  }

  const cookieStore = cookies();
  const ssr = createSsrClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, sessionCookieOptions(options));
          });
        },
      },
    }
  );

  // The recovery session was established client-side (exchangeCodeForSession
  // or hash auto-detect) and propagated via cookies. getUser() must succeed
  // here or the reset link has expired between page load and submit.
  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user || !user.email) {
    return {
      success: false,
      error:
        'Your reset session has expired. Request a new reset link to continue.',
    };
  }

  // Update the password via the recovery session.
  const { error: updateError } = await ssr.auth.updateUser({
    password: input.newPassword,
  });
  if (updateError) {
    console.error('[reset] auth updateUser failed', updateError);
    return {
      success: false,
      error: updateError.message || 'Could not update password. Please try again.',
    };
  }

  // Per spec: do NOT touch staff_profiles.must_change_password. The flag
  // exists only for the temp-password lockout case and a normal reset
  // does not satisfy it.

  // Log the event.
  const admin = createServerClient();
  const headersList = headers();
  const ipAddress =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    null;
  const userAgent = headersList.get('user-agent') ?? null;

  const { error: eventError } = await admin.from('password_events').insert({
    user_id: user.id,
    event_type: 'reset_completed',
    actor_id: user.id,
    ip_address: ipAddress,
    user_agent: userAgent,
  });
  if (eventError) {
    console.error('[reset] password_events insert failed', eventError);
  }

  // Confirmation email. Failure is non-fatal — log it and proceed.
  try {
    await sendPasswordChangeConfirmation({ to: user.email });
  } catch (err) {
    console.error('[reset] confirmation email failed', err);
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
