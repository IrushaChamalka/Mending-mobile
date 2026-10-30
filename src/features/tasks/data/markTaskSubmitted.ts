import type { QueryClient } from '@tanstack/react-query';

import { submitLocally, type ConfirmedSubmission } from '../domain/taskRules';

import { taskKeys } from './queryKeys';
import { updateTaskInPages, type TaskListData } from './taskCache';

/** Shows a confirmed submission in the cached list right away. Call invalidateTaskList after it. */
export function markTaskSubmitted(
  queryClient: QueryClient,
  taskId: string,
  submission: ConfirmedSubmission,
): void {
  queryClient.setQueryData<TaskListData>(taskKeys.list(), (data) =>
    data ? updateTaskInPages(data, taskId, (task) => submitLocally(task, submission)) : data,
  );
}
