/**
 * Password rules shared by the reset flow (auth) and the change-password screen (profile).
 *
 * The backend only enforces a minimum length (MobileLoginDto and UpdateUserDto: 6 characters). The
 * strength meter is advice on top of that: it never blocks a password the backend accepts.
 */
export const PASSWORD_MIN_LENGTH = 6;

/** The four steps of the E 1.6 meter, weakest first. */
export type PasswordStrengthLevel = 'weak' | 'fair' | 'strong' | 'veryStrong';

export interface PasswordStrength {
  level: PasswordStrengthLevel;
  /** Filled segments of the four-segment meter. */
  score: 1 | 2 | 3 | 4;
}

const LEVELS: readonly PasswordStrength[] = [
  { level: 'weak', score: 1 },
  { level: 'fair', score: 2 },
  { level: 'strong', score: 3 },
  { level: 'veryStrong', score: 4 },
];

/** Lowercase, uppercase, digits, and everything else (symbols, spaces). */
const CHARACTER_CLASSES: readonly RegExp[] = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z\d]/];
/** "aaaaaaaa" or "abababab" is weak however long it is. */
const MIN_DISTINCT_CHARACTERS = 4;
const LENGTH_STEPS: readonly number[] = [8, 12, 16];
const VARIETY_STEPS: readonly number[] = [2, 3];

/**
 * Scores a password for the meter. One point for each length step (8, 12, 16 characters) and each
 * variety step (2, 3 character classes): 0–1 points is weak, 2 fair, 3 strong, 4 or more very
 * strong. Anything shorter than the backend minimum, or made of fewer than 4 different characters,
 * is weak. Returns null for an empty password, so the meter can stay blank.
 */
export function getPasswordStrength(password: string): PasswordStrength | null {
  if (password.length === 0) return null;
  const weak = LEVELS[0] as PasswordStrength;
  if (password.length < PASSWORD_MIN_LENGTH || new Set(password).size < MIN_DISTINCT_CHARACTERS) {
    return weak;
  }
  const variety = CHARACTER_CLASSES.filter((pattern) => pattern.test(password)).length;
  const points =
    LENGTH_STEPS.filter((step) => password.length >= step).length +
    VARIETY_STEPS.filter((step) => variety >= step).length;
  return LEVELS[Math.min(Math.max(points - 1, 0), LEVELS.length - 1)] ?? weak;
}
