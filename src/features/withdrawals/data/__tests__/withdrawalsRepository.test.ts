import { ApiError } from '@/shared/api/apiError';

import {
  ACCOUNT_ID,
  makePayoutAccountDto,
  makeWithdrawalDto,
} from '../../__fixtures__/withdrawalFixtures';
import { withdrawalsApi } from '../../api';
import { withdrawalsRepository } from '../withdrawalsRepository';

jest.mock('../../api', () => ({
  withdrawalsApi: {
    listWithdrawals: jest.fn(),
    createWithdrawal: jest.fn(),
    getPayoutAccount: jest.fn(),
  },
}));
jest.mock('@/shared/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    breadcrumb: jest.fn(),
  },
}));

const listWithdrawals = jest.mocked(withdrawalsApi.listWithdrawals);
const createWithdrawal = jest.mocked(withdrawalsApi.createWithdrawal);
const getPayoutAccount = jest.mocked(withdrawalsApi.getPayoutAccount);

describe('withdrawalsRepository', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('lists the requests as app models', async () => {
    listWithdrawals.mockResolvedValue({
      withdrawals: [makeWithdrawalDto(), makeWithdrawalDto({ id: 'wd-27', status: 'PAID' })],
    });

    const withdrawals = await withdrawalsRepository.fetchWithdrawals();

    expect(withdrawals.map((item) => [item.id, item.status])).toEqual([
      ['wd000000-0000-4000-8000-000000000031', 'pending'],
      ['wd-27', 'paid'],
    ]);
  });

  it('drops a row that breaks the contract instead of failing the whole list', async () => {
    listWithdrawals.mockResolvedValue({
      withdrawals: [
        makeWithdrawalDto(),
        { ...makeWithdrawalDto({ id: 'odd' }), status: 'ON_HOLD' },
      ],
    });

    await expect(withdrawalsRepository.fetchWithdrawals()).resolves.toHaveLength(1);
  });

  it('fails with a server error when the list itself breaks the contract', async () => {
    listWithdrawals.mockResolvedValue({ items: [] });

    await expect(withdrawalsRepository.fetchWithdrawals()).rejects.toBeInstanceOf(ApiError);
  });

  it('sends the amount and the account, and returns the new request', async () => {
    createWithdrawal.mockResolvedValue(makeWithdrawalDto({ amount: 7500 }));

    const created = await withdrawalsRepository.createWithdrawal(7500, ACCOUNT_ID);

    expect(createWithdrawal).toHaveBeenCalledWith({ amount: 7500, payoutAccountId: ACCOUNT_ID });
    expect(created).toMatchObject({ amount: 7500, status: 'pending', reference: 'WD-2026-0031' });
  });

  it('passes the api error of a refused request through', async () => {
    const refused = new ApiError({ type: 'validation', message: 'Amount is too high.' });
    createWithdrawal.mockRejectedValue(refused);

    await expect(withdrawalsRepository.createWithdrawal(99999, ACCOUNT_ID)).rejects.toBe(refused);
  });

  it('reads the payout account', async () => {
    getPayoutAccount.mockResolvedValue(makePayoutAccountDto({ branchName: null }));

    await expect(withdrawalsRepository.fetchPayoutAccount()).resolves.toMatchObject({
      id: ACCOUNT_ID,
      last4: '4421',
      branchName: null,
    });
  });
});
