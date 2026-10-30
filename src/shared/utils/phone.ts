import { COUNTRY_DIAL_CODE } from '@/shared/config/locale';

/** Sri Lankan numbers have nine digits after +94 (API_CONTRACT §3.1). */
const LOCAL_NUMBER = /^\d{9}$/;

/** "+94771234567" → "+94 77 123 4567", as the designs show it. Anything else is returned trimmed. */
export function formatPhoneNumber(phone: string): string {
  const compact = phone.replace(/[\s-]/g, '');
  if (!compact.startsWith(COUNTRY_DIAL_CODE)) return phone.trim();
  const local = compact.slice(COUNTRY_DIAL_CODE.length);
  if (!LOCAL_NUMBER.test(local)) return phone.trim();
  return `${COUNTRY_DIAL_CODE} ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
}
