import { getPasswordStrength } from '../passwordStrength';

describe('getPasswordStrength', () => {
  it('leaves the meter blank for an empty password', () => {
    expect(getPasswordStrength('')).toBeNull();
  });

  it.each([
    ['Ab1!', 'below the backend minimum, however varied'],
    ['aaaaaaaaaaaaaaaa', 'one repeated character'],
    ['abababab1111', 'fewer than four different characters'],
    ['abcdef', 'six lowercase letters'],
    ['abcdefgh', 'eight lowercase letters'],
    ['abc123', 'six characters of two kinds'],
  ])('rates %p as weak (%s)', (password) => {
    expect(getPasswordStrength(password)).toEqual({ level: 'weak', score: 1 });
  });

  it.each([
    ['abcd1234', 'eight characters of two kinds'],
    ['Abc123', 'six characters of three kinds'],
    ['abcdefghijkl', 'twelve lowercase letters'],
  ])('rates %p as fair (%s)', (password) => {
    expect(getPasswordStrength(password)).toEqual({ level: 'fair', score: 2 });
  });

  it.each([
    ['Kasun@2026', 'ten characters of four kinds (the E 1.6 sample)'],
    ['Abcd1234', 'eight characters of three kinds'],
    ['correcthorsebatterystaple', 'a long passphrase'],
  ])('rates %p as strong (%s)', (password) => {
    expect(getPasswordStrength(password)).toEqual({ level: 'strong', score: 3 });
  });

  it.each([
    ['Kasun@2026ab', 'twelve characters of four kinds'],
    ['correct horse battery 7', 'a long passphrase with digits and spaces'],
  ])('rates %p as very strong (%s)', (password) => {
    expect(getPasswordStrength(password)).toEqual({ level: 'veryStrong', score: 4 });
  });
});
