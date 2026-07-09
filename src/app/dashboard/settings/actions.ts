'use server';

import { cookies, headers } from 'next/headers';
import { createServerClient as createSsrClient } from '@supabase/ssr';
import { sessionCookieOptions } from '@/lib/supabase/session-cookie-options';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { sendPasswordChangeConfirmation } from '@/lib/password-confirmation-email';
import { validatePassword } from '@/components/auth/password-rules';
import { normalizePhone } from '@/lib/utils';

interface SuccessResult {
  success: true;
}
interface FailureResult {
  success: false;
  error: string;
}
type ActionResult = SuccessResult | FailureResult;

const DISPLAY_NAME_RE = /^[A-Za-zÀ-ÿ '\-]+$/;

function makeSsrClient() {
  const cookieStore = cookies();
  return createSsrClient(
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
}

export async function changeOwnPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult> {
  const validationError = validatePassword(input.newPassword, input.currentPassword);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const ssr = makeSsrClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user || !user.email) {
    return { success: false, error: 'Your session has expired. Please sign in again.' };
  }

  // Verify the current password.
  const { error: signInError } = await ssr.auth.signInWithPassword({
    email: user.email,
    password: input.currentPassword,
  });
  if (signInError) {
    return { success: false, error: 'Current password is incorrect.' };
  }

  // Update the password.
  const { error: updateError } = await ssr.auth.updateUser({
    password: input.newPassword,
  });
  if (updateError) {
    return {
      success: false,
      error: updateError.message || 'Could not update password. Please try again.',
    };
  }

  // Log the event with service-role privileges.
  const admin = createServerClient();
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
    console.error('[settings.changeOwnPassword] password_events insert failed', eventError);
  }

  // Confirmation email — log on failure but do not surface to the user; the
  // password change already succeeded.
  try {
    await sendPasswordChangeConfirmation({ to: user.email });
  } catch (err) {
    console.error('[settings.changeOwnPassword] confirmation email failed', err);
  }

  return { success: true };
}

export async function updateOwnProfile(input: {
  displayName: string;
  phone: string;
}): Promise<ActionResult> {
  const trimmedName = input.displayName.trim();
  if (trimmedName.length > 0) {
    if (
      trimmedName.length < 2 ||
      trimmedName.length > 60 ||
      !DISPLAY_NAME_RE.test(trimmedName)
    ) {
      return {
        success: false,
        error:
          'Display name must be 2–60 characters: letters, spaces, hyphens, apostrophes only.',
      };
    }
  }

  // Phone validation. normalizePhone() is too permissive on its own (it
  // prepends "+" to whatever digits it gets), so digit-count is checked here.
  const rawPhone = input.phone.trim();
  let normalizedPhone: string | null = null;
  if (rawPhone.length > 0) {
    const digits = rawPhone.replace(/\D/g, '');
    const validUs =
      digits.length === 10 || (digits.length === 11 && digits[0] === '1');
    if (!validUs) {
      return { success: false, error: 'Enter a 10-digit US phone number.' };
    }
    normalizedPhone = normalizePhone(rawPhone);
  }

  const ssr = makeSsrClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user) {
    return { success: false, error: 'Your session has expired. Please sign in again.' };
  }

  // Service-role update so we can write display_name and phone_e164 without
  // depending on the staff_profiles_self_update RLS policy. Application-layer
  // safety: we only ever update where id = the authenticated user.id.
  const admin = createServerClient();
  const { error: updateError } = await admin
    .from('staff_profiles')
    .update({
      display_name: trimmedName.length > 0 ? trimmedName : null,
      phone_e164: normalizedPhone,
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('[settings.updateOwnProfile] update failed', updateError);
    return { success: false, error: 'Could not save profile. Please try again.' };
  }

  revalidatePath('/dashboard/settings');
  return { success: true };
}
