import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { JSX, ReactNode } from 'react';

import type { Salary } from '@/features/earnings';
import { ApiError } from '@/shared/api/apiError';

import {
  ACCOUNT_ID,
  makePayoutAccount,
  makeSalary,
  makeWithdrawal,
} from '../../__fixtures__/withdrawalFixtures';
import { withdrawalsRepository } from '../../data/withdrawalsRepository';
import { useCreateWithdrawal } from '../useWithdrawalQueries';
import { useWithdrawRequestViewModel } from '../useWithdrawRequestViewModel';

const mockFeatures = { passwordReset: false, withdrawalRequests: true, payoutAccount: true };
const mockFetchSalary = jest.fn<Promise<Salary>, []>();

jest.mock('@/shared/config/features', () => ({
  get features() {
    return mockFeatures;
  },
}));
jest.mock('@/features/earnings', () => {
  const { useQuery } =
    jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    useSalaryQuery: () => useQuery({ queryKey: ['earnings', 'salary'], queryFn: mockFetchSalary }),
    invalidateEarnings: () => Promise.resolve(),
  };
});
jest.mock('@/features/submission', () => ({
  useSyncPill: () => ({ status: 'synced', pendingCount: 0, failedCount: 0 }),
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
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../../data/withdrawalsRepository', () => ({
  withdrawalsRepository: {
    fetchWithdrawals: jest.fn(),
    createWithdrawal: jest.fn(),
    fetchPayoutAccount: jest.fn(),
  },
}));

const fetchWithdrawals = jest.mocked(withdrawalsRepository.fetchWithdrawals);
const fetchPayoutAccount = jest.mocked(withdrawalsRepository.fetchPayoutAccount);
const createWithdrawal = jest.mocked(withdrawalsRepository.createWithdrawal);

function useScreen(): {
  viewModel: ReturnType<typeof useWithdrawRequestViewModel>;
  create: ReturnType<typeof useCreateWithdrawal>;
} {
  return { viewModel: useWithdrawRequestViewModel(), create: useCreateWithdrawal() };
}

async function renderViewModel(): Promise<{ current: ReturnType<typeof useScreen> }> {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });
  function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  const { result } = await renderHook(useScreen, { wrapper: Wrapper });
  return result;
}

async function renderReady(): Promise<{ current: ReturnType<typeof useScreen> }> {
  const result = await renderViewModel();
  await waitFor(() => {
    expect(result.current.viewModel.state).toBe('ready');
  });
  return result;
}

