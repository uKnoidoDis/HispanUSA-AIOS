'use client';

import { useState, ReactNode } from 'react';
import Image from 'next/image';
import LanguageToggle from './LanguageToggle';

interface LegalPageLayoutProps {
  englishContent: ReactNode;
  spanishContent: ReactNode;
}

export default function LegalPageLayout({
  englishContent,
  spanishContent,
}: LegalPageLayoutProps) {
  const [lang, setLang] = useState<'en' | 'es'>('en');

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <Image
            src="/hispanusa-logo.png"
            alt="HispanUSA Accounting & Tax Services"
            width={200}
            height={64}
            className="h-14 w-auto"
            priority
          />
          <LanguageToggle lang={lang} onToggle={setLang} />
        </div>

        <article className="text-gray-800 leading-relaxed">
          {lang === 'en' ? englishContent : spanishContent}
        </article>

        <hr className="mt-16 mb-8 border-gray-300" />

        <footer className="text-sm text-gray-500 space-y-1">
          <p className="font-semibold text-gray-600">HISPANUSA LLC</p>
          <p>8050 North University Drive, Suite #206, Tamarac, FL 33321</p>
          <p>
            {lang === 'en' ? 'Phone' : 'Teléfono'}:{' '}
            <a href="tel:9549340194" className="underline hover:text-[#03296A]">
              954-934-0194
            </a>
          </p>
          <p>
            {lang === 'en' ? 'Email' : 'Correo electrónico'}:{' '}
            <a
              href="mailto:info@hispanusa.com"
              className="underline hover:text-[#03296A]"
            >
              info@hispanusa.com
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
