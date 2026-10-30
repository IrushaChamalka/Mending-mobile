import type { QueryClient } from '@tanstack/react-query';

import { taskKeys } from './queryKeys';

/** Refetches the task list, for example after a submission reached the server. */
export function invalidateTaskList(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: taskKeys.list() });
}
