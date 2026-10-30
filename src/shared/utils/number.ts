const countFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const wholeAmountFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const centsAmountFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** The currency every amount is in (backend salary summary `currency`). */
export const CURRENCY = 'LKR';

/** 1420 → "1,420". */
export function formatCount(value: number): string {
  return countFormatter.format(value);
}

/** Rounds to cents, the precision of the backend's Decimal(14, 2) columns. */
export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/** 15560 → "15,560"; 3312.5 → "3,312.50". Whole amounts show no cents, as in the designs. */
export function formatAmount(value: number): string {
  const rounded = roundToCents(value);
  return Number.isInteger(rounded)
    ? wholeAmountFormatter.format(rounded)
    : centsAmountFormatter.format(rounded);
}

/** 15560 → "LKR 15,560". */
export function formatMoney(value: number): string {
  return `${CURRENCY} ${formatAmount(value)}`;
}

/**
 * What someone typed into an amount field ("10,000", "2500.50") as a number, or null when it is not
 * an amount. Digits, one decimal point and thousands commas are allowed.
 */
export function parseAmount(input: string): number | null {
  const compact = input.replace(/[,\s]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(compact)) return null;
  return Number(compact);
}

/** "10000" → "10,000" while typing; keeps a trailing "." and up to two decimals as typed. */
export function formatAmountInput(input: string): string {
  const compact = input.replace(/[^\d.]/g, '');
  const [whole = '', ...rest] = compact.split('.');
  const integer = whole.replace(/^0+(?=\d)/, '');
  const grouped = integer ? wholeAmountFormatter.format(Number(integer)) : '';
  if (rest.length === 0) return grouped;
  return `${grouped || '0'}.${rest.join('').slice(0, 2)}`;
}
