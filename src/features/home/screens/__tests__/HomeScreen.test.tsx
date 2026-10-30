import { fireEvent, render, screen } from '@testing-library/react-native';

import { makeTask } from '@/features/tasks/__fixtures__/taskFixtures';

import type { HomeViewModel } from '../../hooks/useHomeViewModel';
import HomeScreen from '../HomeScreen';

jest.mock('@/features/tasks', () => ({
  TaskCard: jest.requireActual<{ TaskCard: unknown }>('@/features/tasks/components/TaskCard')
    .TaskCard,
}));
jest.mock('../../hooks/useHomeViewModel', () => ({ useHomeViewModel: jest.fn() }));

const { useHomeViewModel } = jest.requireMock<{ useHomeViewModel: jest.Mock }>(
  '../../hooks/useHomeViewModel',
);

function makeViewModel(overrides: Partial<HomeViewModel> = {}): HomeViewModel {
  return {
    greeting: 'Good morning,',
    name: 'Kasun Fernando',
    imageUrl: null,
    syncPill: { status: 'synced', pendingCount: 0, failedCount: 0 },
    isOnline: true,
    balance: 'LKR 15,560',
    breakdown: 'Approved 25,560 – withdrawn 10,000',
    withdrawLabel: 'Request withdrawal',
    withdrawIcon: 'arrow-up-right',
    stats: { items: '1,420', accepted: '1,296', estimatedEarnings: '29,880' },
    earningsUnavailable: false,
    todaysTasks: [
      {
        task: makeTask({ id: 't1', status: 'ACCEPTED' }),
        badge: { label: 'In progress', tone: 'info' },
        due: { label: 'Due today', isOverdue: false },
        uploadBadge: null,
      },
      {
        task: makeTask({ id: 't2', orderNumber: 'ORD-2026-0138' }),
        badge: { label: 'Overdue', tone: 'danger' },
        due: { label: 'Overdue 6 days', isOverdue: true },
        uploadBadge: null,
      },
    ],
    hasMoreTasks: false,
    tasksState: 'ready',
    isRefreshing: false,
    refresh: jest.fn(),
    retryTasks: jest.fn(),
    openTask: jest.fn(),
    seeAllTasks: jest.fn(),
    openWithdraw: jest.fn(),
    openSyncCenter: jest.fn(),
    ...overrides,
  };
}

describe('HomeScreen', () => {
  it('shows the greeting, balance, numbers and today’s tasks (E 2.1)', async () => {
    const viewModel = makeViewModel();
    useHomeViewModel.mockReturnValue(viewModel);
    await render(<HomeScreen />);

    expect(screen.getByText('Kasun Fernando')).toBeTruthy();
    expect(screen.getByText('LKR 15,560')).toBeTruthy();
    expect(screen.getByText('Approved 25,560 – withdrawn 10,000')).toBeTruthy();
    expect(screen.getByText('1,296')).toBeTruthy();
    expect(screen.getByText('Overdue 6 days')).toBeTruthy();
    expect(screen.getByText('All synced')).toBeTruthy();

    await fireEvent.press(screen.getByText('Request withdrawal'));
    expect(viewModel.openWithdraw).toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('home-task-t2'));
    expect(viewModel.openTask).toHaveBeenCalledWith('t2');
    await fireEvent.press(screen.getByText('See all'));
    expect(viewModel.seeAllTasks).toHaveBeenCalled();
  });

  it('says so when nothing is due today', async () => {
    useHomeViewModel.mockReturnValue(makeViewModel({ todaysTasks: [] }));
    await render(<HomeScreen />);
    expect(screen.getByText('Nothing due today')).toBeTruthy();
  });
});
