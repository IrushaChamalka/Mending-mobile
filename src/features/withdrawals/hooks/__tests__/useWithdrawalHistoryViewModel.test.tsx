import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { JSX, ReactNode } from 'react';

import type { Salary } from '@/features/earnings';

import { makeSalary, makeWithdrawal } from '../../__fixtures__/withdrawalFixtures';
import { withdrawalsRepository } from '../../data/withdrawalsRepository';
import { useWithdrawalHistoryViewModel } from '../useWithdrawalHistoryViewModel';

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
jest.mock('@/shared/hooks/useIsOnline', () => ({ useIsOnline: () => true }));
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
}));
jest.mock('../../data/withdrawalsRepository', () => ({
  withdrawalsRepository: {
    fetchWithdrawals: jest.fn(),
    createWithdrawal: jest.fn(),
    fetchPayoutAccount: jest.fn(),
  },
}));

const fetchWithdrawals = jest.mocked(withdrawalsRepository.fetchWithdrawals);

type ViewModel = ReturnType<typeof useWithdrawalHistoryViewModel>;

async function renderReady(isTabRoot = false): Promise<{ current: ViewModel }> {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  const { result } = await renderHook(() => useWithdrawalHistoryViewModel({ isTabRoot }), {
    wrapper: Wrapper,
  });
  // Both queries settle, so no update lands after the test.
  await waitFor(() => {
    expect(result.current.state).toBe('ready');
    expect(client.isFetching()).toBe(0);
  });
  return result;
}

describe('useWithdrawalHistoryViewModel', () => {
  beforeEach(() => {
    mockFeatures.withdrawalRequests = true;
    mockFetchSalary.mockResolvedValue(makeSalary());
    // Out of order on purpose: the screen lists newest first.
    fetchWithdrawals.mockResolvedValue([
      makeWithdrawal({
        id: 'wd-27',
        reference: 'WD-2026-0027',
        status: 'paid',
        amount: 6000,
        date: '2026-09-28',
      }),
      makeWithdrawal({
        id: 'wd-31',
        reference: 'WD-2026-0031',
        status: 'pending',
        amount: 10000,
        date: '2026-10-09',
      }),
      makeWithdrawal({
        id: 'wd-12',
        reference: 'WD-2026-0012',
        status: 'rejected',
        amount: 12000,
        date: '2026-09-02',
      }),
      makeWithdrawal({
        id: 'wd-19',
        reference: 'WD-2026-0019',
        status: 'paid',
        amount: 4000,
        date: '2026-09-15',
      }),
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists every request newest first, formatted for the table (E 5.5)', async () => {
    const result = await renderReady();

    expect(result.current.subtitle).toBe('Your payout requests');
    expect(result.current.rows.map((row) => row.id)).toEqual(['wd-31', 'wd-27', 'wd-19', 'wd-12']);
    expect(result.current.rows[0]).toEqual({
      id: 'wd-31',
      dateLabel: '9 Oct',
      reference: 'WD-0031',
      accountLabel: 'BOC ···· 4421',
      amountLabel: '10,000',
      status: 'pending',
      statusLabel: 'Pending',
      isLast: false,
    });
    expect(result.current.rows.map((row) => row.isLast)).toEqual([false, false, false, true]);
  });

  it('totals what was paid and what is still pending', async () => {
    const result = await renderReady();

    expect(result.current.withdrawnLabel).toBe('LKR 10,000');
    expect(result.current.pendingLabel).toBe('LKR 10,000');
  });

  it('filters by status, and the last visible row closes the table', async () => {
    const result = await renderReady();
    expect(result.current.filterOptions.map((option) => option.label)).toEqual([
      'All',
      'Pending',
      'Paid',
      'Rejected',
    ]);

    await act(async () => {
      result.current.selectFilter('paid');
    });

    expect(result.current.selectedFilter).toBe('paid');
    expect(result.current.rows.map((row) => [row.id, row.isLast])).toEqual([
      ['wd-27', false],
      ['wd-19', true],
    ]);
    // The totals cover every payout, whatever the filter.
    expect(result.current.pendingLabel).toBe('LKR 10,000');

    await act(async () => {
      result.current.selectFilter('rejected');
    });
    expect(result.current.rows.map((row) => row.statusLabel)).toEqual(['Rejected']);
  });

  it('says so when a filter matches nothing', async () => {
    fetchWithdrawals.mockResolvedValue([makeWithdrawal({ status: 'paid' })]);
    const result = await renderReady();

    await act(async () => {
      result.current.selectFilter('rejected');
    });

    expect(result.current.rows).toEqual([]);
    expect(result.current.emptyMessage).toBe('No rejected withdrawals.');
  });

  it('shows the payouts an admin recorded while the backend takes no requests', async () => {
    mockFeatures.withdrawalRequests = false;
    const result = await renderReady();

    expect(fetchWithdrawals).not.toHaveBeenCalled();
    expect(
      result.current.rows.map((row) => [row.reference, row.accountLabel, row.statusLabel]),
    ).toEqual([
      ['SAL-0027', 'Bank transfer', 'Paid'],
      ['SAL-0019', 'Bank transfer', 'Paid'],
    ]);
    expect(result.current.withdrawnLabel).toBe('LKR 10,000');
    expect(result.current.pendingLabel).toBe('LKR 0');

    await act(async () => {
      result.current.selectFilter('pending');
    });
    expect(result.current.rows).toEqual([]);
    expect(result.current.emptyMessage).toBe('No pending withdrawals.');
  });

  it('has a back button only when it was opened from another screen', async () => {
    const root = await renderReady(true);
    expect(root.current.goBack).toBeUndefined();

    const pushed = await renderReady(false);
    await act(async () => {
      pushed.current.goBack?.();
    });
    expect(router.back).toHaveBeenCalled();
  });
});