describe('useWithdrawRequestViewModel', () => {
  beforeEach(() => {
    mockFeatures.withdrawalRequests = true;
    mockFeatures.payoutAccount = true;
    mockFetchSalary.mockResolvedValue(makeSalary());
    fetchWithdrawals.mockResolvedValue([
      makeWithdrawal({ id: 'paid-1', status: 'paid', amount: 6000 }),
      makeWithdrawal({ id: 'paid-2', status: 'paid', amount: 4000 }),
    ]);
    fetchPayoutAccount.mockResolvedValue(makePayoutAccount());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows the available balance, quick amounts and payout account (E 5.1)', async () => {
    const result = await renderReady();

    expect(result.current.viewModel).toMatchObject({
      availableLabel: 'LKR 15,560',
      nothingToWithdraw: null,
      amountText: '',
      amountError: null,
      canReview: false,
      account: { title: 'Bank of Ceylon ···· 4421', subtitle: 'Kasun Fernando · verified' },
    });
    expect(result.current.viewModel.quickAmounts.map((option) => option.label)).toEqual([
      '5,000',
      '10,000',
      'Max 15,560',
    ]);
  });

  it('holds back requests that are still waiting for the admin', async () => {
    fetchWithdrawals.mockResolvedValue([makeWithdrawal({ status: 'pending', amount: 5000 })]);
    const result = await renderReady();

    expect(result.current.viewModel.availableLabel).toBe('LKR 10,560');
    expect(result.current.viewModel.quickAmounts.map((option) => option.label)).toEqual([
      '5,000',
      '10,000',
      'Max 10,560',
    ]);
  });

  it('waits for the held requests before showing a balance', async () => {
    fetchWithdrawals.mockReturnValue(new Promise(() => undefined));
    const result = await renderViewModel();

    // The salary and the account have loaded; only the requests are missing.
    await waitFor(() => {
      expect(result.current.viewModel.account).not.toBeNull();
    });
    expect(result.current.viewModel.state).toBe('loading');
    expect(result.current.viewModel.canReview).toBe(false);
  });

  it('formats the amount while typing and flags more than the balance (E 5.2)', async () => {
    const result = await renderReady();

    await act(async () => {
      result.current.viewModel.changeAmount('20000');
    });

    expect(result.current.viewModel.amountText).toBe('20,000');
    expect(result.current.viewModel.amountError).toBe(
      'Amount is more than your available balance (LKR 15,560).',
    );
    expect(result.current.viewModel.canReview).toBe(false);

    await act(async () => {
      result.current.viewModel.review();
    });
    expect(router.push).not.toHaveBeenCalled();
  });

  it('asks for an amount once the field has been cleared', async () => {
    const result = await renderReady();

    await act(async () => {
      result.current.viewModel.changeAmount('5');
    });
    await act(async () => {
      result.current.viewModel.changeAmount('');
    });

    expect(result.current.viewModel.amountError).toBe('Enter an amount.');
    expect(result.current.viewModel.canReview).toBe(false);
  });

  it('opens the review with the amount as a parameter', async () => {
    const result = await renderReady();

    await act(async () => {
      result.current.viewModel.changeAmount('10,000');
    });
    expect(result.current.viewModel.amountError).toBeNull();
    expect(result.current.viewModel.canReview).toBe(true);

    await act(async () => {
      result.current.viewModel.review();
    });

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/withdraw/review',
      params: { amount: '10000' },
    });
  });

  it('fills in a quick amount, including the whole balance', async () => {
    const result = await renderReady();

    await act(async () => {
      result.current.viewModel.selectQuickAmount(15560);
    });

    expect(result.current.viewModel.amountText).toBe('15,560');
    expect(result.current.viewModel.canReview).toBe(true);
    await act(async () => {
      result.current.viewModel.review();
    });
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/withdraw/review',
      params: { amount: '15560' },
    });
  });

  it('explains when there is nothing to withdraw', async () => {
    mockFetchSalary.mockResolvedValue(
      makeSalary({
        summary: {
          totalEarned: 10000,
          totalPaid: 10000,
          remainingBalance: 0,
          totalAcceptedGarments: 0,
          currency: 'LKR',
        },
      }),
    );
    const result = await renderReady();

    expect(result.current.viewModel.availableLabel).toBe('LKR 0');
    expect(result.current.viewModel.nothingToWithdraw?.title).toBe('Nothing to withdraw yet');
    expect(result.current.viewModel.quickAmounts).toEqual([]);
    expect(result.current.viewModel.canReview).toBe(false);
  });

  it('shows the load error when the balance cannot load', async () => {
    mockFetchSalary.mockRejectedValue(
      new ApiError({ type: 'server', message: 'Something went wrong on our side.' }),
    );
    const result = await renderViewModel();

    await waitFor(() => {
      expect(result.current.viewModel.state).toBe('error');
    });
    expect(result.current.viewModel.loadError?.message).toBe('Something went wrong on our side.');
  });

  it('offers no request form while the backend takes no requests', async () => {
    mockFeatures.withdrawalRequests = false;
    const result = await renderViewModel();

    await waitFor(() => {
      expect(result.current.viewModel.availableLabel).toBe('LKR 15,560');
      expect(result.current.viewModel.account).not.toBeNull();
    });
    expect(result.current.viewModel.state).toBe('unavailable');
    expect(fetchWithdrawals).not.toHaveBeenCalled();
  });

  it('clears the amount once a request has been sent', async () => {
    const created = makeWithdrawal({ id: 'new', status: 'pending', amount: 10000 });
    createWithdrawal.mockResolvedValue(created);
    const result = await renderReady();
    await act(async () => {
      result.current.viewModel.changeAmount('10000');
    });

    await act(async () => {
      await result.current.create.mutateAsync({ amount: 10000, payoutAccountId: ACCOUNT_ID });
    });

    expect(result.current.viewModel.amountText).toBe('');
    expect(result.current.viewModel.amountError).toBeNull();
  });
});
