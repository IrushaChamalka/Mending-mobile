import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { logger } from '@/shared/lib/logger';

import { acceptTaskMutationFn, type AcceptTaskVariables } from '../data/acceptTaskMutation';
import { taskKeys, taskMutationKeys } from '../data/queryKeys';
import { updateTaskInPages, type TaskListData } from '../data/taskCache';
import { acceptLocally } from '../domain/taskRules';
import type { AcceptedTask } from '../types';

interface AcceptRollback {
  previous: TaskListData | undefined;
}

/**
 * Accepts a task optimistically (brief §12): the cached task turns Accepted at once, the cache rolls
 * back if the server refuses, and the list is refetched either way. Offline, the accept waits as a
 * paused mutation and is sent when the network returns.
 */
export function useAcceptTask(): UseMutationResult<
  AcceptedTask,
  Error,
  AcceptTaskVariables,
  AcceptRollback
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: taskMutationKeys.accept,
    mutationFn: acceptTaskMutationFn,
    onMutate: async ({ taskId }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.list() });
      const previous = queryClient.getQueryData<TaskListData>(taskKeys.list());
      const acceptedAt = new Date().toISOString();
      queryClient.setQueryData<TaskListData>(taskKeys.list(), (data) =>
        data ? updateTaskInPages(data, taskId, (task) => acceptLocally(task, acceptedAt)) : data,
      );
      return { previous };
    },
    onError: (_error, _variables, rollback) => {
      if (rollback?.previous) queryClient.setQueryData(taskKeys.list(), rollback.previous);
    },
    onSuccess: (accepted) => {
      queryClient.setQueryData<TaskListData>(taskKeys.list(), (data) =>
        data
          ? updateTaskInPages(data, accepted.id, (task) => ({
              ...task,
              status: accepted.status,
              acceptedAt: accepted.acceptedAt ?? task.acceptedAt,
            }))
          : data,
      );
      logger.breadcrumb('task_accepted', { taskId: accepted.id });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskKeys.list() }),
  });
}
