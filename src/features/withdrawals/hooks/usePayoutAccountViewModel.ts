import { router } from 'expo-router';

import { useSyncPill, type SyncPillState } from '@/features/submission';
import { toApiError, type ApiError } from '@/shared/api/apiError';
import { features } from '@/shared/config/features';

import { maskAccountNumber } from '../domain/withdrawalRules';

import { usePayoutAccountQuery } from './useWithdrawalQueries';

/** unavailable: the backend has no payout account yet (payouts are arranged by the admin). */
export type PayoutAccountState =
  'unavailable' | 'loading' | 'waitingForNetwork' | 'error' | 'ready';

export interface PayoutAccountViewModel {
  state: PayoutAccountState;
  account: {
    bankName: string;
    /** "Biyagama branch". */
    branch: string | null;
    verified: boolean;
    rows: { label: string; value: string }[];
  } | null;
  syncPill: SyncPillState;
  openSyncCenter: () => void;
  goBack: () => void;
  loadError: ApiError | null;
  retry: () => void;
}

/** The payout account, read-only: the admin changes it (not designed; E 5.1 "Payout to"). */
export function usePayoutAccountViewModel(): PayoutAccountViewModel {
  const query = usePayoutAccountQuery();
  const syncPill = useSyncPill();
  const account = query.data;

  let state: PayoutAccountState = 'ready';
  if (!features.payoutAccount) state = 'unavailable';
  else if (!account) {
    if (query.isError) state = 'error';
    else if (query.fetchStatus === 'paused') state = 'waitingForNetwork';
    else state = 'loading';
  }

  return {
    state,
    account:
      state === 'ready' && account
        ? {
            bankName: account.bankName,
            branch: account.branchName ? `${account.branchName} branch` : null,
            verified: account.verified,
            rows: [
              { label: 'Account holder', value: account.accountHolderName },
              { label: 'Account number', value: maskAccountNumber(account.last4) },
            ],
          }
        : null,
    syncPill,
    openSyncCenter: () => {
      router.push('/sync');
    },
    goBack: () => {
      if (router.canGoBack()) router.back();
      else router.replace('/withdraw');
    },
    loadError: state === 'error' ? toApiError(query.error) : null,
    retry: () => {
      void query.refetch();
    },
  };
}
