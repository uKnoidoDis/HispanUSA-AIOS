'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[#1B3A5C] hover:bg-[#244B75] text-white border-transparent shadow-sm',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-600 border-transparent',
  danger: 'bg-[#EF4444] hover:bg-red-600 text-white border-transparent shadow-sm',
};

export default function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium
        border rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/40 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
