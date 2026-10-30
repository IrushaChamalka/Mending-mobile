import { formatDayMonth } from '@/shared/utils/date';
import { formatMoney } from '@/shared/utils/number';

import type { ChartBar } from '../types';

import type { DailyAmount } from './earningsRules';

/** Long periods label every few bars so the day numbers never collide. */
const MAX_BAR_LABELS = 10;

/** Bars scaled against the period's best day, labelled with the day of the month. */
export function toChartBars(days: readonly DailyAmount[]): ChartBar[] {
  const max = Math.max(0, ...days.map((day) => day.amount));
  const step = Math.ceil(days.length / MAX_BAR_LABELS);
  return days.map((day, index) => ({
    key: day.date,
    label: index % step === 0 ? String(Number(day.date.slice(8))) : '',
    fraction: max > 0 ? day.amount / max : 0,
    accessibilityLabel: `${formatDayMonth(day.date)}: ${formatMoney(day.amount)} approved`,
  }));
}
