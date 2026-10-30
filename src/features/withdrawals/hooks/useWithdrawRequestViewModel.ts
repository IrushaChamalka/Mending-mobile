import { useMutationState } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';

import { useSyncPill, type SyncPillState } from '@/features/submission';
import { toApiError, type ApiError } from '@/shared/api/apiError';
import { features } from '@/shared/config/features';
import { formatAmount, formatAmountInput, formatMoney, parseAmount } from '@/shared/utils/number';

import { withdrawalMutationKeys } from '../data/queryKeys';
import {
  formatAccountLong,
  quickAmountsFor,
  validateWithdrawalAmount,
} from '../domain/withdrawalRules';

import { useWithdrawableBalance } from './useWithdrawableBalance';
import { usePayoutAccountQuery } from './useWithdrawalQueries';

/**
 * unavailable: requests are off (real backend) · loading and waitingForNetwork: nothing cached yet
 * · error: the balance or the account could not load · ready.
 */
export type WithdrawRequestState =
  'unavailable' | 'loading' | 'waitingForNetwork' | 'error' | 'ready';

export interface QuickAmountOption {
  label: string;
  value: number;
}

export interface WithdrawRequestViewModel {
  state: WithdrawRequestState;
  /** "LKR 15,560". */
  availableLabel: string;
  /** Shown instead of the amount field when there is nothing to withdraw. */
  nothingToWithdraw: { title: string; message: string } | null;
  amountText: string;
  changeAmount: (text: string) => void;
  /** Shown once the user has typed or picked an amount (E 5.2). */
  amountError: string | null;
  quickAmounts: readonly QuickAmountOption[];
  selectQuickAmount: (value: number) => void;
  /** "Bank of Ceylon ···· 4421" / "Kasun Fernando · verified". */
  account: { title: string; subtitle: string } | null;
  canReview: boolean;
  review: () => void;
  openPayoutAccount: () => void;
  openHistory: () => void;
  syncPill: SyncPillState;
  openSyncCenter: () => void;
  loadError: ApiError | null;
  retry: () => void;
  isRefreshing: boolean;
  refresh: () => void;
}

interface AmountForm {
  text: string;
  hasTyped: boolean;
  /** The newest sent request this form has seen, so it clears after the next one. */
  seenRequestAt: number;
}

/** When the newest payout request was sent in this session (0 before the first). */
function useLastRequestSentAt(): number {
  const sentAt = useMutationState({
    filters: { mutationKey: withdrawalMutationKeys.create, status: 'success' },
    select: (mutation) => mutation.state.submittedAt,
  });
  return Math.max(0, ...sentAt);
}

/** Request a payout (E 5.1, E 5.2): amount, quick amounts, the payout account, then review. */
export function useWithdrawRequestViewModel(): WithdrawRequestViewModel {
  const balance = useWithdrawableBalance();
  const accountQuery = usePayoutAccountQuery();
  const syncPill = useSyncPill();
  const lastSentAt = useLastRequestSentAt();
  const [form, setForm] = useState<AmountForm>({
    text: '',
    hasTyped: false,
    seenRequestAt: lastSentAt,
  });
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  // A request was sent since this amount was typed (the user came back from "Request sent"):
  // start again from an empty field, so the same request is not sent twice by accident.
  if (lastSentAt > form.seenRequestAt) {
    setForm({ text: '', hasTyped: false, seenRequestAt: lastSentAt });
  }

  const account = accountQuery.data;
  const hasData = balance.hasData && account !== undefined;
  let state: WithdrawRequestState = 'ready';
  if (!features.withdrawalRequests || !features.payoutAccount) state = 'unavailable';
  else if (!hasData) {
    if (balance.isError || accountQuery.isError) state = 'error';
    else if (balance.isPaused || accountQuery.fetchStatus === 'paused') {
      state = 'waitingForNetwork';
    } else state = 'loading';
  }

  const { available, pending } = balance;
  const amount = parseAmount(form.text);
  const validation = validateWithdrawalAmount(amount, available);
  const canReview = state === 'ready' && available > 0 && amount !== null && validation === null;

  const refetchAll = (): Promise<unknown> =>
    Promise.all([balance.refetch(), accountQuery.refetch()]);

  return {
    state,
    availableLabel: formatMoney(available),
    nothingToWithdraw:
      state === 'ready' && available <= 0
        ? {
            title: 'Nothing to withdraw yet',
            message:
              pending > 0
                ? `${formatMoney(pending)} is held by requests waiting for your admin. Earnings your supervisor approves next can be withdrawn here.`
                : 'Earnings your supervisor approves, and that have not been paid out, can be withdrawn here.',
          }
        : null,
    amountText: form.text,
    changeAmount: (text) => {
      setForm((current) => ({ ...current, text: formatAmountInput(text), hasTyped: true }));
    },
    amountError: form.hasTyped ? validation : null,
    quickAmounts: quickAmountsFor(available).map(({ value, isMax }) => ({
      value,
      label: isMax ? `Max ${formatAmount(value)}` : formatAmount(value),
    })),
    selectQuickAmount: (value) => {
      setForm((current) => ({ ...current, text: formatAmount(value), hasTyped: true }));
    },
    account: account
      ? {
          title: formatAccountLong(account),
          subtitle: account.verified
            ? `${account.accountHolderName} · verified`
            : account.accountHolderName,
        }
      : null,
    canReview,
    review: () => {
      if (!canReview || amount === null) return;
      router.push({ pathname: '/withdraw/review', params: { amount: String(amount) } });
    },
    openPayoutAccount: () => {
      router.push('/withdraw/payout-account');
    },
    openHistory: () => {
      router.push('/withdraw/history');
    },
    syncPill,
    openSyncCenter: () => {
      router.push('/sync');
    },
    loadError: state === 'error' ? toApiError(balance.error ?? accountQuery.error) : null,
    retry: () => {
      void refetchAll();
    },
    isRefreshing: isPullRefreshing,
    refresh: () => {
      setIsPullRefreshing(true);
      void refetchAll().finally(() => {
        setIsPullRefreshing(false);
      });
    },
  };
}
