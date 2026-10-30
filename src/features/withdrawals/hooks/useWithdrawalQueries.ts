import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { invalidateEarnings } from '@/features/earnings';
import { features } from '@/shared/config/features';
import { logger } from '@/shared/lib/logger';

import { withdrawalKeys, withdrawalMutationKeys } from '../data/queryKeys';
import { withdrawalsRepository } from '../data/withdrawalsRepository';
import type { PayoutAccount, Withdrawal } from '../types';

const WITHDRAWALS_STALE_TIME_MS = 60 * 1000;
const ACCOUNT_STALE_TIME_MS = 10 * 60 * 1000;

/** Payout requests. Disabled (never fetched) while the backend has no endpoint. */
export function useWithdrawalsQuery(): UseQueryResult<Withdrawal[], Error> {
  return useQuery({
    queryKey: withdrawalKeys.list(),
    queryFn: ({ signal }) => withdrawalsRepository.fetchWithdrawals(signal),
    staleTime: WITHDRAWALS_STALE_TIME_MS,
    enabled: features.withdrawalRequests,
  });
}

/** The payout account. Disabled (never fetched) while the backend has no endpoint. */
export function usePayoutAccountQuery(): UseQueryResult<PayoutAccount, Error> {
  return useQuery({
    queryKey: withdrawalKeys.payoutAccount(),
    queryFn: ({ signal }) => withdrawalsRepository.fetchPayoutAccount(signal),
    staleTime: ACCOUNT_STALE_TIME_MS,
    enabled: features.payoutAccount,
  });
}

export interface CreateWithdrawalVariables {
  amount: number;
  payoutAccountId: string;
}

/**
 * Sends a payout request. Online only: money requests are never queued on the device. On success
 * the new request joins the cached list at once, then the list and the salary are refetched.
 */
export function useCreateWithdrawal(): UseMutationResult<
  Withdrawal,
  Error,
  CreateWithdrawalVariables
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: withdrawalMutationKeys.create,
    mutationFn: ({ amount, payoutAccountId }) =>
      withdrawalsRepository.createWithdrawal(amount, payoutAccountId),
    // The default ('online') pauses an offline mutation and sends it when the network returns,
    // which would queue a money request. Fail at once with the offline message instead.
    networkMode: 'always',
    onSuccess: (created) => {
      logger.breadcrumb('withdrawal_requested');
      queryClient.setQueryData<Withdrawal[]>(withdrawalKeys.list(), (current) =>
        current ? [created, ...current.filter((item) => item.id !== created.id)] : [created],
      );
      void queryClient.invalidateQueries({ queryKey: withdrawalKeys.list() });
      void invalidateEarnings(queryClient);
    },
  });
}
