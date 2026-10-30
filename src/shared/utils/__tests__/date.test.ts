import {
  formatCalendarDate,
  formatDateTime,
  formatWeekdayDate,
  shiftCalendarDate,
  toCalendarDate,
  todayCalendarDate,
} from '../date';

describe('calendar dates', () => {
  it('keeps a backend DATE column on its calendar day', () => {
    expect(toCalendarDate('2026-10-20T00:00:00.000Z')).toBe('2026-10-20');
  });

  it('reads today from the device clock', () => {
    expect(todayCalendarDate(new Date(2026, 9, 22, 23, 30))).toBe('2026-10-22');
  });

  it('shifts across month ends', () => {
    expect(shiftCalendarDate('2026-10-31', 1)).toBe('2026-11-01');
    expect(shiftCalendarDate('2026-11-01', -1)).toBe('2026-10-31');
  });

  it.each([
    ['2026-10-22', 'Today'],
    ['2026-10-21', 'Yesterday'],
    ['2026-10-23', 'Tomorrow'],
    ['2026-10-19', 'Mon 19 Oct'],
    ['2025-12-31', '31 Dec 2025'],
  ])('formats %s as %s', (date, label) => {
    expect(formatCalendarDate(date, '2026-10-22')).toBe(label);
  });

  it('formats timestamps in device time (UTC in tests)', () => {
    expect(formatDateTime('2026-10-22T09:05:00.000Z', '2026-10-22')).toBe('Today, 09:05');
    expect(formatDateTime('not a date', '2026-10-22')).toBe('');
  });

  it('formats the header day', () => {
    expect(formatWeekdayDate('2026-10-22')).toBe('Thu 22 Oct');
  });
});
