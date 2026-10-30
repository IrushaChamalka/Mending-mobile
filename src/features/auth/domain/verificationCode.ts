/** Password-reset codes are six digits (E 1.5). */
export const VERIFICATION_CODE_LENGTH = 6;

/** Used when the code request does not say when the next code may be sent. */
export const DEFAULT_RESEND_AFTER_SECONDS = 60;

const NON_DIGITS = /\D/g;
const DIGITS_ONLY = /^\d+$/;

/** Keeps only the digits of what was typed, pasted or autofilled, up to the code length. */
export function toVerificationCode(input: string): string {
  return input.replace(NON_DIGITS, '').slice(0, VERIFICATION_CODE_LENGTH);
}

export function isCompleteVerificationCode(code: string): boolean {
  return code.length === VERIFICATION_CODE_LENGTH && DIGITS_ONLY.test(code);
}

/** A whole number of seconds from a route param, or the default for anything else. */
export function parseResendAfterSeconds(value: string | undefined): number {
  if (!value) return DEFAULT_RESEND_AFTER_SECONDS;
  const seconds = Number(value);
  return Number.isInteger(seconds) && seconds >= 0 ? seconds : DEFAULT_RESEND_AFTER_SECONDS;
}

/** Whole seconds until `deadlineMs`, rounded up so the countdown shows 00:01 before 00:00. */
export function secondsUntil(deadlineMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}

/** 42 → "00:42", 75 → "01:15". */
export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
