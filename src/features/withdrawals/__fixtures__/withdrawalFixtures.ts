import type { Salary, SalaryPayment } from '@/features/earnings';

import type { PayoutAccountDto, WithdrawalDto } from '../data/dto';
import type { PayoutAccount, Withdrawal } from '../types';

export const ACCOUNT_ID = 'acc0b0c0-4421-4000-8000-000000004421';

/** A payout request with sensible defaults for tests; override what the test is about. */
export function makeWithdrawal(overrides: Partial<Withdrawal> = {}): Withdrawal {
  return {
    id: 'wd-31',
    reference: 'WD-2026-0031',
    amount: 10000,
    status: 'pending',
    date: '2026-10-09',
    accountLabel: 'BOC ···· 4421',
    rejectionReason: null,
    ...overrides,
  };
}

export function makeWithdrawalDto(overrides: Partial<WithdrawalDto> = {}): WithdrawalDto {
  return {
    id: 'wd000000-0000-4000-8000-000000000031',
    referenceNumber: 'WD-2026-0031',
    amount: 10000,
    currency: 'LKR',
    status: 'PENDING',
    requestedAt: '2026-10-09T10:15:00.000Z',
    decidedAt: null,
    rejectionReason: null,
    payoutAccount: { bankName: 'Bank of Ceylon', bankCode: 'BOC', accountNumberLast4: '4421' },
    ...overrides,
  };
}

export function makePayoutAccount(overrides: Partial<PayoutAccount> = {}): PayoutAccount {
  return {
    id: ACCOUNT_ID,
    bankName: 'Bank of Ceylon',
    bankCode: 'BOC',
    branchName: 'Biyagama',
    accountHolderName: 'Kasun Fernando',
    last4: '4421',
    verified: true,
    ...overrides,
  };
}

export function makePayoutAccountDto(overrides: Partial<PayoutAccountDto> = {}): PayoutAccountDto {
  return {
    id: ACCOUNT_ID,
    bankName: 'Bank of Ceylon',
    bankCode: 'BOC',
    branchName: 'Biyagama',
    accountHolderName: 'Kasun Fernando',
    accountNumberLast4: '4421',
    verified: true,
    ...overrides,
  };
}

export function makeSalaryPayment(overrides: Partial<SalaryPayment> = {}): SalaryPayment {
  return {
    id: 'pay-27',
    paymentNumber: 'SAL-2026-0027',
    amount: 6000,
    method: 'BANK_TRANSFER',
    paidAt: '2026-09-28T09:30:00.000Z',
    referenceNumber: 'BOC-TRX-88213',
    notes: null,
    ...overrides,
  };
}

/** The designs' numbers: approved 25,560, withdrawn 10,000, so 15,560 is left (E 2.1, E 5.1). */
export function makeSalary(overrides: Partial<Salary> = {}): Salary {
  return {
    summary: {
      totalEarned: 25560,
      totalPaid: 10000,
      remainingBalance: 15560,
      totalAcceptedGarments: 1296,
      currency: 'LKR',
    },
    approved: [],
    payments: [
      makeSalaryPayment(),
      makeSalaryPayment({
        id: 'pay-19',
        paymentNumber: 'SAL-2026-0019',
        amount: 4000,
        paidAt: '2026-09-15T09:30:00.000Z',
      }),
    ],
    ...overrides,
  };
}
