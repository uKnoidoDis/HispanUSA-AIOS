'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const DISMISSED_KEY = 'hispanusa_sms_banner_dismissed';

export default function SmsBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if not previously dismissed
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
      <p className="flex-1 text-sm text-amber-800 font-medium">
        ⚠ SMS is currently disabled. A2P 10DLC registration pending — messages will send via email only until approved.
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="p-1 rounded text-amber-500 hover:text-amber-700 hover:bg-amber-100 transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
