'use client';

import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

// Each individual toast manages its own auto-dismiss timer
function ToastNotification({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const styles: Record<ToastType, { border: string; icon: string; bg: string }> = {
    success: {
      border: 'border-l-green-500',
      bg: 'bg-white',
      icon: 'text-green-500',
    },
    error: {
      border: 'border-l-red-500',
      bg: 'bg-white',
      icon: 'text-red-500',
    },
    info: {
      border: 'border-l-[#1B3A5C]',
      bg: 'bg-white',
      icon: 'text-[#1B3A5C]',
    },
  };

  const s = styles[toast.type];

  return (
    <div
      className={`
        flex items-start gap-3 ${s.bg} rounded-lg shadow-lg
        border border-gray-200 border-l-4 ${s.border}
        px-4 py-3 min-w-[280px] max-w-sm pointer-events-auto
      `}
      role="alert"
    >
      {/* Icon */}
      <span className={`mt-0.5 flex-shrink-0 ${s.icon}`}>
        {toast.type === 'success' && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {toast.type === 'error' && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {toast.type === 'info' && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </span>

      {/* Message */}
      <p className="flex-1 text-sm font-medium text-gray-800 leading-snug">
        {toast.message}
      </p>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
        aria-label="Dismiss"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Container rendered at the bottom-right of the viewport
export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastNotification key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
