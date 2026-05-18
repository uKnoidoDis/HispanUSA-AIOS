'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  variant?: 'dark' | 'light';
  required?: boolean;
}

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  variant = 'light',
  required = true,
}: Props) {
  const [show, setShow] = useState(false);

  const theme =
    variant === 'dark'
      ? {
          label: 'text-white',
          input:
            'border-gray-200 bg-white text-gray-900 focus:ring-white/40 focus:border-white',
          toggle: 'text-gray-500 hover:text-gray-700 focus:ring-white/40',
        }
      : {
          label: 'text-gray-700',
          input:
            'border-gray-300 bg-white text-gray-900 focus:ring-[#03296A]/40 focus:border-[#03296A]',
          toggle: 'text-gray-500 hover:text-gray-700 focus:ring-[#03296A]/40',
        };

  return (
    <div>
      <label htmlFor={id} className={`block text-sm font-medium mb-1 ${theme.label}`}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2.5 pr-10 border rounded-md text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors duration-150 ${theme.input}`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className={`absolute inset-y-0 right-0 px-3 flex items-center rounded-r-md focus:outline-none focus:ring-2 ${theme.toggle}`}
          aria-label={show ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {show ? (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
