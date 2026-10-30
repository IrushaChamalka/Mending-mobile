import { formatAmount, formatAmountInput, formatMoney, parseAmount, roundToCents } from '../number';
import { shortOrderNumber } from '../orderNumber';

describe('money formatting', () => {
  it('shows whole amounts without cents and keeps real cents', () => {
    expect(formatAmount(15560)).toBe('15,560');
    expect(formatAmount(3312.5)).toBe('3,312.50');
    expect(formatAmount(0.1 + 0.2)).toBe('0.30');
    expect(formatMoney(15560)).toBe('LKR 15,560');
    expect(roundToCents(100.005)).toBeCloseTo(100.01);
  });

  it('parses what people type into an amount field', () => {
    expect(parseAmount('10,000')).toBe(10000);
    expect(parseAmount('2500.50')).toBe(2500.5);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('12a')).toBeNull();
    expect(parseAmount('1.234')).toBeNull();
  });

  it('groups digits while typing', () => {
    expect(formatAmountInput('10000')).toBe('10,000');
    expect(formatAmountInput('0012')).toBe('12');
    expect(formatAmountInput('1500.')).toBe('1,500.');
    expect(formatAmountInput('1500.567')).toBe('1,500.56');
    expect(formatAmountInput('.5')).toBe('0.5');
    expect(formatAmountInput('')).toBe('');
  });
});

describe('shortOrderNumber', () => {
  it('drops the year as the history tables do (E 4.2)', () => {
    expect(shortOrderNumber('ORD-2026-0142')).toBe('ORD-0142');
    expect(shortOrderNumber('PRD-123')).toBe('PRD-123');
  });
});
