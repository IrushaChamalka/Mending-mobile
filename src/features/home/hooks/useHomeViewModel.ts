import { router } from 'expo-router';
import { useState } from 'react';

import { useSessionUser } from '@/features/auth';
import { periodFor, summarizePeriod, useSalaryQuery } from '@/features/earnings';
import { useProfileQuery } from '@/features/profile';
import {
  uploadBadgeFor,
  useSyncPill,
  useTaskUploadStatuses,
  type SyncPillState,
  type UploadBadge,
} from '@/features/submission';
import {
  getDueLabel,
  getTaskBadge,
  isOnTodaysList,
  sortTasksForList,
  useTasks,
  type DueLabel,
  type Task,
  type TaskBadge,
} from '@/features/tasks';
import { useWithdrawableBalance } from '@/features/withdrawals';
import { features } from '@/shared/config/features';
import { useIsOnline } from '@/shared/hooks/useIsOnline';
import { useToday } from '@/shared/hooks/useToday';
import type { IconName } from '@/shared/ui';
import { formatAmount, formatCount, formatMoney } from '@/shared/utils/number';

import { balanceBreakdown, greetingFor, TODAYS_TASKS_LIMIT } from '../domain/homeRules';

export interface HomeTaskItem {
  task: Task;
  badge: TaskBadge;
  due: DueLabel;
  uploadBadge: UploadBadge | null;
}

const NOT_LOADED = '—';

export interface HomeViewModel {
  greeting: string;
  name: string;
  imageUrl: string | null;
  syncPill: SyncPillState;
  isOnline: boolean;
  /** "LKR 15,560", or a dash until the salary has loaded. */
  balance: string;
  breakdown: string;
  withdrawLabel: string;
  withdrawIcon: IconName;
  /** This month's numbers (E 2.1 tiles). */
  stats: { items: string; accepted: string; estimatedEarnings: string };
  /** The salary could not be loaded and nothing is cached. */
  earningsUnavailable: boolean;
  todaysTasks: HomeTaskItem[];
  /** More open tasks are due today or overdue than the list shows. */
  hasMoreTasks: boolean;
  tasksState: 'loading' | 'waitingForNetwork' | 'error' | 'ready';
  isRefreshing: boolean;
  refresh: () => void;
  retryTasks: () => void;
  openTask: (taskId: string) => void;
  seeAllTasks: () => void;
  openWithdraw: () => void;
  openSyncCenter: () => void;
}

/** Home (E 2.1): balance, this month's numbers, and the tasks due today or overdue. */
export function useHomeViewModel(): HomeViewModel {
  const user = useSessionUser();
  const profile = useProfileQuery();
  const balance = useWithdrawableBalance();
  const salary = useSalaryQuery();
  const { tasks, hasData: hasTasks, isError, isPaused, refetch: refetchTasks } = useTasks();
  const syncPill = useSyncPill();
  const uploadStatuses = useTaskUploadStatuses();
  const isOnline = useIsOnline();
  const today = useToday();
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const month = periodFor('thisMonth', today);
  const summary =
    salary.data && hasTasks ? summarizePeriod(salary.data.approved, tasks, month) : null;

  const todays = sortTasksForList(
    tasks.filter((task) => isOnTodaysList(task, today)),
    today,
  );

  let tasksState: HomeViewModel['tasksState'] = 'ready';
  if (!hasTasks) {
    if (isError) tasksState = 'error';
    else if (isPaused) tasksState = 'waitingForNetwork';
    else tasksState = 'loading';
  }

  return {
    greeting: greetingFor(new Date().getHours()),
    name: profile.data?.name ?? user?.employeeId ?? 'Welcome',
    imageUrl: profile.data?.imageUrl ?? null,
    syncPill,
    isOnline,
    balance: balance.hasData ? formatMoney(balance.available) : NOT_LOADED,
    breakdown: balance.hasData
      ? balanceBreakdown({
          approved: balance.approved,
          withdrawn: balance.withdrawn,
          pending: balance.pending,
        })
      : 'Loading your earnings…',
    withdrawLabel: features.withdrawalRequests ? 'Request withdrawal' : 'View payouts',
    withdrawIcon: features.withdrawalRequests ? 'arrow-up-right' : 'list',
    stats: summary
      ? {
          items: formatCount(summary.items),
          accepted: formatCount(summary.acceptedItems),
          estimatedEarnings: formatAmount(summary.estimated),
        }
      : { items: NOT_LOADED, accepted: NOT_LOADED, estimatedEarnings: NOT_LOADED },
    earningsUnavailable: balance.isError && !balance.hasData,
    todaysTasks: todays.slice(0, TODAYS_TASKS_LIMIT).map((task) => {
      const uploadStatus = uploadStatuses.get(task.id);
      return {
        task,
        badge: getTaskBadge(task, today),
        due: getDueLabel(task, today),
        uploadBadge: uploadStatus ? uploadBadgeFor(uploadStatus) : null,
      };
    }),
    hasMoreTasks: todays.length > TODAYS_TASKS_LIMIT,
    tasksState,
    isRefreshing: isPullRefreshing,
    refresh: () => {
      setIsPullRefreshing(true);
      void Promise.allSettled([refetchTasks(), balance.refetch(), profile.refetch()]).finally(
        () => {
          setIsPullRefreshing(false);
        },
      );
    },
    retryTasks: () => {
      void refetchTasks();
    },
    openTask: (taskId) => {
      // Into the Tasks tab, with My tasks beneath the detail so back stays in that tab.
      router.push({ pathname: '/tasks/[id]', params: { id: taskId } }, { withAnchor: true });
    },
    seeAllTasks: () => {
      router.navigate('/tasks');
    },
    openWithdraw: () => {
      router.navigate('/withdraw');
    },
    openSyncCenter: () => {
      router.push('/sync');
    },
  };
}
