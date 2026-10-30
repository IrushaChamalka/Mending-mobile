import { flattenTaskPages } from '../data/taskCache';
import { applyPendingAccepts } from '../domain/taskRules';
import type { Task } from '../types';

import { usePendingAccepts } from './usePendingAccepts';
import { useTaskListQuery } from './useTaskListQuery';

export interface TasksState {
  /** Every task, with accepts still on their way shown as accepted. */
  tasks: Task[];
  /** True once the list has loaded (or was restored from the cache). */
  hasData: boolean;
  isError: boolean;
  /** Waiting for the network with nothing cached. */
  isPaused: boolean;
  refetch: () => Promise<unknown>;
}

/** The signed-in employee's tasks for other features (Home, Earnings). */
export function useTasks(): TasksState {
  const query = useTaskListQuery();
  const pendingAccepts = usePendingAccepts();
  return {
    tasks: applyPendingAccepts(flattenTaskPages(query.data), pendingAccepts),
    hasData: query.data !== undefined,
    isError: query.isError,
    isPaused: query.fetchStatus === 'paused',
    refetch: query.refetch,
  };
}
