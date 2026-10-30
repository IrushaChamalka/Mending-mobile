import {
  DEFAULT_RESEND_AFTER_SECONDS,
  formatCountdown,
  isCompleteVerificationCode,
  parseResendAfterSeconds,
  secondsUntil,
  toVerificationCode,
} from '../verificationCode';

describe('toVerificationCode', () => {
  it.each([
    ['482913', '482913'],
    ['482 91', '48291'],
    ['48-29-13', '482913'],
    ['48291345', '482913'],
    ['abc', ''],
  ])('keeps the digits of %p', (input, expected) => {
    expect(toVerificationCode(input)).toBe(expected);
  });
});

describe('isCompleteVerificationCode', () => {
  it('needs exactly six digits', () => {
    expect(isCompleteVerificationCode('482913')).toBe(true);
    expect(isCompleteVerificationCode('48291')).toBe(false);
    expect(isCompleteVerificationCode('48291a')).toBe(false);
  });
});

describe('parseResendAfterSeconds', () => {
  it('reads whole seconds from the route param', () => {
    expect(parseResendAfterSeconds('42')).toBe(42);
    expect(parseResendAfterSeconds('0')).toBe(0);
  });

  it.each([undefined, '', 'soon', '-5', '1.5'])('falls back to 60 seconds for %p', (value) => {
    expect(parseResendAfterSeconds(value)).toBe(DEFAULT_RESEND_AFTER_SECONDS);
  });
});

describe('secondsUntil', () => {
  it('rounds up, so the last second still shows', () => {
    expect(secondsUntil(10_000, 0)).toBe(10);
    expect(secondsUntil(10_000, 9_001)).toBe(1);
    expect(secondsUntil(10_000, 10_000)).toBe(0);
  });

  it('never goes below zero (the app was in the background past the deadline)', () => {
    expect(secondsUntil(10_000, 60_000)).toBe(0);
  });
});

describe('formatCountdown', () => {
  it.each([
    [42, '00:42'],
    [60, '01:00'],
    [75, '01:15'],
    [0, '00:00'],
    [-3, '00:00'],
  ])('shows %p seconds as %p', (seconds, expected) => {
    expect(formatCountdown(seconds)).toBe(expected);
  });
});
