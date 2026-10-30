import { fireEvent, render, screen } from '@testing-library/react-native';

import type { EarningsHistoryViewModel } from '../../hooks/useEarningsHistoryViewModel';
import type { EarningsViewModel } from '../../hooks/useEarningsViewModel';
import EarningsHistoryScreen from '../EarningsHistoryScreen';
import EarningsScreen from '../EarningsScreen';

// FlashList ships ESM only; a FlatList renders the same rows under Jest.
jest.mock('@shopify/flash-list', () => ({
  FlashList: jest.requireActual<typeof import('react-native')>('react-native').FlatList,
}));
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ period: 'thisMonth' }) }));
jest.mock('../../hooks/useEarningsViewModel', () => ({ useEarningsViewModel: jest.fn() }));
jest.mock('../../hooks/useEarningsHistoryViewModel', () => ({
  useEarningsHistoryViewModel: jest.fn(),
}));

const { useEarningsViewModel } = jest.requireMock<{ useEarningsViewModel: jest.Mock }>(
  '../../hooks/useEarningsViewModel',
);
const { useEarningsHistoryViewModel } = jest.requireMock<{
  useEarningsHistoryViewModel: jest.Mock;
}>('../../hooks/useEarningsHistoryViewModel');

const syncPill = { status: 'synced', pendingCount: 0, failedCount: 0 } as const;

function makeOverview(overrides: Partial<EarningsViewModel> = {}): EarningsViewModel {
  return {
    state: 'ready',
    periodLabel: '1–9 Oct 2026',
    periodOptions: [{ value: 'lastMonth', label: 'Last month', detail: '1–30 Sep 2026' }],
    selectedPreset: 'thisMonth',
    isPeriodSheetOpen: false,
    summary: {
      estimated: 'LKR 29,880',
      approved: 'LKR 25,560',
      withdrawn: '− LKR 10,000',
      available: 'LKR 15,560',
    },
    bars: [
      { key: '2026-10-01', label: '1', fraction: 1, accessibilityLabel: '1 Oct' },
      { key: '2026-10-02', label: '2', fraction: 0, accessibilityLabel: '2 Oct' },
    ],
    syncPill,
    isRefreshing: false,
    refreshFailed: false,
    loadError: null,
    openPeriodSheet: jest.fn(),
    closePeriodSheet: jest.fn(),
    selectPreset: jest.fn(),
    openHistory: jest.fn(),
    openSyncCenter: jest.fn(),
    refresh: jest.fn(),
    retry: jest.fn(),
    ...overrides,
  };
}

function makeHistory(overrides: Partial<EarningsHistoryViewModel> = {}): EarningsHistoryViewModel {
  return {
    state: 'ready',
    periodLabel: '1–9 Oct 2026',
    filterOptions: [
      { value: 'all', label: 'All' },
      { value: 'approved', label: 'Approved' },
      { value: 'pending', label: 'Pending' },
    ],
    selectedFilter: 'all',
    selectFilter: jest.fn(),
    rows: [
      {
        id: 'pending-1',
        date: '9 Oct',
        orderNumber: 'ORD-0142',
        serviceName: 'Mending',
        items: '184',
        amount: '3,312',
        status: 'pending',
      },
    ],
    subtotal: { items: '184', amount: '3,312' },
    emptyMessage: 'No earnings in this period yet.',
    syncPill,
    isRefreshing: false,
    loadError: null,
    refresh: jest.fn(),
    retry: jest.fn(),
    goBack: jest.fn(),
    openSyncCenter: jest.fn(),
    ...overrides,
  };
}

describe('EarningsScreen', () => {
  it('shows the period, the summary and the chart (E 4.1)', async () => {
    const viewModel = makeOverview();
    useEarningsViewModel.mockReturnValue(viewModel);
    await render(<EarningsScreen />);

    expect(screen.getByText('1–9 Oct 2026')).toBeTruthy();
    expect(screen.getByText('LKR 25,560')).toBeTruthy();
    expect(screen.getByText('− LKR 10,000')).toBeTruthy();
    expect(screen.getByText('Only you can see your earnings.')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('earnings-change-period'));
    expect(viewModel.openPeriodSheet).toHaveBeenCalled();
    await fireEvent.press(screen.getByText('View earnings history'));
    expect(viewModel.openHistory).toHaveBeenCalled();
  });

  it('lets the employee pick a period from the sheet', async () => {
    const viewModel = makeOverview({ isPeriodSheetOpen: true });
    useEarningsViewModel.mockReturnValue(viewModel);
    await render(<EarningsScreen />);

    await fireEvent.press(screen.getByText('Last month'));
    expect(viewModel.selectPreset).toHaveBeenCalledWith('lastMonth');
  });
});

describe('EarningsHistoryScreen', () => {
  it('shows the table with a subtotal (E 4.2)', async () => {
    useEarningsHistoryViewModel.mockReturnValue(makeHistory());
    await render(<EarningsHistoryScreen />);

    expect(screen.getByText('Order · Service')).toBeTruthy();
    expect(screen.getByText('ORD-0142')).toBeTruthy();
    expect(screen.getByTestId('earnings-subtotal')).toBeTruthy();
  });

  it('closes the card with a message when a filter is empty', async () => {
    useEarningsHistoryViewModel.mockReturnValue(makeHistory({ rows: [], subtotal: null }));
    await render(<EarningsHistoryScreen />);
    expect(screen.getByText('No earnings in this period yet.')).toBeTruthy();
  });
});
