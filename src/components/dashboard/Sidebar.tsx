'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/dashboard',              label: 'Dashboard',    icon: '📊' },
  { href: '/dashboard/calendar',     label: 'Calendar',     icon: '📆' },
  { href: '/dashboard/appointments', label: 'Appointments', icon: '📋' },
  { href: '/dashboard/pending',      label: 'Pending',      icon: '⏳', showBadge: true },
  { href: '/dashboard/availability', label: 'Availability', icon: '🗓️' },
  { href: '/dashboard/clients',      label: 'Clients',      icon: '👥' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  // Poll pending count every 30 seconds
  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch('/api/appointments/pending');
        if (res.ok) {
          const data = await res.json();
          setPendingCount(data.count ?? 0);
        }
      } catch {
        // Non-critical — just don't show a badge
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-60 min-h-screen bg-[#0F2137] text-white flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <h1 className="text-lg font-bold text-white">HispanUSA</h1>
        <p className="text-xs text-blue-300/70 mt-0.5">AIOS Dashboard</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
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
                flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-[#1B3A5C] text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
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
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-gray-500">Dark Horse Systems</p>
      </div>
    </aside>
  );
}
