import { router } from 'expo-router';
import { useState } from 'react';

import { useSyncPill, type SyncPillState } from '@/features/submission';
import { useTasks } from '@/features/tasks';
import { toApiError, type ApiError } from '@/shared/api/apiError';
import { useToday } from '@/shared/hooks/useToday';
import { formatDayMonth } from '@/shared/utils/date';
import { formatAmount, formatCount } from '@/shared/utils/number';
import { shortOrderNumber } from '@/shared/utils/orderNumber';

import {
  buildHistoryRows,
  formatPeriod,
  HISTORY_FILTER_LABELS,
  HISTORY_FILTERS,
  matchesHistoryFilter,
  PERIOD_PRESETS,
  periodFor,
  totalHistoryRows,
  type HistoryFilter,
} from '../domain/earningsRules';
import type { PeriodPreset } from '../types';

import type { EarningsState } from './useEarningsViewModel';
import { useSalaryQuery } from './useSalaryQuery';

export interface EarningsHistoryItem {
  id: string;
  date: string;
  orderNumber: string;
  serviceName: string;
  items: string;
  amount: string;
  status: 'approved' | 'pending';
}

export interface EarningsHistoryViewModel {
  state: EarningsState;
  periodLabel: string;
  filterOptions: readonly { value: HistoryFilter; label: string }[];
  selectedFilter: HistoryFilter;
  selectFilter: (filter: HistoryFilter) => void;
  rows: EarningsHistoryItem[];
  /** Null when there is nothing to total. */
  subtotal: { items: string; amount: string } | null;
  emptyMessage: string;
  syncPill: SyncPillState;
  isRefreshing: boolean;
  loadError: ApiError | null;
  refresh: () => void;
  retry: () => void;
  goBack: () => void;
  openSyncCenter: () => void;
}

const FILTER_OPTIONS = HISTORY_FILTERS.map((value) => ({
  value,
  label: HISTORY_FILTER_LABELS[value],
}));

function isPeriodPreset(value: string | undefined): value is PeriodPreset {
  return PERIOD_PRESETS.some((preset) => preset === value);
}

function emptyMessageFor(filter: HistoryFilter): string {
  if (filter === 'approved') return 'No approved earnings in this period.';
  if (filter === 'pending') return 'Nothing waiting for review in this period.';
  return 'No earnings in this period yet.';
}

/** Earnings history (E 4.2) for the period chosen on the overview. */
export function useEarningsHistoryViewModel(periodParam?: string): EarningsHistoryViewModel {
  const salary = useSalaryQuery();
  const { tasks, refetch: refetchTasks } = useTasks();
  const syncPill = useSyncPill();
  const today = useToday();
  const [selectedFilter, setSelectedFilter] = useState<HistoryFilter>('all');
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const period = periodFor(isPeriodPreset(periodParam) ? periodParam : 'thisMonth', today);
  const rows = salary.data
    ? buildHistoryRows(salary.data.approved, tasks, period).filter((row) =>
        matchesHistoryFilter(row, selectedFilter),
      )
    : [];
  const totals = totalHistoryRows(rows);

  let state: EarningsState = 'ready';
  if (!salary.data) {
    if (salary.isError) state = 'error';
    else if (salary.fetchStatus === 'paused') state = 'waitingForNetwork';
    else state = 'loading';
  }

  return {
    state,
    periodLabel: formatPeriod(period),
    filterOptions: FILTER_OPTIONS,
    selectedFilter,
    selectFilter: setSelectedFilter,
    rows: rows.map((row) => ({
      id: `${row.status}-${row.id}`,
      date: formatDayMonth(row.date),
      orderNumber: shortOrderNumber(row.orderNumber),
      serviceName: row.serviceName ?? '',
      items: formatCount(row.items),
      amount: formatAmount(row.amount),
      status: row.status,
    })),
    subtotal:
      rows.length > 0
        ? { items: formatCount(totals.items), amount: formatAmount(totals.amount) }
        : null,
    emptyMessage: emptyMessageFor(selectedFilter),
    syncPill,
    isRefreshing: isPullRefreshing,
    loadError: state === 'error' ? toApiError(salary.error) : null,
    refresh: () => {
      setIsPullRefreshing(true);
      void Promise.allSettled([salary.refetch(), refetchTasks()]).finally(() => {
        setIsPullRefreshing(false);
      });
    },
    retry: () => {
      void salary.refetch();
    },
    goBack: () => {
      if (router.canGoBack()) router.back();
      else router.replace('/earnings');
    },
    openSyncCenter: () => {
      router.push('/sync');
    },
  };
}
