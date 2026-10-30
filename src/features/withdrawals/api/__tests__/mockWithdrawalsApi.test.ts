import { todayCalendarDate } from '@/shared/utils/date';
import { settleWithTimers } from '@/test-utils/timers';

import { payoutAccountSchema, withdrawalListSchema, withdrawalSchema } from '../../data/dto';
import { mockWithdrawalsApi, resetMockWithdrawals } from '../mockWithdrawalsApi';

jest.mock('@/features/auth', () => ({
  getSessionUser: () => null,
  getMockAccount: () => undefined,
}));

async function listRequests(): Promise<{ id: string; referenceNumber: string; status: string }[]> {
  const payload = await settleWithTimers(mockWithdrawalsApi.listWithdrawals());
  return withdrawalListSchema
    .parse(payload)
    .withdrawals.map((item) => withdrawalSchema.parse(item));
}

async function accountId(): Promise<string> {
  const payload = await settleWithTimers(mockWithdrawalsApi.getPayoutAccount());
  return payoutAccountSchema.parse(payload).id;
}

beforeEach(() => {
  jest.useFakeTimers();
  resetMockWithdrawals();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('mockWithdrawalsApi', () => {
  it('serves backend-shaped requests: two paid and one rejected', async () => {
    const statuses = (await listRequests()).map((item) => item.status);
    expect(statuses).toEqual(['PAID', 'PAID', 'REJECTED']);
  });

  it('serves a verified payout account', async () => {
    const payload = await settleWithTimers(mockWithdrawalsApi.getPayoutAccount());
    expect(payoutAccountSchema.parse(payload)).toMatchObject({
      bankName: 'Bank of Ceylon',
      bankCode: 'BOC',
      accountNumberLast4: '4421',
      accountHolderName: 'Kasun Fernando',
      verified: true,
    });
  });

  it('creates a pending request with the next reference and lists it first', async () => {
    const year = todayCalendarDate().slice(0, 4);
    const payoutAccountId = await accountId();

    const created = withdrawalSchema.parse(
      await settleWithTimers(
        mockWithdrawalsApi.createWithdrawal({ amount: 10000, payoutAccountId }),
      ),
    );

    expect(created).toMatchObject({
      referenceNumber: `WD-${year}-0031`,
      amount: 10000,
      status: 'PENDING',
      payoutAccount: { bankCode: 'BOC', accountNumberLast4: '4421' },
    });
    expect(created.id.endsWith('000000000031')).toBe(true);
    const listed = await listRequests();
    expect(listed[0]).toMatchObject({ id: created.id, status: 'PENDING' });
    expect(listed).toHaveLength(4);

    const next = withdrawalSchema.parse(
      await settleWithTimers(mockWithdrawalsApi.createWithdrawal({ amount: 500, payoutAccountId })),
    );
    expect(next.referenceNumber).toBe(`WD-${year}-0032`);
    expect(next.id).not.toBe(created.id);
  });

  it('refuses an amount of zero like the backend would', async () => {
    await expect(
      settleWithTimers(
        mockWithdrawalsApi.createWithdrawal({ amount: 0, payoutAccountId: await accountId() }),
      ),
    ).rejects.toMatchObject({ type: 'validation', status: 400 });
    expect(await listRequests()).toHaveLength(3);
  });

  it('answers 404 for an unknown payout account', async () => {
    await expect(
      settleWithTimers(mockWithdrawalsApi.createWithdrawal({ amount: 100, payoutAccountId: 'x' })),
    ).rejects.toMatchObject({ type: 'notFound' });
  });

  it('starts again from the seeded requests after a reset', async () => {
    await settleWithTimers(
      mockWithdrawalsApi.createWithdrawal({ amount: 100, payoutAccountId: await accountId() }),
    );
    resetMockWithdrawals();

    expect(await listRequests()).toHaveLength(3);
  });
});
