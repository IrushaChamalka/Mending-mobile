import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

import { useSyncPill, type SyncPillState } from '@/features/submission';
import type { StatusTone } from '@/shared/theme';
import { formatMoney } from '@/shared/utils/number';

import { WITHDRAWAL_STATUS_LABELS } from '../domain/withdrawalRules';
import type { WithdrawalStatus } from '../types';

import { useWithdrawalsQuery } from './useWithdrawalQueries';

/** loading: the list is not cached yet · missing: no request with this id (a stale link). */
export type WithdrawalSentState = 'loading' | 'missing' | 'sent';

export interface WithdrawalSentViewModel {
  state: WithdrawalSentState;
  result: {
    title: string;
    lines: string[];
    badge: { label: string; tone: StatusTone };
    /** "Reference WD-2026-0031". */
    caption: string;
  } | null;
  syncPill: SyncPillState;
  openSyncCenter: () => void;
  viewHistory: () => void;
  backToHome: () => void;
}

/** The request is waiting for the admin until it is decided; then the badge follows it. */
const BADGES: Record<WithdrawalStatus, { label: string; tone: StatusTone }> = {
  pending: { label: 'Pending approval', tone: 'warning' },
  paid: { label: WITHDRAWAL_STATUS_LABELS.paid, tone: 'success' },
  rejected: { label: WITHDRAWAL_STATUS_LABELS.rejected, tone: 'danger' },
};

function backToWithdrawRoot(): void {
  router.dismissAll();
}

/** "Request sent" (E 5.4), read from the cached request list by id. */
export function useWithdrawalSentViewModel(requestId: string | undefined): WithdrawalSentViewModel {
  const requests = useWithdrawalsQuery();
  const syncPill = useSyncPill();

  // The request is already sent: Android back leaves for the tab's first screen, never the review.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        backToWithdrawRoot();
        return true;
      });
      return () => {
        subscription.remove();
      };
    }, []),
  );

  const request = requests.data?.find((item) => item.id === requestId) ?? null;
  let state: WithdrawalSentState = 'sent';
  if (!request) {
    // Still fetching (or waiting for the network) with nothing cached; a disabled or failed
    // query has nothing more to offer.
    state = requests.data === undefined && requests.fetchStatus !== 'idle' ? 'loading' : 'missing';
  }

  return {
    state,
    result: request
      ? {
          title: 'Request sent',
          lines: [`${formatMoney(request.amount)} to ${request.accountLabel}`],
          badge: BADGES[request.status],
          caption: `Reference ${request.reference}`,
        }
      : null,
    syncPill,
    openSyncCenter: () => {
      router.push('/sync');
    },
    viewHistory: () => {
      router.replace('/withdraw/history');
    },
    backToHome: () => {
      backToWithdrawRoot();
      router.navigate('/');
    },
  };
}
