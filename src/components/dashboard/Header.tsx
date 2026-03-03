'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
        <p className="text-sm text-gray-500">{today}</p>
      </div>
      <Link href="/dashboard/appointments/new">
        <Button variant="primary">+ Add Appointment</Button>
      </Link>
    </header>
  );
}
