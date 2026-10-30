import { fireEvent, render, screen } from '@testing-library/react-native';

import type { TaskDetailViewModel } from '../../hooks/useTaskDetailViewModel';
import type { TaskListViewModel } from '../../hooks/useTaskListViewModel';
import TaskDetailScreen from '../TaskDetailScreen';
import TaskListScreen from '../TaskListScreen';

import { makeTask } from '../../__fixtures__/taskFixtures';

// FlashList ships ESM only; a FlatList renders the same rows under Jest.
jest.mock('@shopify/flash-list', () => ({
  FlashList: jest.requireActual<typeof import('react-native')>('react-native').FlatList,
}));
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: 'task-1' }) }));
jest.mock('@/features/submission', () => ({ TaskUploadNotice: () => null }));
jest.mock('../../hooks/useTaskListViewModel', () => ({ useTaskListViewModel: jest.fn() }));
jest.mock('../../hooks/useTaskDetailViewModel', () => ({ useTaskDetailViewModel: jest.fn() }));

const { useTaskListViewModel } = jest.requireMock<{ useTaskListViewModel: jest.Mock }>(
  '../../hooks/useTaskListViewModel',
);
const { useTaskDetailViewModel } = jest.requireMock<{ useTaskDetailViewModel: jest.Mock }>(
  '../../hooks/useTaskDetailViewModel',
);

const syncPill = { status: 'synced', pendingCount: 0, failedCount: 0 } as const;

function makeListViewModel(): TaskListViewModel {
  return {
    state: 'ready',
    items: [
      {
        task: makeTask({ status: 'ACCEPTED' }),
        badge: { label: 'In progress', tone: 'info' },
        due: { label: 'Due today', isOverdue: false },
        uploadBadge: null,
      },
    ],
    filterOptions: [
      { value: 'all', label: 'All' },
      { value: 'dueToday', label: 'Due today' },
      { value: 'rework', label: 'Rework' },
      { value: 'done', label: 'Done' },
    ],
    selectedFilter: 'all',
    selectFilter: jest.fn(),
    today: '2026-10-22',
    subtitle: '4 assigned to you',
    isOnline: true,
    syncPill,
    unsentCount: 0,
    openSyncCenter: jest.fn(),
    isRefreshing: false,
    refresh: jest.fn(),
    loadMore: jest.fn(),
    isLoadingMore: false,
    loadError: null,
    refreshFailed: false,
    empty: { title: 'No tasks yet', body: '' },
    retry: jest.fn(),
    openTask: jest.fn(),
  };
}

function makeDetailViewModel(overrides: Partial<TaskDetailViewModel> = {}): TaskDetailViewModel {
  return {
    state: 'ready',
    task: makeTask({ instructions: 'Use matching indigo thread.' }),
    today: '2026-10-22',
    isOverdue: false,
    heading: 'ORD-2026-0142',
    customerName: 'Lanka Apparel Ltd',
    badge: { label: 'Assigned', tone: 'info' },
    facts: [
      { label: 'Location', value: 'Biyagama' },
      { label: 'Due', value: 'Today, 22 Oct' },
    ],
    photos: [],
    progress: { done: 0, accepted: null, rejected: null },
    statusNote: { tone: 'info', message: 'Accept the task to start.' },
    canAccept: true,
    canSubmit: false,
    canRetake: false,
    upload: null,
    uploadBadge: null,
    isOnline: true,
    syncPill,
    isAccepting: false,
    isAcceptQueued: false,
    acceptError: null,
    loadError: null,
    isRefreshing: false,
    accept: jest.fn(),
    completeTask: jest.fn(),
    retryUpload: jest.fn(),
    openSyncCenter: jest.fn(),
    refresh: jest.fn(),
    retry: jest.fn(),
    goBack: jest.fn(),
    ...overrides,
  };
}

describe('TaskListScreen', () => {
  it('shows the subtitle, chips and task cards (E 3.1)', async () => {
    const viewModel = makeListViewModel();
    useTaskListViewModel.mockReturnValue(viewModel);
    await render(<TaskListScreen />);

    expect(screen.getByText('4 assigned to you')).toBeTruthy();
    expect(screen.getByText('Rework')).toBeTruthy();
    expect(screen.getByText('ORD-2026-0142')).toBeTruthy();
    expect(screen.getByText('Mending · 120 garments')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('task-filter-done'));
    expect(viewModel.selectFilter).toHaveBeenCalledWith('done');
  });
});

describe('TaskDetailScreen', () => {
  it('shows the facts, instructions and progress, and accepts (E 3.2)', async () => {
    const viewModel = makeDetailViewModel();
    useTaskDetailViewModel.mockReturnValue(viewModel);
    await render(<TaskDetailScreen />);

    expect(screen.getByText('Lanka Apparel Ltd')).toBeTruthy();
    expect(screen.getByText('Today, 22 Oct')).toBeTruthy();
    expect(screen.getByText('Use matching indigo thread.')).toBeTruthy();
    expect(screen.getByText('My progress')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('task-accept'));
    expect(viewModel.accept).toHaveBeenCalled();
  });

  it('offers the photo submission once the task is accepted', async () => {
    const viewModel = makeDetailViewModel({ canAccept: false, canSubmit: true });
    useTaskDetailViewModel.mockReturnValue(viewModel);
    await render(<TaskDetailScreen />);

    await fireEvent.press(screen.getByTestId('task-complete'));
    expect(viewModel.completeTask).toHaveBeenCalled();
  });

  it('explains a missing task', async () => {
    useTaskDetailViewModel.mockReturnValue(makeDetailViewModel({ task: null, state: 'notFound' }));
    await render(<TaskDetailScreen />);
    expect(screen.getByText('Task not found')).toBeTruthy();
  });
});
