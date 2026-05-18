import { cookies } from 'next/headers';
import { createServerClient as createSsrClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import PasswordCard from './PasswordCard';
import ProfileCard from './ProfileCard';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const cookieStore = cookies();
  const ssr = createSsrClient(
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

  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user || !user.email) {
    redirect('/login');
  }

  // Service-role read — bypasses RLS so we can read the row whether or not
  // the self-read policy is in place. The user identity is already proven
  // by getUser() above.
  const admin = createServerClient();
  const { data: profile } = await admin
    .from('staff_profiles')
    .select('email, display_name, phone_e164')
    .eq('id', user.id)
    .single();

  // Pre-fill the display name from auth metadata if no display_name is set
  // in staff_profiles yet. Supabase stores user-set names in user_metadata;
  // exact key varies by how the account was created (dashboard UI vs API),
  // so we check the common variants.
  const md = user.user_metadata ?? {};
  const authMetadataName =
    (typeof md.name === 'string' && md.name) ||
    (typeof md.full_name === 'string' && md.full_name) ||
    (typeof md.display_name === 'string' && md.display_name) ||
    '';
  const resolvedDisplayName = profile?.display_name || authMetadataName || '';

  return (
    <div
      className="px-4 sm:px-6 py-6 max-w-3xl w-full mx-auto"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your password and profile.
        </p>
      </header>

      <div className="space-y-6">
        <PasswordCard />
        <ProfileCard
          email={profile?.email ?? user.email}
          initialDisplayName={resolvedDisplayName}
          initialPhoneE164={profile?.phone_e164 ?? ''}
        />
      </div>
    </div>
  );
}
