import { useSalaryQuery } from '@/features/earnings';
import { features } from '@/shared/config/features';

import { paymentToWithdrawal } from '../data/withdrawalMapper';
import { sortWithdrawals } from '../domain/withdrawalRules';
import type { Withdrawal } from '../types';

import { useWithdrawalsQuery } from './useWithdrawalQueries';

export interface WithdrawalHistory {
  /** Newest first. */
  withdrawals: Withdrawal[];
  hasData: boolean;
  isError: boolean;
  error: Error | null;
  isPaused: boolean;
  isRefetchError: boolean;
  refetch: () => Promise<unknown>;
}

/**
 * Every payout. With requests enabled (mock), the request list, whose paid items are the recorded
 * payouts. Against the real backend, the payouts an admin recorded, all paid.
 */
export function useWithdrawalHistory(): WithdrawalHistory {
  const salary = useSalaryQuery();
  const requests = useWithdrawalsQuery();
  const source = features.withdrawalRequests ? requests : salary;
  const withdrawals = features.withdrawalRequests
    ? (requests.data ?? [])
    : (salary.data?.payments ?? []).map(paymentToWithdrawal);
  return {
    withdrawals: sortWithdrawals(withdrawals),
    hasData: source.data !== undefined,
    isError: source.isError,
    error: source.error,
    isPaused: source.fetchStatus === 'paused',
    isRefetchError: source.isRefetchError,
    refetch: source.refetch,
  };
}
