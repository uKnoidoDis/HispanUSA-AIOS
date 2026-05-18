import { cookies } from 'next/headers';
import { createServerClient as createSsrClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { createServerClient } from '@/lib/supabase/server';
import ForcePasswordChangeForm from './ForcePasswordChangeForm';

// Always render this page server-side per request — the must_change_password
// flag must reflect the current DB state, never a cached value.
export const dynamic = 'force-dynamic';

export default async function ForcePasswordChangePage() {
  const cookieStore = cookies();
  const ssr = createSsrClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // Page components cannot write cookies; the middleware already
        // refreshed them on the way in.
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Defense in depth: if the user landed here but the gate is already
  // cleared (e.g. they hit refresh after success), bounce to the dashboard.
  const admin = createServerClient();
  const { data: profile } = await admin
    .from('staff_profiles')
    .select('must_change_password')
    .eq('id', user.id)
    .single();

  if (profile && !profile.must_change_password) {
    redirect('/dashboard');
  }

  return (
    // Fixed overlay so the dashboard sidebar (rendered by the parent layout)
    // is fully covered and unreachable until the password change completes.
    <div
      className="fixed inset-0 z-50 min-h-screen overflow-y-auto bg-white flex items-center justify-center px-4 py-10"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/hispanusa-logo.png"
            alt="HispanUSA"
            width={440}
            height={147}
            style={{ height: 'auto' }}
            className="mx-auto mb-3"
            priority
          />
          <p className="text-sm font-medium text-[#03296A] mt-1">AIOS Dashboard</p>
        </div>

        <div className="bg-[#03296A] rounded-xl shadow-[0_8px_32px_rgba(3,41,106,0.25)] p-8">
          <h1 className="text-lg font-bold text-white mb-1">Set your password</h1>
          <p className="text-sm text-blue-100 mb-6">
            Before you can use the dashboard, please replace the temporary
            password you were given with one only you know.
          </p>
          <ForcePasswordChangeForm />
        </div>

        <div className="flex flex-col items-center mt-8">
          <Image
            src="/dhs-logo-dark.png"
            alt="Dark Horse Systems"
            width={150}
            height={50}
            style={{ height: 'auto' }}
          />
          <p className="text-[11px] text-[#111827] font-medium mt-1">
            Powered by Dark Horse Systems
          </p>
        </div>
      </div>
    </div>
  );
}
