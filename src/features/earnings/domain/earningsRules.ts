import type { Task } from '@/features/tasks';
import {
  eachCalendarDate,
  endOfMonth,
  formatDateRange,
  shiftCalendarDate,
  startOfMonth,
  type CalendarDate,
} from '@/shared/utils/date';
import { roundToCents } from '@/shared/utils/number';

import type { ApprovedEarning, EarningsHistoryRow, EarningsPeriod, PeriodPreset } from '../types';

export const PERIOD_PRESETS: readonly PeriodPreset[] = [
  'thisMonth',
  'lastMonth',
  'last7Days',
  'last30Days',
];

export const PERIOD_PRESET_LABELS: Record<PeriodPreset, string> = {
  thisMonth: 'This month',
  lastMonth: 'Last month',
  last7Days: 'Last 7 days',
  last30Days: 'Last 30 days',
};

/** The days a preset covers on `today`. "This month" runs to today, as "1–9 Oct 2026" does (E 4.1). */
export function periodFor(preset: PeriodPreset, today: CalendarDate): EarningsPeriod {
  switch (preset) {
    case 'thisMonth':
      return { start: startOfMonth(today), end: today };
    case 'lastMonth': {
      const lastMonthDay = shiftCalendarDate(startOfMonth(today), -1);
      return { start: startOfMonth(lastMonthDay), end: endOfMonth(lastMonthDay) };
    }
    case 'last7Days':
      return { start: shiftCalendarDate(today, -6), end: today };
    case 'last30Days':
      return { start: shiftCalendarDate(today, -29), end: today };
  }
}

export function formatPeriod(period: EarningsPeriod): string {
  return formatDateRange(period.start, period.end);
}

export function isInPeriod(date: CalendarDate, period: EarningsPeriod): boolean {
  return date >= period.start && date <= period.end;
}

/**
 * Submitted work waiting for review, valued at reported pieces × rate. The salary endpoint lists
 * reviewed work only, so pending earnings come from the task list (API_CONTRACT §11.2).
 */
export function toPendingRows(tasks: readonly Task[]): EarningsHistoryRow[] {
  return tasks
    .filter((task) => task.status === 'SUBMITTED')
    .map((task) => ({
      id: task.id,
      date: task.dueDate,
      orderNumber: task.orderNumber ?? 'Order',
      serviceName: task.serviceName,
      items: task.latestSubmission?.completedQuantity ?? task.target.achieved,
      amount: task.payout.completed,
      status: 'pending' as const,
    }));
}

export function toApprovedRows(approved: readonly ApprovedEarning[]): EarningsHistoryRow[] {
  return approved.map((item) => ({
    id: item.assignmentId,
    date: item.date,
    orderNumber: item.orderNumber,
    serviceName: item.serviceName,
    items: item.acceptedQuantity,
    amount: item.amount,
    status: 'approved' as const,
  }));
}

/** Approved and pending rows inside the period, newest first. */
export function buildHistoryRows(
  approved: readonly ApprovedEarning[],
  tasks: readonly Task[],
  period: EarningsPeriod,
): EarningsHistoryRow[] {
  return [...toApprovedRows(approved), ...toPendingRows(tasks)]
    .filter((row) => isInPeriod(row.date, period))
    .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
}

export interface PeriodSummary {
  /** Approved plus pending: what the period should pay once everything is reviewed. */
  estimated: number;
  approved: number;
  pending: number;
  /** Pieces reported (reviewed and pending work). */
  items: number;
  /** Pieces the supervisor accepted. */
  acceptedItems: number;
}

export function summarizePeriod(
  approved: readonly ApprovedEarning[],
  tasks: readonly Task[],
  period: EarningsPeriod,
): PeriodSummary {
  const approvedInPeriod = approved.filter((item) => isInPeriod(item.date, period));
  const pendingInPeriod = toPendingRows(tasks).filter((row) => isInPeriod(row.date, period));
  const approvedAmount = roundToCents(approvedInPeriod.reduce((sum, item) => sum + item.amount, 0));
  const pendingAmount = roundToCents(pendingInPeriod.reduce((sum, row) => sum + row.amount, 0));
  return {
    estimated: roundToCents(approvedAmount + pendingAmount),
    approved: approvedAmount,
    pending: pendingAmount,
    items:
      approvedInPeriod.reduce((sum, item) => sum + item.completedQuantity, 0) +
      pendingInPeriod.reduce((sum, row) => sum + row.items, 0),
    acceptedItems: approvedInPeriod.reduce((sum, item) => sum + item.acceptedQuantity, 0),
  };
}

export interface DailyAmount {
  date: CalendarDate;
  amount: number;
}

/** Approved earnings for every day of the period, zero days included (the E 4.1 bar chart). */
export function approvedByDay(
  approved: readonly ApprovedEarning[],
  period: EarningsPeriod,
): DailyAmount[] {
  const totals = new Map<CalendarDate, number>();
  for (const item of approved) {
    if (isInPeriod(item.date, period)) {
      totals.set(item.date, (totals.get(item.date) ?? 0) + item.amount);
    }
  }
  return eachCalendarDate(period.start, period.end).map((date) => ({
    date,
    amount: roundToCents(totals.get(date) ?? 0),
  }));
}

/** History rows matching the All / Approved / Pending chips (E 4.2). */
export type HistoryFilter = 'all' | 'approved' | 'pending';

export const HISTORY_FILTERS: readonly HistoryFilter[] = ['all', 'approved', 'pending'];

export const HISTORY_FILTER_LABELS: Record<HistoryFilter, string> = {
  all: 'All',
  approved: 'Approved',
  pending: 'Pending',
};

export function matchesHistoryFilter(row: EarningsHistoryRow, filter: HistoryFilter): boolean {
  return filter === 'all' || row.status === filter;
}

export interface HistoryTotals {
  items: number;
  amount: number;
}

export function totalHistoryRows(rows: readonly EarningsHistoryRow[]): HistoryTotals {
  return {
    items: rows.reduce((sum, row) => sum + row.items, 0),
    amount: roundToCents(rows.reduce((sum, row) => sum + row.amount, 0)),
  };
}
