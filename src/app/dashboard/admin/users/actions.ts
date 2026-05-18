'use server';

import { cookies, headers } from 'next/headers';
import { createServerClient as createSsrClient } from '@supabase/ssr';
import { createServerClient } from '@/lib/supabase/server';
import { generateTempPassword } from './generatePassword';

interface ResetSuccess {
  success: true;
  tempPassword: string;
}
interface RoleSuccess {
  success: true;
}
interface Failure {
  success: false;
  error: string;
}

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
        setAll() {},
      },
    }
  );
}

// Resolves the calling user and their role from staff_profiles.
// Returns null when unauthenticated or when no profile row exists.
async function getViewer(): Promise<{ id: string; role: string } | null> {
  const ssr = makeSsrClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user) return null;

  const admin = createServerClient();
  const { data: profile } = await admin
    .from('staff_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile) return null;
  return { id: user.id, role: profile.role };
}

export async function forcePasswordReset(
  targetUserId: string
): Promise<ResetSuccess | Failure> {
  const viewer = await getViewer();
  if (!viewer) {
    return { success: false, error: 'Not authorized' };
  }
  // Authorize: owner or admin only.
  if (viewer.role !== 'owner' && viewer.role !== 'admin') {
    return { success: false, error: 'Not authorized' };
  }
  if (targetUserId === viewer.id) {
    return {
      success: false,
      error: 'You cannot force a reset on your own account.',
    };
  }

  const admin = createServerClient();

  // Confirm the target still exists and read its role for the rule below.
  const { data: target } = await admin
    .from('staff_profiles')
    .select('id, role')
    .eq('id', targetUserId)
    .single();
  if (!target) {
    return { success: false, error: 'That staff member no longer exists.' };
  }

  // An admin cannot force-reset the owner's password — only the owner can.
  if (viewer.role === 'admin' && target.role === 'owner') {
    return {
      success: false,
      error: 'Only the owner can reset their own password.',
    };
  }

  const tempPassword = generateTempPassword();

  const { error: authError } = await admin.auth.admin.updateUserById(
    targetUserId,
    { password: tempPassword }
  );
  if (authError) {
    console.error('[admin/users] updateUserById failed', authError);
    return {
      success: false,
      error: 'Could not reset the password. Please try again.',
    };
  }

  const { error: flagError } = await admin
    .from('staff_profiles')
    .update({ must_change_password: true })
    .eq('id', targetUserId);
  if (flagError) {
    console.error('[admin/users] must_change_password flag set failed', flagError);
    return {
      success: false,
      error:
        'Password was reset but the change-on-login flag did not set. Contact support.',
    };
  }

  const headersList = headers();
  const ipAddress =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    null;
  const userAgent = headersList.get('user-agent') ?? null;

  const { error: eventError } = await admin.from('password_events').insert({
    user_id: targetUserId,
    event_type: 'admin_force',
    actor_id: viewer.id,
    ip_address: ipAddress,
    user_agent: userAgent,
  });
  if (eventError) {
    console.error('[admin/users] password_events insert failed', eventError);
    // Non-fatal — the reset itself succeeded.
  }

  return { success: true, tempPassword };
}

export async function changeUserRole(
  targetUserId: string,
  newRole: string
): Promise<RoleSuccess | Failure> {
  const viewer = await getViewer();
  if (!viewer) {
    return { success: false, error: 'Not authorized' };
  }
  // Authorize: owner only.
  if (viewer.role !== 'owner') {
    return { success: false, error: 'Not authorized' };
  }
  if (targetUserId === viewer.id) {
    return { success: false, error: 'You cannot change your own role.' };
  }
  if (newRole !== 'staff' && newRole !== 'admin') {
    return { success: false, error: 'Invalid role.' };
  }

  const admin = createServerClient();

  const { data: target } = await admin
    .from('staff_profiles')
    .select('role')
    .eq('id', targetUserId)
    .single();
  if (!target) {
    return { success: false, error: 'That staff member no longer exists.' };
  }
  // The single owner cannot be demoted through this UI.
  if (target.role === 'owner') {
    return { success: false, error: 'The owner role cannot be changed.' };
  }

  const { error: updateError } = await admin
    .from('staff_profiles')
    .update({ role: newRole })
    .eq('id', targetUserId);
  if (updateError) {
    console.error('[admin/users] role update failed', updateError);
    return {
      success: false,
      error: 'Could not update the role. Please try again.',
    };
  }

  return { success: true };
}
