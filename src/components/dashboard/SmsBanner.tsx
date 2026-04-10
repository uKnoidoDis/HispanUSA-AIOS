'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const DISMISSED_KEY = 'hispanusa_sms_banner_dismissed';

export default function SmsBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="bg-amber-50/80 border-b border-amber-200/60 px-4 py-1.5 flex items-center gap-2.5 flex-shrink-0">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
      <p className="flex-1 text-xs text-amber-700 font-medium">
        SMS pending A2P registration — messages send via email only until approved.
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="p-0.5 rounded text-amber-400 hover:text-amber-600 hover:bg-amber-100 transition-colors duration-150 flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
