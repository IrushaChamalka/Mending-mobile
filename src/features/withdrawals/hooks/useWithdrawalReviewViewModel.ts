import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

import { useSyncPill, type SyncPillState } from '@/features/submission';
import { toApiError, type ApiError } from '@/shared/api/apiError';
import { features } from '@/shared/config/features';
import { useIsOnline } from '@/shared/hooks/useIsOnline';
import { formatMoney, parseAmount } from '@/shared/utils/number';

import {
  balanceAfterWithdrawal,
  formatAccountShort,
  PROCESSING_TIME_LABEL,
  validateWithdrawalAmount,
  WITHDRAWAL_FEE,
} from '../domain/withdrawalRules';

import { useWithdrawableBalance } from './useWithdrawableBalance';
import { useCreateWithdrawal, usePayoutAccountQuery } from './useWithdrawalQueries';

/**
 * unavailable: requests are off (real backend) · loading and waitingForNetwork: nothing cached yet
 * · error: the balance or the account could not load · invalid: the amount cannot be requested
 * (a deep link, or the balance changed since the request screen) · ready.
 */
export type WithdrawalReviewState =
  'unavailable' | 'loading' | 'waitingForNetwork' | 'error' | 'invalid' | 'ready';

export interface WithdrawalReviewViewModel {
  state: WithdrawalReviewState;
  /** "LKR 10,000". */
  amountLabel: string;
  /** Payout account, Fee, Balance after, Processing (E 5.3). */
  rows: { label: string; value: string }[];
  /** Why the amount cannot be requested, for the invalid state. */
  invalidReason: string | null;
  isOnline: boolean;
  canSubmit: boolean;
  isSubmitting: boolean;
  /** False while the request is on its way: leaving would hide its outcome. */
  canLeave: boolean;
  submitError: string | null;
  syncPill: SyncPillState;
  submit: () => void;
  editAmount: () => void;
  openSyncCenter: () => void;
  openHistory: () => void;
  loadError: ApiError | null;
  retry: () => void;
}

function backToRequest(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/withdraw');
}

/**
 * Review a payout request (E 5.3). The amount arrives as a route parameter, so it is checked again
 * against the live balance before anything is sent. Requests go out only while online.
 */
export function useWithdrawalReviewViewModel(
  amountParam: string | undefined,
): WithdrawalReviewViewModel {
  const balance = useWithdrawableBalance();
  const accountQuery = usePayoutAccountQuery();
  const create = useCreateWithdrawal();
  const isOnline = useIsOnline();
  const syncPill = useSyncPill();

  const isSubmitting = create.isPending;
  // Once sent, the new request is held and lowers the balance: the screen must not turn invalid
  // for the moment before the success screen replaces it.
  const isSent = create.isSuccess;
  const canLeave = !isSubmitting && !isSent;

  // Android back is ignored while the request is on its way.
  useFocusEffect(
    useCallback(() => {
      if (canLeave) return undefined;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => {
        subscription.remove();
      };
    }, [canLeave]),
  );

  const account = accountQuery.data;
  const amount = amountParam === undefined ? null : parseAmount(amountParam);
  const validation =
    isSubmitting || isSent ? null : validateWithdrawalAmount(amount, balance.available);
  const hasData = balance.hasData && account !== undefined;

  let state: WithdrawalReviewState = 'ready';
  if (!features.withdrawalRequests || !features.payoutAccount) state = 'unavailable';
  else if (!hasData) {
    if (balance.isError || accountQuery.isError) state = 'error';
    else if (balance.isPaused || accountQuery.fetchStatus === 'paused') {
      state = 'waitingForNetwork';
    } else state = 'loading';
  } else if (validation !== null) state = 'invalid';

  const canSubmit = state === 'ready' && isOnline && !isSubmitting && !isSent;
  const requested = amount ?? 0;

  return {
    state,
    amountLabel: formatMoney(requested),
    rows: account
      ? [
          { label: 'Payout account', value: formatAccountShort(account) },
          { label: 'Fee', value: formatMoney(WITHDRAWAL_FEE) },
          {
            label: 'Balance after',
            value: formatMoney(balanceAfterWithdrawal(balance.available, requested)),
          },
          { label: 'Processing', value: PROCESSING_TIME_LABEL },
        ]
      : [],
    invalidReason: state === 'invalid' ? validation : null,
    isOnline,
    canSubmit,
    isSubmitting,
    canLeave,
    submitError: create.error ? toApiError(create.error).message : null,
    syncPill,
    submit: () => {
      if (!canSubmit || !account || amount === null) return;
      create.mutate(
        { amount, payoutAccountId: account.id },
        {
          onSuccess: (created) => {
            // Replaced, not pushed: back from "Request sent" must never reopen this screen.
            router.replace({ pathname: '/withdraw/sent', params: { id: created.id } });
          },
          onError: (error) => {
            // The server refused the amount: the balance may have changed, so check it again.
            if (toApiError(error).type === 'validation') void balance.refetch();
          },
        },
      );
    },
    editAmount: () => {
      if (canLeave) backToRequest();
    },
    openSyncCenter: () => {
      router.push('/sync');
    },
    openHistory: () => {
      router.replace('/withdraw/history');
    },
    loadError: state === 'error' ? toApiError(balance.error ?? accountQuery.error) : null,
    retry: () => {
      void Promise.all([balance.refetch(), accountQuery.refetch()]);
    },
  };
}
