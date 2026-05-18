'use server';

import { cookies, headers } from 'next/headers';
import { createServerClient as createSsrClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { sendPasswordChangeConfirmation } from '@/lib/password-confirmation-email';
import { validatePassword } from '@/components/auth/password-rules';

interface ActionResult {
  success: false;
  error: string;
}

export async function changeForcedPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult | void> {
  const { currentPassword, newPassword } = input;

  const validationError = validatePassword(newPassword, currentPassword);
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
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user || !user.email) {
    return { success: false, error: 'Your session has expired. Please sign in again.' };
  }

  // Verify the current password by attempting a sign-in. This is the
  // supported way to verify a password through supabase-js. On success,
  // the SSR cookie handler refreshes session cookies in place.
  const { error: signInError } = await ssr.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) {
    return { success: false, error: 'Current password is incorrect.' };
  }

  // Clear the must_change_password gate BEFORE changing the auth password.
  // If this fails, the auth password is still the old one and the user can
  // retry cleanly. Reversing this order would risk stranding the user with
  // a new password they can't get past the gate with.
  const admin = createServerClient();

  const { error: profileError } = await admin
    .from('staff_profiles')
    .update({ must_change_password: false })
    .eq('id', user.id);
  if (profileError) {
    console.error('[force-password-change] staff_profiles flag-clear failed', profileError);
    return {
      success: false,
      error: 'Something went wrong. Please try again.',
    };
  }

  // Now update the password via the user's own session. If this fails after
  // the flag was cleared, the user can log in with their OLD password and
  // change it from the regular Settings page — they are no longer stranded.
  const { error: updateError } = await ssr.auth.updateUser({ password: newPassword });
  if (updateError) {
    console.error('[force-password-change] auth updateUser failed after flag cleared', updateError);
    return {
      success: false,
      error: 'Password update failed. Please log out and back in, then try again from Settings.',
    };
  }

  const headersList = headers();
  const ipAddress =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    null;
  const userAgent = headersList.get('user-agent') ?? null;

  const { error: eventError } = await admin.from('password_events').insert({
    user_id: user.id,
    event_type: 'self_change',
    actor_id: user.id,
    ip_address: ipAddress,
    user_agent: userAgent,
  });
  if (eventError) {
    console.error('[force-password-change] password_events insert failed', eventError);
    // Do not fail the request — the password change itself succeeded.
  }

  // Fire confirmation email. Don't fail the request if email fails — the
  // password change is already complete and blocking the user out would
  // be worse than a missing confirmation email.
  try {
    await sendPasswordChangeConfirmation({ to: user.email });
  } catch (err) {
    console.error('[force-password-change] confirmation email failed', err);
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
