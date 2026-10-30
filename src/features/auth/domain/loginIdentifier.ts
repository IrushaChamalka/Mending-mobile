import { COUNTRY_DIAL_CODE } from '@/shared/config/locale';

const DIAL_DIGITS = COUNTRY_DIAL_CODE.slice(1); // "94"
const INTERNATIONAL_NUMBER = /^\+\d+$/;
const DIGITS_ONLY = /^\d+$/;
const NUMBER_FORMATTING = /[\s\-().]/g;

/**
 * Turns what the user typed after the fixed +94 prefix into the `phone` value the backend's mobile
 * login expects (API_CONTRACT §3.1):
 * - national digits ("77 123 4567", "0771234567") → "+94771234567"
 * - digits already starting with 94 ("94771234567") → "+94771234567"
 * - an international number ("+1234567890") → sent as typed, without spaces
 * - anything else (employee ID, email) → sent trimmed, as typed
 */
export function toLoginIdentifier(input: string): string {
  const trimmed = input.trim();
  const compact = trimmed.replace(NUMBER_FORMATTING, '');
  if (INTERNATIONAL_NUMBER.test(compact)) return compact;
  if (!DIGITS_ONLY.test(compact)) return trimmed;
  if (compact.startsWith(DIAL_DIGITS) && compact.length === DIAL_DIGITS.length + 9) {
    return `+${compact}`;
  }
  return `${COUNTRY_DIAL_CODE}${compact.replace(/^0+/, '')}`;
}

/** An international number of 7 to 15 digits (E.164), i.e. something an SMS can reach. */
const PHONE_IDENTIFIER = /^\+\d{7,15}$/;

/**
 * True when a toLoginIdentifier result is a mobile number rather than an employee ID or email. The
 * password reset texts a code, so it needs a number.
 */
export function isPhoneIdentifier(identifier: string): boolean {
  return PHONE_IDENTIFIER.test(identifier);
}
