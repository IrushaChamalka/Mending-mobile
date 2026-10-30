import { router } from 'expo-router';
import { useState } from 'react';

import { useSyncPill, type SyncPillState } from '@/features/submission';
import { toApiError, type ApiError } from '@/shared/api/apiError';
import { features } from '@/shared/config/features';
import { useIsOnline } from '@/shared/hooks/useIsOnline';
import { formatDayMonth } from '@/shared/utils/date';
import { formatAmount, formatMoney } from '@/shared/utils/number';

import {
  formatShortReference,
  matchesWithdrawalFilter,
  paidTotal,
  pendingTotal,
  WITHDRAWAL_FILTER_LABELS,
  WITHDRAWAL_FILTERS,
  WITHDRAWAL_STATUS_LABELS,
  type WithdrawalFilter,
} from '../domain/withdrawalRules';
import type { WithdrawalStatus } from '../types';

import { useWithdrawalHistory } from './useWithdrawalHistory';

/** One table row (E 5.5), formatted. */
export interface WithdrawalRow {
  id: string;
  /** "9 Oct". */
  dateLabel: string;
  /** "WD-0031". */
  reference: string;
  /** "BOC ···· 4421", or how an admin paid ("Bank transfer"). */
  accountLabel: string;
  /** "10,000". */
  amountLabel: string;
  status: WithdrawalStatus;
  statusLabel: string;
  /** The last row closes the table card. */
  isLast: boolean;
}

export interface WithdrawalFilterOption {
  value: WithdrawalFilter;
  label: string;
}

/** loading and waitingForNetwork only happen before anything is cached. */
export type WithdrawalHistoryState = 'loading' | 'waitingForNetwork' | 'error' | 'ready';

export interface WithdrawalHistoryViewModel {
  state: WithdrawalHistoryState;
  subtitle: string;
  rows: WithdrawalRow[];
  /** "LKR 10,000". */
  withdrawnLabel: string;
  pendingLabel: string;
  filterOptions: readonly WithdrawalFilterOption[];
  selectedFilter: WithdrawalFilter;
  selectFilter: (filter: WithdrawalFilter) => void;
  /** The table's only row when the filter matches nothing. */
  emptyMessage: string;
  /** Undefined on the tab's root screen, which has no back button. */
  goBack: (() => void) | undefined;
  isOnline: boolean;
  syncPill: SyncPillState;
  openSyncCenter: () => void;
  isRefreshing: boolean;
  refresh: () => void;
  /** The last refresh failed, so saved payouts are shown. */
  refreshFailed: boolean;
  /** Blocking error: nothing cached to show. */
  loadError: ApiError | null;
  retry: () => void;
}

const FILTER_OPTIONS: readonly WithdrawalFilterOption[] = WITHDRAWAL_FILTERS.map((value) => ({
  value,
  label: WITHDRAWAL_FILTER_LABELS[value],
}));

function emptyMessageFor(filter: WithdrawalFilter): string {
  if (filter === 'all') return 'No withdrawals yet.';
  return `No ${WITHDRAWAL_FILTER_LABELS[filter].toLowerCase()} withdrawals.`;
}

/**
 * Withdrawal history (E 5.5): totals, status filters and the payouts table. Against the real
 * backend these are the payouts an admin recorded, so every row is paid.
 */
export function useWithdrawalHistoryViewModel({
  isTabRoot,
}: {
  isTabRoot: boolean;
}): WithdrawalHistoryViewModel {
  const history = useWithdrawalHistory();
  const isOnline = useIsOnline();
  const syncPill = useSyncPill();
  const [selectedFilter, setSelectedFilter] = useState<WithdrawalFilter>('all');
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const { withdrawals } = history;
  const visible = withdrawals.filter((item) => matchesWithdrawalFilter(item, selectedFilter));
  const rows = visible.map((item, index) => ({
    id: item.id,
    dateLabel: formatDayMonth(item.date),
    reference: formatShortReference(item.reference),
    accountLabel: item.accountLabel,
    amountLabel: formatAmount(item.amount),
    status: item.status,
    statusLabel: WITHDRAWAL_STATUS_LABELS[item.status],
    isLast: index === visible.length - 1,
  }));

  let state: WithdrawalHistoryState = 'ready';
  if (!history.hasData) {
    if (history.isError) state = 'error';
    else if (history.isPaused) state = 'waitingForNetwork';
    else state = 'loading';
  }

  return {
    state,
    subtitle: features.withdrawalRequests ? 'Your payout requests' : 'Payouts from your admin',
    rows,
    withdrawnLabel: formatMoney(paidTotal(withdrawals)),
    pendingLabel: formatMoney(pendingTotal(withdrawals)),
    filterOptions: FILTER_OPTIONS,
    selectedFilter,
    selectFilter: setSelectedFilter,
    emptyMessage: emptyMessageFor(selectedFilter),
    goBack: isTabRoot
      ? undefined
      : () => {
          if (router.canGoBack()) router.back();
          else router.replace('/withdraw');
        },
    isOnline,
    syncPill,
    openSyncCenter: () => {
      router.push('/sync');
    },
    isRefreshing: isPullRefreshing,
    refresh: () => {
      setIsPullRefreshing(true);
      void history.refetch().finally(() => {
        setIsPullRefreshing(false);
      });
    },
    refreshFailed: history.isRefetchError,
    loadError: state === 'error' ? toApiError(history.error) : null,
    retry: () => {
      void history.refetch();
    },
  };
}
