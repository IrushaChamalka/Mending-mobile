import type { CalendarDate } from '@/shared/utils/date';

/** The bank account payouts go to. */
export interface PayoutAccount {
  id: string;
  bankName: string;
  /** e.g. "BOC". */
  bankCode: string;
  branchName: string | null;
  accountHolderName: string;
  last4: string;
  verified: boolean;
}

export type WithdrawalStatus = 'pending' | 'paid' | 'rejected';

/** A payout: a request the employee made (mock only today) or a payment an admin recorded. */
export interface Withdrawal {
  id: string;
  /** "WD-2026-0031" for requests, the payment number for recorded payouts. */
  reference: string;
  amount: number;
  status: WithdrawalStatus;
  /** The day it was requested or paid. */
  date: CalendarDate;
  /** "BOC ···· 4421", or how an admin paid ("Bank transfer"). */
  accountLabel: string;
  rejectionReason: string | null;
}
