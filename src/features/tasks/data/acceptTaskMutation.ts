import type { QueryClient } from '@tanstack/react-query';

import type { AcceptedTask } from '../types';

import { taskKeys, taskMutationKeys } from './queryKeys';
import { tasksRepository } from './tasksRepository';

export interface AcceptTaskVariables {
  taskId: string;
}

export function isAcceptTaskVariables(value: unknown): value is AcceptTaskVariables {
  return (
    typeof value === 'object' &&
    value !== null &&
    'taskId' in value &&
    typeof value.taskId === 'string'
  );
}

export function acceptTaskMutationFn(variables: AcceptTaskVariables): Promise<AcceptedTask> {
  return tasksRepository.acceptTask(variables.taskId);
}

/**
 * An accept made offline is a paused mutation. TanStack persists it with the query cache, and after a
 * restart it can only resume through these defaults, because the screen's callbacks are gone.
 */
export function registerTaskMutationDefaults(queryClient: QueryClient): void {
  queryClient.setMutationDefaults(taskMutationKeys.accept, {
    mutationFn: acceptTaskMutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskKeys.list() }),
  });
}
