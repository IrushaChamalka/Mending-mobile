import { useSalaryQuery } from '@/features/earnings';
import { features } from '@/shared/config/features';

import { availableToWithdraw, pendingTotal } from '../domain/withdrawalRules';

import { useWithdrawalsQuery } from './useWithdrawalQueries';

export interface WithdrawableBalance {
  /** What can be requested now: unpaid approved earnings minus held requests. */
  available: number;
  /** Approved earnings, all time. */
  approved: number;
  /** Paid out, all time. */
  withdrawn: number;
  /** Held by requests waiting for the admin (always 0 against the real backend today). */
  pending: number;
  /**
   * True once the salary has loaded (or was restored from the cache) and, with requests on, the
   * requests too: until then `available` would still include the held amounts.
   */
  hasData: boolean;
  isError: boolean;
  /** The first failed source, for the error message. */
  error: Error | null;
  /** Waiting for the network with nothing cached. */
  isPaused: boolean;
  refetch: () => Promise<unknown>;
}

/** The balance Home, Earnings and Withdraw all show (E 2.1, E 4.1, E 5.1), from one place. */
export function useWithdrawableBalance(): WithdrawableBalance {
  const salary = useSalaryQuery();
  const withdrawals = useWithdrawalsQuery();
  const sources = features.withdrawalRequests ? [salary, withdrawals] : [salary];
  const summary = salary.data?.summary;
  const pending = features.withdrawalRequests ? pendingTotal(withdrawals.data ?? []) : 0;
  return {
    available: summary ? availableToWithdraw(summary.remainingBalance, pending) : 0,
    approved: summary?.totalEarned ?? 0,
    withdrawn: summary?.totalPaid ?? 0,
    pending,
    hasData: sources.every((query) => query.data !== undefined),
    isError: sources.some((query) => query.isError),
    error: sources.find((query) => query.error !== null)?.error ?? null,
    isPaused: sources.some((query) => query.fetchStatus === 'paused'),
    refetch: () =>
      Promise.all([salary.refetch(), features.withdrawalRequests ? withdrawals.refetch() : null]),
  };
}
