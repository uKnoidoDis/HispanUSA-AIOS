// Shared password validation logic for force-password-change and Settings.
// Both client and server import from here so the rules are defined once.

export interface PasswordRule {
  key: string;
  label: string;
  test: (newPw: string, currentPw: string, confirmPw: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    key: 'length',
    label: 'At least 8 characters',
    test: (n) => n.length >= 8,
  },
  {
    key: 'number',
    label: 'Contains a number',
    test: (n) => /\d/.test(n),
  },
  {
    key: 'uppercase',
    label: 'Contains an uppercase letter',
    test: (n) => /[A-Z]/.test(n),
  },
  {
    key: 'different',
    label: 'Different from your current password',
    test: (n, c) => n.length > 0 && c.length > 0 && n !== c,
  },
  {
    key: 'match',
    label: 'New password and confirmation match',
    test: (n, _c, cf) => n.length > 0 && n === cf,
  },
];

export function allRulesPass(newPw: string, currentPw: string, confirmPw: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(newPw, currentPw, confirmPw));
}

// Same as allRulesPass but skips rules whose key appears in excludeKeys.
// Used by the reset flow which has no "current password" concept.
export function allRulesPassExcept(
  newPw: string,
  currentPw: string,
  confirmPw: string,
  excludeKeys: string[]
): boolean {
  return PASSWORD_RULES
    .filter((r) => !excludeKeys.includes(r.key))
    .every((r) => r.test(newPw, currentPw, confirmPw));
}

// Server-side validator. Returns the first failure message or null.
// Does NOT check the confirm field — the server never sees it; the client
// guarantees match before submit.
export function validatePassword(
  newPw: string,
  currentPw: string,
  opts: { skipDifferent?: boolean } = {}
): string | null {
  if (newPw.length < 8) return 'New password must be at least 8 characters.';
  if (!/\d/.test(newPw)) return 'New password must contain a number.';
  if (!/[A-Z]/.test(newPw)) return 'New password must contain an uppercase letter.';
  if (!opts.skipDifferent && newPw === currentPw) {
    return 'New password must be different from your current password.';
  }
  return null;
}
