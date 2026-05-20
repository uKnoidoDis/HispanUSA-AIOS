'use client';

interface LanguageToggleProps {
  lang: 'en' | 'es';
  onToggle: (lang: 'en' | 'es') => void;
}

export default function LanguageToggle({ lang, onToggle }: LanguageToggleProps) {
  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      <button
        onClick={() => onToggle('en')}
        className={`px-2 py-1 rounded transition-colors ${
          lang === 'en'
            ? 'bg-[#03296A] text-white'
            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => onToggle('es')}
        className={`px-2 py-1 rounded transition-colors ${
          lang === 'es'
            ? 'bg-[#03296A] text-white'
            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
        }`}
      >
        ES
      </button>
    </div>
  );
}
