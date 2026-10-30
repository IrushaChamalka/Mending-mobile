/**
 * Mock withdrawals api for EXPO_PUBLIC_USE_MOCK_API=true, standing in for endpoints the backend
 * does not have yet. The paid requests match the mock salary's two recorded payouts, and new
 * requests stay pending. State lives in memory and resets when the app restarts.
 */
import { getMockAccount, getSessionUser } from '@/features/auth';
import { endpoints } from '@/shared/api/endpoints';
import { mockApiError, mockDelay } from '@/shared/api/mock';
import { shiftCalendarDate, todayCalendarDate } from '@/shared/utils/date';

import type { PayoutAccountDto, WithdrawalDto } from '../data/dto';

import type { WithdrawalsApi } from './withdrawalsApi';

const MOCK_ACCOUNT_ID = 'acc0b0c0-4421-4000-8000-000000004421';
const FIRST_NEW_REFERENCE = 31;

function dayIso(daysFromToday: number, time = '10:15:00'): string {
  return `${shiftCalendarDate(todayCalendarDate(), daysFromToday)}T${time}.000Z`;
}

function mockAccount(): PayoutAccountDto {
  const user = getSessionUser();
  const name = user?.employeeId ? getMockAccount(user.employeeId)?.name : undefined;
  return {
    id: MOCK_ACCOUNT_ID,
    bankName: 'Bank of Ceylon',
    bankCode: 'BOC',
    branchName: 'Biyagama',
    accountHolderName: name ?? 'Kasun Fernando',
    accountNumberLast4: '4421',
    verified: true,
  };
}

const accountSummary = { bankName: 'Bank of Ceylon', bankCode: 'BOC', accountNumberLast4: '4421' };

function seedWithdrawals(): WithdrawalDto[] {
  return [
    {
      id: 'wd000000-0000-4000-8000-000000000027',
      referenceNumber: 'WD-2026-0027',
      amount: 6000,
      currency: 'LKR',
      status: 'PAID',
      requestedAt: dayIso(-14),
      decidedAt: dayIso(-12),
      rejectionReason: null,
      payoutAccount: accountSummary,
    },
    {
      id: 'wd000000-0000-4000-8000-000000000019',
      referenceNumber: 'WD-2026-0019',
      amount: 4000,
      currency: 'LKR',
      status: 'PAID',
      requestedAt: dayIso(-27),
      decidedAt: dayIso(-25),
      rejectionReason: null,
      payoutAccount: accountSummary,
    },
    {
      id: 'wd000000-0000-4000-8000-000000000012',
      referenceNumber: 'WD-2026-0012',
      amount: 12000,
      currency: 'LKR',
      status: 'REJECTED',
      requestedAt: dayIso(-40),
      decidedAt: dayIso(-39),
      rejectionReason: 'More than the approved balance at the time.',
      payoutAccount: accountSummary,
    },
  ];
}

let withdrawals: WithdrawalDto[] | null = null;
let nextReference = FIRST_NEW_REFERENCE;

function store(): WithdrawalDto[] {
  withdrawals ??= seedWithdrawals();
  return withdrawals;
}

export const mockWithdrawalsApi: WithdrawalsApi = {
  async listWithdrawals() {
    await mockDelay();
    return {
      withdrawals: store().map((item) => ({ ...item, payoutAccount: { ...item.payoutAccount } })),
    };
  },

  async createWithdrawal(request) {
    await mockDelay();
    const url = endpoints.proposed.withdrawals;
    if (!(request.amount > 0)) {
      throw mockApiError(400, ['Amount must be greater than zero'], { method: 'POST', url });
    }
    if (request.payoutAccountId !== MOCK_ACCOUNT_ID) {
      throw mockApiError(404, 'Payout account not found', { method: 'POST', url });
    }
    const number = nextReference;
    nextReference += 1;
    const created: WithdrawalDto = {
      // Like the seeded requests, the id ends with the reference number.
      id: `wd000000-0000-4000-8000-${String(number).padStart(12, '0')}`,
      referenceNumber: `WD-${todayCalendarDate().slice(0, 4)}-${String(number).padStart(4, '0')}`,
      amount: request.amount,
      currency: 'LKR',
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      decidedAt: null,
      rejectionReason: null,
      payoutAccount: accountSummary,
    };
    store().unshift(created);
    return created;
  },

  async getPayoutAccount() {
    await mockDelay();
    return mockAccount();
  },
};

/** Tests only: forget created requests. */
export function resetMockWithdrawals(): void {
  withdrawals = null;
  nextReference = FIRST_NEW_REFERENCE;
}
