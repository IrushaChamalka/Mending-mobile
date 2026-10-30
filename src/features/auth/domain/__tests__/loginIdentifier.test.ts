import { isPhoneIdentifier, toLoginIdentifier } from '../loginIdentifier';

describe('toLoginIdentifier', () => {
  it.each([
    ['77 123 4567', '+94771234567'],
    ['771234567', '+94771234567'],
    ['0771234567', '+94771234567'],
    ['077-123-4567', '+94771234567'],
    ['(077) 123 4567', '+94771234567'],
    ['94771234567', '+94771234567'],
    ['+94 77 123 4567', '+94771234567'],
    ['+1234567890', '+1234567890'],
    ['  user00002 ', 'user00002'],
    ['kasun@example.com', 'kasun@example.com'],
  ])('sends %p as %p', (input, expected) => {
    expect(toLoginIdentifier(input)).toBe(expected);
  });
});

describe('isPhoneIdentifier', () => {
  it.each(['+94771234567', '+1234567890'])('accepts the number %p', (identifier) => {
    expect(isPhoneIdentifier(identifier)).toBe(true);
  });

  it.each(['user00006', 'kasun@example.com', '+94', '+12345'])(
    'rejects %p, which no SMS can reach',
    (identifier) => {
      expect(isPhoneIdentifier(identifier)).toBe(false);
    },
  );
});
