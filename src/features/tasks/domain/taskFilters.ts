import type { CalendarDate } from '@/shared/utils/date';

import type { Task, TaskStatus } from '../types';

import { isTaskOpen } from './taskRules';
import { isReworkTask } from './taskStatus';

/** The filter chips of E 3.1. */
export const TASK_FILTERS = ['all', 'dueToday', 'rework', 'done'] as const;

export type TaskFilter = (typeof TASK_FILTERS)[number];

export const TASK_FILTER_LABELS: Record<TaskFilter, string> = {
  all: 'All',
  dueToday: 'Due today',
  rework: 'Rework',
  done: 'Done',
};

const DONE_STATUSES: readonly TaskStatus[] = ['SUBMITTED', 'REVIEWED'];

/** Work the employee has finished: submitted (waiting for review) or reviewed. */
export function isTaskDone(task: Pick<Task, 'status'>): boolean {
  return DONE_STATUSES.includes(task.status);
}

export function matchesTaskFilter(
  task: Pick<Task, 'status' | 'dueDate' | 'serviceName'>,
  filter: TaskFilter,
  today: CalendarDate,
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'dueToday':
      return isTaskOpen(task.status) && task.dueDate === today;
    case 'rework':
      return isReworkTask(task);
    case 'done':
      return isTaskDone(task);
  }
}

/** List order: open work first (today, then overdue, then upcoming), then finished work, newest first. */
function sortGroup(task: Pick<Task, 'status' | 'dueDate'>, today: CalendarDate): number {
  if (isTaskOpen(task.status)) {
    if (task.dueDate === today) return 0;
    return task.dueDate < today ? 1 : 2;
  }
  if (task.status === 'SUBMITTED') return 3;
  if (task.status === 'REVIEWED') return 4;
  return 5;
}

export function sortTasksForList<T extends Pick<Task, 'status' | 'dueDate'>>(
  tasks: readonly T[],
  today: CalendarDate,
): T[] {
  return [...tasks].sort((a, b) => {
    const group = sortGroup(a, today) - sortGroup(b, today);
    if (group !== 0) return group;
    // Overdue and upcoming work: soonest first. Finished work: most recent first.
    const ascending = sortGroup(a, today) <= 2;
    if (a.dueDate === b.dueDate) return 0;
    return a.dueDate < b.dueDate === ascending ? -1 : 1;
  });
}

/** Open work due today or already overdue: the Home "Today's tasks" list (E 2.1). */
export function isOnTodaysList(
  task: Pick<Task, 'status' | 'dueDate'>,
  today: CalendarDate,
): boolean {
  return isTaskOpen(task.status) && task.dueDate <= today;
}

/** Open tasks: the "4 assigned to you" count (E 3.1). */
export function countOpenTasks(tasks: readonly Pick<Task, 'status'>[]): number {
  return tasks.filter((task) => isTaskOpen(task.status)).length;
}
