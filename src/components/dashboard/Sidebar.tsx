'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Clock,
  Users,
  LogOut,
  Hourglass,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',              label: 'Overview',      icon: LayoutDashboard },
  { href: '/dashboard/calendar',     label: 'Calendar',      icon: Calendar },
  { href: '/dashboard/appointments', label: 'Appointments',  icon: ClipboardList },
  { href: '/dashboard/pending',      label: 'Pending',       icon: Hourglass, showBadge: true },
  { href: '/dashboard/availability', label: 'Availability',  icon: Clock },
  { href: '/dashboard/clients',      label: 'Clients',       icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.name) {
        setUserName(user.user_metadata.name);
      } else if (user?.email) {
        const prefix = user.email.split('@')[0];
        setUserName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
      }
    });
  }, []);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch('/api/appointments/pending');
        if (res.ok) {
          const data = await res.json();
          setPendingCount(data.count ?? 0);
        }
      } catch {
        // Non-critical
      }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    if (mobileOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [mobileOpen]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }, [router]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Image src="/hispanusa-logo.png" alt="HispanUSA" width={140} height={47} style={{ height: 'auto' }} />
        <p className="text-[11px] text-blue-300/60 mt-1.5">AIOS Dashboard</p>
      </div>

      {/* User welcome */}
      {userName && (
        <div className="px-6 py-3 border-b border-white/10">
          <p className="text-xs text-gray-400">{greeting},</p>
          <p className="text-sm font-semibold text-white truncate">{userName}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          const count = item.showBadge ? (pendingCount ?? 0) : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-white/10 text-white border-l-[3px] border-l-[#D4932A] ml-0 pl-[9px]'
                  : 'text-gray-400 hover:bg-white/[0.07] hover:text-gray-200 border-l-[3px] border-l-transparent ml-0 pl-[9px]'
                }
              `}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="flex-1">{item.label}</span>
              {item.showBadge && count > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#D4932A] text-white text-xs font-bold leading-none">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10 space-y-3">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium
                     text-gray-400 hover:bg-white/[0.07] hover:text-gray-200 transition-all duration-150
                     disabled:opacity-50 disabled:cursor-not-allowed text-left"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.8} />
          <span>{loggingOut ? 'Signing out...' : 'Sign out'}</span>
        </button>

        {/* DHS branding */}
        <div className="px-3 pt-1">
          <Image src="/dhs-logo.png" alt="Dark Horse Systems" width={110} height={37} style={{ height: 'auto', opacity: 0.7 }} />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-40 lg:hidden p-2 rounded-lg bg-[#0F2137] text-white shadow-lg hover:bg-[#1B3A5C] transition-colors duration-150"
        aria-label="Open navigation"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[#0F2137] text-white flex flex-col
          transform transition-transform duration-200 ease-in-out lg:hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors duration-150"
          aria-label="Close navigation"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 min-h-screen bg-[#0F2137] text-white flex-col flex-shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}
