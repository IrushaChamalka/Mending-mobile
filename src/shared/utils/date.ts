import dayjs from 'dayjs';

/**
 * A local calendar day as "YYYY-MM-DD". String comparison gives date order, so `<` and `>` work.
 * Backend DATE columns arrive as UTC midnight (API_CONTRACT §2.4) and must stay calendar days.
 */
export type CalendarDate = string;

const CALENDAR_FORMAT = 'YYYY-MM-DD';

/** "2026-10-20T00:00:00.000Z" → "2026-10-20", without shifting it into the device's time zone. */
export function toCalendarDate(isoDate: string): CalendarDate {
  return isoDate.slice(0, 10);
}

/** Today in the device's time zone. */
export function todayCalendarDate(now: Date = new Date()): CalendarDate {
  return dayjs(now).format(CALENDAR_FORMAT);
}

/** The calendar day `days` after (or before, when negative) `date`. */
export function shiftCalendarDate(date: CalendarDate, days: number): CalendarDate {
  return dayjs(date).add(days, 'day').format(CALENDAR_FORMAT);
}

/** "Today", "Yesterday", "Tomorrow", "Mon 20 Oct", or "20 Oct 2025" outside the current year. */
export function formatCalendarDate(date: CalendarDate, today: CalendarDate): string {
  const target = dayjs(date);
  const reference = dayjs(today);
  const difference = target.diff(reference, 'day');
  if (difference === 0) return 'Today';
  if (difference === -1) return 'Yesterday';
  if (difference === 1) return 'Tomorrow';
  return target.format(target.year() === reference.year() ? 'ddd D MMM' : 'D MMM YYYY');
}

/** A backend timestamp in device time: "Today, 14:30" or "Mon 20 Oct, 09:05". */
export function formatDateTime(isoTimestamp: string, today: CalendarDate): string {
  const moment = dayjs(isoTimestamp);
  if (!moment.isValid()) return '';
  return `${formatCalendarDate(moment.format(CALENDAR_FORMAT), today)}, ${moment.format('HH:mm')}`;
}

/** "Wed 22 Oct": the header subtitle for a day. */
export function formatWeekdayDate(date: CalendarDate): string {
  return dayjs(date).format('ddd D MMM');
}

/** A moment in device local time: "09:58" when it was today, otherwise like formatDateTime. */
export function formatRecentTime(isoTimestamp: string, today: CalendarDate): string {
  const moment = dayjs(isoTimestamp);
  if (!moment.isValid()) return '';
  if (moment.format(CALENDAR_FORMAT) === today) return moment.format('HH:mm');
  return formatDateTime(isoTimestamp, today);
}

/** "9 Oct". */
export function formatDayMonth(date: CalendarDate): string {
  return dayjs(date).format('D MMM');
}

/** "Today, 9 Oct", "Yesterday, 8 Oct", "Tomorrow, 10 Oct", or "Mon 12 Oct" (E 3.2 Due). */
export function formatRelativeDayMonth(date: CalendarDate, today: CalendarDate): string {
  const relative = formatCalendarDate(date, today);
  if (relative === 'Today' || relative === 'Yesterday' || relative === 'Tomorrow') {
    return `${relative}, ${formatDayMonth(date)}`;
  }
  return relative;
}

/** Whole days from `from` to `to`: positive when `to` is later. */
export function daysBetween(from: CalendarDate, to: CalendarDate): number {
  return dayjs(to).diff(dayjs(from), 'day');
}

/** The first day of `date`'s month. */
export function startOfMonth(date: CalendarDate): CalendarDate {
  return dayjs(date).startOf('month').format(CALENDAR_FORMAT);
}

/** The last day of `date`'s month. */
export function endOfMonth(date: CalendarDate): CalendarDate {
  return dayjs(date).endOf('month').format(CALENDAR_FORMAT);
}

/** Every calendar day from `start` to `end`, both included. */
export function eachCalendarDate(start: CalendarDate, end: CalendarDate): CalendarDate[] {
  const days: CalendarDate[] = [];
  for (let day = start; day <= end; day = shiftCalendarDate(day, 1)) days.push(day);
  return days;
}

/**
 * A period as the earnings screens title it (E 4.1): "1–9 Oct 2026", "28 Sep – 9 Oct 2026",
 * "28 Dec 2025 – 3 Jan 2026", or "9 Oct 2026" for a single day.
 */
export function formatDateRange(start: CalendarDate, end: CalendarDate): string {
  const from = dayjs(start);
  const to = dayjs(end);
  if (start === end) return to.format('D MMM YYYY');
  if (from.year() !== to.year()) return `${from.format('D MMM YYYY')} – ${to.format('D MMM YYYY')}`;
  if (from.month() !== to.month()) return `${from.format('D MMM')} – ${to.format('D MMM YYYY')}`;
  return `${from.format('D')}–${to.format('D MMM YYYY')}`;
}

/** The local calendar day of a backend timestamp ("2026-10-09T08:30:00Z" → device-local day). */
export function toLocalCalendarDate(isoTimestamp: string): CalendarDate {
  return dayjs(isoTimestamp).format(CALENDAR_FORMAT);
}
