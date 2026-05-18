import { randomInt } from 'node:crypto';

// Unambiguous character sets — excludes 0/O/o and 1/l/I so the temp
// password can be read aloud or copied by hand without confusion.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const ALL = UPPER + LOWER + DIGITS;

const LENGTH = 12;

function pick(set: string): string {
  return set[randomInt(set.length)];
}

// Generates a 12-character temp password guaranteed to contain at least one
// uppercase letter, one lowercase letter, and one digit — so it always
// satisfies the dashboard password rules (length / number / uppercase).
export function generateTempPassword(): string {
  const chars: string[] = [pick(UPPER), pick(LOWER), pick(DIGITS)];
  while (chars.length < LENGTH) {
    chars.push(pick(ALL));
  }
  // Fisher-Yates shuffle so the guaranteed characters aren't always first.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
