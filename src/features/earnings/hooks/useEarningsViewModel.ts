import { router } from 'expo-router';
import { useState } from 'react';

import { useSyncPill, type SyncPillState } from '@/features/submission';
import { useTasks } from '@/features/tasks';
import { useWithdrawableBalance } from '@/features/withdrawals';
import { toApiError, type ApiError } from '@/shared/api/apiError';
import { useToday } from '@/shared/hooks/useToday';
import type { SheetOption } from '@/shared/ui';
import { formatMoney } from '@/shared/utils/number';

import { toChartBars } from '../domain/chartBars';
import {
  approvedByDay,
  formatPeriod,
  PERIOD_PRESET_LABELS,
  PERIOD_PRESETS,
  periodFor,
  summarizePeriod,
} from '../domain/earningsRules';
import type { ChartBar, PeriodPreset } from '../types';

import { useSalaryQuery } from './useSalaryQuery';

export type EarningsState = 'loading' | 'waitingForNetwork' | 'error' | 'ready';

export interface EarningsViewModel {
  state: EarningsState;
  periodLabel: string;
  periodOptions: readonly SheetOption<PeriodPreset>[];
  selectedPreset: PeriodPreset;
  isPeriodSheetOpen: boolean;
  summary: { estimated: string; approved: string; withdrawn: string; available: string } | null;
  bars: ChartBar[];
  syncPill: SyncPillState;
  isRefreshing: boolean;
  /** The last refresh failed, so saved numbers are shown. */
  refreshFailed: boolean;
  loadError: ApiError | null;
  openPeriodSheet: () => void;
  closePeriodSheet: () => void;
  selectPreset: (preset: PeriodPreset) => void;
  openHistory: () => void;
  openSyncCenter: () => void;
  refresh: () => void;
  retry: () => void;
}

/**
 * Earnings overview (E 4.1). Estimated and approved earnings follow the chosen period; withdrawn
 * and available are all-time, so "Available" always matches Home and Withdraw.
 */
export function useEarningsViewModel(): EarningsViewModel {
  const salary = useSalaryQuery();
  const { tasks, refetch: refetchTasks } = useTasks();
  const balance = useWithdrawableBalance();
  const syncPill = useSyncPill();
  const today = useToday();
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset>('thisMonth');
  const [isPeriodSheetOpen, setIsPeriodSheetOpen] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const period = periodFor(selectedPreset, today);
  const data = salary.data;
  const summary = data ? summarizePeriod(data.approved, tasks, period) : null;

  let state: EarningsState = 'ready';
  if (!data) {
    if (salary.isError) state = 'error';
    else if (salary.fetchStatus === 'paused') state = 'waitingForNetwork';
    else state = 'loading';
  }

  return {
    state,
    periodLabel: formatPeriod(period),
    periodOptions: PERIOD_PRESETS.map((preset) => ({
      value: preset,
      label: PERIOD_PRESET_LABELS[preset],
      detail: formatPeriod(periodFor(preset, today)),
    })),
    selectedPreset,
    isPeriodSheetOpen,
    summary: summary
      ? {
          estimated: formatMoney(summary.estimated),
          approved: formatMoney(summary.approved),
          withdrawn: `− ${formatMoney(balance.withdrawn)}`,
          available: formatMoney(balance.available),
        }
      : null,
    bars: data ? toChartBars(approvedByDay(data.approved, period)) : [],
    syncPill,
    isRefreshing: isPullRefreshing,
    refreshFailed: salary.isRefetchError,
    loadError: state === 'error' ? toApiError(salary.error) : null,
    openPeriodSheet: () => {
      setIsPeriodSheetOpen(true);
    },
    closePeriodSheet: () => {
      setIsPeriodSheetOpen(false);
    },
    selectPreset: (preset) => {
      setSelectedPreset(preset);
      setIsPeriodSheetOpen(false);
    },
    openHistory: () => {
      router.push({ pathname: '/earnings/history', params: { period: selectedPreset } });
    },
    openSyncCenter: () => {
      router.push('/sync');
    },
    refresh: () => {
      setIsPullRefreshing(true);
      // Pending earnings come from the task list, so it refreshes with the salary.
      void Promise.allSettled([balance.refetch(), refetchTasks()]).finally(() => {
        setIsPullRefreshing(false);
      });
    },
    retry: () => {
      void salary.refetch();
    },
  };
}
