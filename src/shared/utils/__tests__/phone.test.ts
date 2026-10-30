import { formatPhoneNumber } from '../phone';

describe('formatPhoneNumber', () => {
  it('groups a Sri Lankan mobile number as the designs show it', () => {
    expect(formatPhoneNumber('+94719876543')).toBe('+94 71 987 6543');
  });

  it('accepts a number that already has spaces or dashes', () => {
    expect(formatPhoneNumber('+94 77-123 4567')).toBe('+94 77 123 4567');
  });

  it('leaves other numbers as they are', () => {
    expect(formatPhoneNumber('0771234567')).toBe('0771234567');
    expect(formatPhoneNumber('+4420712345678')).toBe('+4420712345678');
    expect(formatPhoneNumber(' +9477123 ')).toBe('+9477123');
  });
});
