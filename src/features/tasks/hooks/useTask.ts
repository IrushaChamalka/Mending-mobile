import { flattenTaskPages } from '../data/taskCache';
import type { Task } from '../types';

import { useTaskListQuery } from './useTaskListQuery';

/** One task from the cached list (there is no single-task endpoint, API_CONTRACT Gap 11). */
export function useTask(taskId: string): Task | null {
  const query = useTaskListQuery();
  return flattenTaskPages(query.data).find((task) => task.id === taskId) ?? null;
}
