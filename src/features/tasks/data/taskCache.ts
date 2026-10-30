import type { InfiniteData } from '@tanstack/react-query';

import type { Task } from '../types';

/** One page of the task list. The backend does not paginate yet, so page 1 holds every task. */
export interface TaskPage {
  tasks: Task[];
  nextPage: number | null;
}

export type TaskListData = InfiniteData<TaskPage, number>;

export function flattenTaskPages(data: TaskListData | undefined): Task[] {
  return data ? data.pages.flatMap((page) => page.tasks) : [];
}

/** Replaces one task in the cached pages and keeps every other object as it was. */
export function updateTaskInPages(
  data: TaskListData,
  taskId: string,
  update: (task: Task) => Task,
): TaskListData {
  return {
    ...data,
    pages: data.pages.map((page) =>
      page.tasks.some((task) => task.id === taskId)
        ? { ...page, tasks: page.tasks.map((task) => (task.id === taskId ? update(task) : task)) }
        : page,
    ),
  };
}
