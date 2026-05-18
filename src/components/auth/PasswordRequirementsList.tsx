'use client';

import { Check, X } from 'lucide-react';
import { PASSWORD_RULES } from './password-rules';

interface Props {
  newPassword: string;
  currentPassword: string;
  confirmPassword: string;
  variant: 'dark' | 'light';
  excludeKeys?: string[];
}

export default function PasswordRequirementsList({
  newPassword,
  currentPassword,
  confirmPassword,
  variant,
  excludeKeys = [],
}: Props) {
  const theme =
    variant === 'dark'
      ? {
          container: 'bg-white/10',
          pass: 'text-emerald-100',
          passIcon: 'text-emerald-300',
          fail: 'text-blue-100',
          failIcon: 'text-red-300',
        }
      : {
          container: 'bg-gray-50 border border-gray-200',
          pass: 'text-emerald-700',
          passIcon: 'text-emerald-500',
          fail: 'text-gray-600',
          failIcon: 'text-red-500',
        };

  return (
    <ul
      className={`space-y-1.5 rounded-md p-3 ${theme.container}`}
      aria-label="Password requirements"
    >
      {PASSWORD_RULES.filter((rule) => !excludeKeys.includes(rule.key)).map((rule) => {
        const passed = rule.test(newPassword, currentPassword, confirmPassword);
        return (
          <li key={rule.key} className="flex items-center gap-2 text-xs">
            {passed ? (
              <Check
                className={`w-4 h-4 shrink-0 ${theme.passIcon}`}
                aria-hidden="true"
              />
            ) : (
              <X
                className={`w-4 h-4 shrink-0 ${theme.failIcon}`}
                aria-hidden="true"
              />
            )}
            <span className={passed ? theme.pass : theme.fail}>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
