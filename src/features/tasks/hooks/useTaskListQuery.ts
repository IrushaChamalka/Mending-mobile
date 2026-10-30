import { useInfiniteQuery, type UseInfiniteQueryResult } from '@tanstack/react-query';

import { taskKeys } from '../data/queryKeys';
import type { TaskListData } from '../data/taskCache';
import { tasksRepository } from '../data/tasksRepository';

/** Brief §12: the task list stays fresh for 1–2 minutes. */
const TASK_LIST_STALE_TIME_MS = 90 * 1000;

/** The signed-in user's tasks as an infinite query, ready for when the backend pages (Gap 4). */
export function useTaskListQuery(): UseInfiniteQueryResult<TaskListData, Error> {
  return useInfiniteQuery({
    queryKey: taskKeys.list(),
    queryFn: ({ pageParam, signal }) => tasksRepository.fetchTaskPage(pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    staleTime: TASK_LIST_STALE_TIME_MS,
  });
}
