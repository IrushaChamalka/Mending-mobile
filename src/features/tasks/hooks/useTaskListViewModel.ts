import { router } from 'expo-router';
import { useState } from 'react';

import { useSessionUser } from '@/features/auth';
import {
  uploadBadgeFor,
  useSyncPill,
  useTaskUploadStatuses,
  type SyncPillState,
  type UploadBadge,
} from '@/features/submission';
import { toApiError, type ApiError } from '@/shared/api/apiError';
import { useIsOnline } from '@/shared/hooks/useIsOnline';
import { useToday } from '@/shared/hooks/useToday';
import type { CalendarDate } from '@/shared/utils/date';

import { flattenTaskPages } from '../data/taskCache';
import {
  countOpenTasks,
  matchesTaskFilter,
  sortTasksForList,
  TASK_FILTER_LABELS,
  TASK_FILTERS,
  type TaskFilter,
} from '../domain/taskFilters';
import { applyPendingAccepts } from '../domain/taskRules';
import { getDueLabel, getTaskBadge, type DueLabel, type TaskBadge } from '../domain/taskStatus';
import type { Task } from '../types';

import { usePendingAccepts } from './usePendingAccepts';
import { useTaskListQuery } from './useTaskListQuery';

export interface TaskListItem {
  task: Task;
  badge: TaskBadge;
  due: DueLabel;
  /** "Submitting" or "Upload failed" while the task's submission is on its way. */
  uploadBadge: UploadBadge | null;
}

export interface TaskFilterOption {
  value: TaskFilter;
  label: string;
}

/** loading and waitingForNetwork only happen before anything is cached. */
export type TaskListState = 'loading' | 'waitingForNetwork' | 'error' | 'ready';

export interface TaskListViewModel {
  state: TaskListState;
  items: TaskListItem[];
  filterOptions: readonly TaskFilterOption[];
  selectedFilter: TaskFilter;
  selectFilter: (filter: TaskFilter) => void;
  today: CalendarDate;
  /** "4 assigned to you" (E 3.1). */
  subtitle: string;
  isOnline: boolean;
  syncPill: SyncPillState;
  /** Submissions not yet on the server, for the offline banner. */
  unsentCount: number;
  openSyncCenter: () => void;
  isRefreshing: boolean;
  refresh: () => void;
  loadMore: () => void;
  isLoadingMore: boolean;
  /** Blocking error: nothing cached to show. */
  loadError: ApiError | null;
  /** The last refresh failed, so saved tasks are shown. */
  refreshFailed: boolean;
  empty: { title: string; body: string };
  retry: () => void;
  openTask: (taskId: string) => void;
}

const FILTER_OPTIONS: readonly TaskFilterOption[] = TASK_FILTERS.map((value) => ({
  value,
  label: TASK_FILTER_LABELS[value],
}));

function emptyMessage(filter: TaskFilter, isEmployee: boolean): { title: string; body: string } {
  if (!isEmployee) {
    return {
      title: 'No tasks for this account',
      body: 'Tasks are assigned to employees. Supervisors and admins manage work in the web dashboard.',
    };
  }
  switch (filter) {
    case 'all':
      return {
        title: 'No tasks yet',
        body: 'Tasks your supervisor assigns to you will appear here.',
      };
    case 'dueToday':
      return { title: 'Nothing due today', body: 'Open tasks due today will appear here.' };
    case 'rework':
      return { title: 'No rework', body: 'Rework your supervisor assigns will appear here.' };
    case 'done':
      return {
        title: `No ${TASK_FILTER_LABELS[filter].toLowerCase()} tasks yet`,
        body: 'Work you submit will appear here.',
      };
  }
}

function subtitleFor(openCount: number): string {
  if (openCount === 0) return 'Nothing open right now';
  return `${openCount} assigned to you`;
}

/** My tasks (E 3.1): filter chips, pull-to-refresh, overdue and rework flags. */
export function useTaskListViewModel(): TaskListViewModel {
  const query = useTaskListQuery();
  const pendingAccepts = usePendingAccepts();
  const isOnline = useIsOnline();
  const syncPill = useSyncPill();
  const uploadStatuses = useTaskUploadStatuses();
  const today = useToday();
  const user = useSessionUser();
  const [selectedFilter, setSelectedFilter] = useState<TaskFilter>('all');
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const tasks = applyPendingAccepts(flattenTaskPages(query.data), pendingAccepts);
  const items = sortTasksForList(
    tasks.filter((task) => matchesTaskFilter(task, selectedFilter, today)),
    today,
  ).map((task) => {
    const uploadStatus = uploadStatuses.get(task.id);
    return {
      task,
      badge: getTaskBadge(task, today),
      due: getDueLabel(task, today),
      uploadBadge: uploadStatus ? uploadBadgeFor(uploadStatus) : null,
    };
  });

  const hasData = query.data !== undefined;
  let state: TaskListState = 'ready';
  if (!hasData) {
    if (query.isError) state = 'error';
    else if (query.fetchStatus === 'paused') state = 'waitingForNetwork';
    else state = 'loading';
  }

  return {
    state,
    items,
    filterOptions: FILTER_OPTIONS,
    selectedFilter,
    selectFilter: setSelectedFilter,
    today,
    subtitle: subtitleFor(countOpenTasks(tasks)),
    isOnline,
    syncPill,
    unsentCount: syncPill.pendingCount,
    openSyncCenter: () => {
      router.push('/sync');
    },
    isRefreshing: isPullRefreshing,
    refresh: () => {
      setIsPullRefreshing(true);
      void query.refetch().finally(() => {
        setIsPullRefreshing(false);
      });
    },
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
    isLoadingMore: query.isFetchingNextPage,
    loadError: state === 'error' ? toApiError(query.error) : null,
    refreshFailed: query.isRefetchError,
    empty: emptyMessage(selectedFilter, user === null || user.role === 'EMPLOYEE'),
    retry: () => {
      void query.refetch();
    },
    openTask: (taskId) => {
      router.push({ pathname: '/tasks/[id]', params: { id: taskId } });
    },
  };
}
