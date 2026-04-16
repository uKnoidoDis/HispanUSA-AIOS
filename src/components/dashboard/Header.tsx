'use client';

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
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div>
        {title && <h2 className="text-lg font-bold text-[#03296A]">{title}</h2>}
        <p className="text-sm text-gray-500 font-normal">{today}</p>
      </div>
    </header>
  );
}
