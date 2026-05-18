import { cookies } from 'next/headers';
import { createServerClient as createSsrClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ShieldCheck } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import { Table } from '@/components/ui/Table';
import UserRow from './UserRow';

export const dynamic = 'force-dynamic';

const ROLE_ORDER: Record<string, number> = { owner: 0, admin: 1, staff: 2 };

interface StaffProfile {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  must_change_password: boolean;
  last_login_at: string | null;
}

export default async function AdminUsersPage() {
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
  if (!user) {
    redirect('/login');
  }

  const admin = createServerClient();

  // Access control — owner or admin only. Middleware does not check role,
  // so the gate lives here.
  const { data: viewerProfile } = await admin
    .from('staff_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const viewerRole = viewerProfile?.role ?? 'staff';
  if (viewerRole !== 'owner' && viewerRole !== 'admin') {
    redirect('/dashboard');
  }

  const { data: rows } = await admin
    .from('staff_profiles')
    .select(
      'id, email, display_name, role, must_change_password, last_login_at'
    );

  const profiles: StaffProfile[] = (rows ?? []) as StaffProfile[];

  // Sort by role priority (owner, admin, staff), then alphabetically by
  // display name (falling back to email) within each role.
  profiles.sort((a, b) => {
    const roleDiff = (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99);
    if (roleDiff !== 0) return roleDiff;
    const an = (a.display_name || a.email).toLowerCase();
    const bn = (b.display_name || b.email).toLowerCase();
    return an.localeCompare(bn);
  });

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#03296A] flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#03296A]">User Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage staff accounts, passwords, and roles.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <Table
              headers={[
                'Display name',
                'Email',
                'Role',
                'Last login',
                'Must change password',
                'Actions',
              ]}
            >
              {profiles.map((p) => (
                <UserRow
                  key={p.id}
                  user={{
                    id: p.id,
                    email: p.email,
                    displayName: p.display_name,
                    role: p.role,
                    mustChangePassword: p.must_change_password,
                    lastLoginLabel: p.last_login_at
                      ? formatDistanceToNow(parseISO(p.last_login_at), {
                          addSuffix: true,
                        })
                      : 'Never',
                  }}
                  viewerId={user.id}
                  viewerRole={viewerRole}
                />
              ))}
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}
