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
import { useWithdrawalReviewViewModel } from '../useWithdrawalReviewViewModel';

const mockFeatures = { passwordReset: false, withdrawalRequests: true, payoutAccount: true };
const mockNetwork = { isOnline: true };
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
jest.mock('@/shared/hooks/useIsOnline', () => ({ useIsOnline: () => mockNetwork.isOnline }));
jest.mock('@/shared/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    breadcrumb: jest.fn(),
  },
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) },
  useFocusEffect: jest.fn(),
}));
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

type ViewModel = ReturnType<typeof useWithdrawalReviewViewModel>;

interface Rendered {
  result: { current: ViewModel };
  client: QueryClient;
}

async function renderLoaded(amount: string | undefined): Promise<Rendered> {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });
  function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  const { result } = await renderHook(() => useWithdrawalReviewViewModel(amount), {
    wrapper: Wrapper,
  });
  await waitFor(() => {
    expect(['ready', 'invalid']).toContain(result.current.state);
    expect(client.isFetching()).toBe(0);
  });
  return { result, client };
}

/** Lets the refetches a sent request starts finish inside act. */
async function settle(client: QueryClient): Promise<void> {
  await waitFor(() => {
    expect(client.isFetching()).toBe(0);
  });
}

describe('useWithdrawalReviewViewModel', () => {
  beforeEach(() => {
    mockFeatures.withdrawalRequests = true;
    mockNetwork.isOnline = true;
    mockFetchSalary.mockResolvedValue(makeSalary());
    fetchWithdrawals.mockResolvedValue([]);
    fetchPayoutAccount.mockResolvedValue(makePayoutAccount());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows the request as designed (E 5.3)', async () => {
    const { result } = await renderLoaded('10000');

    expect(result.current.state).toBe('ready');
    expect(result.current.amountLabel).toBe('LKR 10,000');
    expect(result.current.rows).toEqual([
      { label: 'Payout account', value: 'BOC ···· 4421' },
      { label: 'Fee', value: 'LKR 0' },
      { label: 'Balance after', value: 'LKR 5,560' },
      { label: 'Processing', value: 'Within 2 working days' },
    ]);
    expect(result.current.canSubmit).toBe(true);
  });

  it('checks the amount again: a link cannot ask for more than the balance', async () => {
    const { result } = await renderLoaded('20000');

    expect(result.current.state).toBe('invalid');
    expect(result.current.invalidReason).toBe(
      'Amount is more than your available balance (LKR 15,560).',
    );
    expect(result.current.canSubmit).toBe(false);

    await act(async () => {
      result.current.submit();
    });
    expect(createWithdrawal).not.toHaveBeenCalled();
  });

  it('counts requests that are still pending against the balance', async () => {
    fetchWithdrawals.mockResolvedValue([makeWithdrawal({ status: 'pending', amount: 10000 })]);
    const { result } = await renderLoaded('10000');

    expect(result.current.state).toBe('invalid');
    expect(result.current.invalidReason).toBe(
      'Amount is more than your available balance (LKR 5,560).',
    );
  });

  it('refuses a missing or malformed amount', async () => {
    expect((await renderLoaded(undefined)).result.current.invalidReason).toBe('Enter an amount.');
    expect((await renderLoaded('ten')).result.current.invalidReason).toBe('Enter an amount.');
    expect((await renderLoaded('0')).result.current.invalidReason).toBe(
      'Enter an amount above zero.',
    );
  });

  it('sends the request and replaces the review with "Request sent"', async () => {
    createWithdrawal.mockResolvedValue(makeWithdrawal({ id: 'wd-new', amount: 10000 }));
    const { result, client } = await renderLoaded('10000');

    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith({
        pathname: '/withdraw/sent',
        params: { id: 'wd-new' },
      });
    });
    expect(createWithdrawal).toHaveBeenCalledWith(10000, ACCOUNT_ID);
    // The held request now lowers the balance, but the sent screen must not flash "invalid".
    expect(result.current.state).toBe('ready');
    expect(result.current.canLeave).toBe(false);
    await settle(client);
  });

  it('never sends a request while offline, and says why', async () => {
    mockNetwork.isOnline = false;
    const { result } = await renderLoaded('10000');

    expect(result.current.isOnline).toBe(false);
    expect(result.current.canSubmit).toBe(false);
    await act(async () => {
      result.current.submit();
    });
    expect(createWithdrawal).not.toHaveBeenCalled();
  });

  it('shows why the server refused, and stays on the review', async () => {
    createWithdrawal.mockRejectedValue(
      new ApiError({ type: 'validation', message: 'Amount is more than the approved balance.' }),
    );
    const { result, client } = await renderLoaded('10000');

    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.submitError).toBe('Amount is more than the approved balance.');
    });
    expect(router.replace).not.toHaveBeenCalled();
    expect(result.current.canLeave).toBe(true);
    // A refused amount re-checks the balance.
    await waitFor(() => {
      expect(mockFetchSalary).toHaveBeenCalledTimes(2);
    });
    await settle(client);
  });

  it('goes back to the amount with "Edit amount"', async () => {
    const { result } = await renderLoaded('10000');

    await act(async () => {
      result.current.editAmount();
    });

    expect(router.back).toHaveBeenCalled();
  });

  it('offers nothing to send while the backend takes no requests', async () => {
    mockFeatures.withdrawalRequests = false;
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    function Wrapper({ children }: { children: ReactNode }): JSX.Element {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    }
    const { result } = await renderHook(() => useWithdrawalReviewViewModel('10000'), {
      wrapper: Wrapper,
    });
    await settle(client);

    expect(result.current.state).toBe('unavailable');
    expect(result.current.canSubmit).toBe(false);
  });
});
