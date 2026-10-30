import { formatMoney, roundToCents } from '@/shared/utils/number';

import type { PayoutAccount, Withdrawal, WithdrawalStatus } from '../types';

/** "···· 4421": the account number as the app may show it. */
export function maskAccountNumber(last4: string): string {
  return `···· ${last4}`;
}

/** "BOC ···· 4421" (E 5.3 Payout account, E 5.4). */
export function formatAccountShort(account: Pick<PayoutAccount, 'bankCode' | 'last4'>): string {
  return `${account.bankCode} ···· ${account.last4}`;
}

/** "Bank of Ceylon ···· 4421" (E 5.1 Payout to). */
export function formatAccountLong(account: Pick<PayoutAccount, 'bankName' | 'last4'>): string {
  return `${account.bankName} ···· ${account.last4}`;
}

/** Requests waiting for the admin hold their amount (E 5.3 "This amount is held…"). */
export function pendingTotal(withdrawals: readonly Withdrawal[]): number {
  return roundToCents(
    withdrawals
      .filter((withdrawal) => withdrawal.status === 'pending')
      .reduce((sum, withdrawal) => sum + withdrawal.amount, 0),
  );
}

export function paidTotal(withdrawals: readonly Withdrawal[]): number {
  return roundToCents(
    withdrawals
      .filter((withdrawal) => withdrawal.status === 'paid')
      .reduce((sum, withdrawal) => sum + withdrawal.amount, 0),
  );
}

/**
 * What can be requested now: approved earnings not yet paid (the backend's remainingBalance) minus
 * requests still waiting for the admin.
 */
export function availableToWithdraw(remainingBalance: number, pending: number): number {
  return Math.max(0, roundToCents(remainingBalance - pending));
}

/** What stays available once this request is held (E 5.3 "Balance after"). */
export function balanceAfterWithdrawal(available: number, amount: number): number {
  return Math.max(0, roundToCents(available - amount - WITHDRAWAL_FEE));
}

/** The message under the amount field, or null when the amount can be requested (E 5.2). */
export function validateWithdrawalAmount(amount: number | null, available: number): string | null {
  if (amount === null) return 'Enter an amount.';
  if (amount <= 0) return 'Enter an amount above zero.';
  if (amount > available) {
    return `Amount is more than your available balance (${formatMoney(available)}).`;
  }
  return null;
}

/** The designed quick amounts (5,000 and 10,000), the ones that fit the balance. */
const QUICK_AMOUNTS: readonly number[] = [5000, 10000];

export interface QuickAmount {
  value: number;
  isMax: boolean;
}

/** "5,000", "10,000", "Max 15,560" (E 5.1). Max only when there is something to withdraw. */
export function quickAmountsFor(available: number): QuickAmount[] {
  if (available <= 0) return [];
  return [
    ...QUICK_AMOUNTS.filter((value) => value < available).map((value) => ({
      value,
      isMax: false,
    })),
    { value: available, isMax: true },
  ];
}

/** Payouts carry no fee today; the designs show "LKR 0". */
export const WITHDRAWAL_FEE = 0;

/** What the admin promises (E 5.1 info banner, E 5.3 Processing). */
export const PROCESSING_TIME_LABEL = 'Within 2 working days';

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  rejected: 'Rejected',
};

export type WithdrawalFilter = 'all' | WithdrawalStatus;

export const WITHDRAWAL_FILTERS: readonly WithdrawalFilter[] = [
  'all',
  'pending',
  'paid',
  'rejected',
];

export const WITHDRAWAL_FILTER_LABELS: Record<WithdrawalFilter, string> = {
  all: 'All',
  pending: 'Pending',
  paid: 'Paid',
  rejected: 'Rejected',
};

export function matchesWithdrawalFilter(withdrawal: Withdrawal, filter: WithdrawalFilter): boolean {
  return filter === 'all' || withdrawal.status === filter;
}

/** "WD-2026-0031" → "WD-0031" for the narrow table column (E 5.5); other formats stay as they are. */
export function formatShortReference(reference: string): string {
  return reference.replace(/^([A-Za-z]+)-\d{4}-(\d+)$/, '$1-$2');
}

/** Newest first. */
export function sortWithdrawals(withdrawals: readonly Withdrawal[]): Withdrawal[] {
  return [...withdrawals].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
}
