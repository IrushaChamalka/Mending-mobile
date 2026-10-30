import { taskStatusTone, type StatusTone } from '@/shared/theme';
import { daysBetween, formatDayMonth, type CalendarDate } from '@/shared/utils/date';

import type { Task, TaskStatus } from '../types';

import { isOverdue, isTaskOpen } from './taskRules';

/** Status names as the designs word them (E 3.1): an accepted task is "In progress". */
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  ASSIGNED: 'Assigned',
  ACCEPTED: 'In progress',
  REJECTED: 'Declined',
  IN_PROGRESS: 'In progress',
  SUBMITTED: 'Submitted',
  REVIEWED: 'Done',
  CANCELLED: 'Cancelled',
};

const REWORK_SERVICE = /rework/i;

/**
 * Rework is a service on this backend, not a status (API_CONTRACT §9, Gap 21): a task is rework
 * when its order line's service is named so, as on the designed "Rework · 14 garments" card.
 */
export function isReworkTask(task: Pick<Task, 'serviceName'>): boolean {
  return task.serviceName !== null && REWORK_SERVICE.test(task.serviceName);
}

export interface TaskBadge {
  label: string;
  tone: StatusTone;
}

/** The pill on a task: Overdue and Rework (E 3.1) win over the status while the work is open. */
export function getTaskBadge(
  task: Pick<Task, 'status' | 'dueDate' | 'serviceName'>,
  today: CalendarDate,
): TaskBadge {
  if (isOverdue(task, today)) return { label: 'Overdue', tone: 'danger' };
  if (isTaskOpen(task.status) && isReworkTask(task)) return { label: 'Rework', tone: 'warning' };
  return { label: TASK_STATUS_LABELS[task.status], tone: taskStatusTone[task.status] };
}

export interface DueLabel {
  label: string;
  isOverdue: boolean;
}

/** The clock line of a task card: "Due today", "Overdue 6 days", or the day ("12 Oct"). */
export function getDueLabel(task: Pick<Task, 'status' | 'dueDate'>, today: CalendarDate): DueLabel {
  if (isOverdue(task, today)) {
    const days = daysBetween(task.dueDate, today);
    return { label: `Overdue ${days} ${days === 1 ? 'day' : 'days'}`, isOverdue: true };
  }
  if (isTaskOpen(task.status) && task.dueDate === today) {
    return { label: 'Due today', isOverdue: false };
  }
  return { label: formatDayMonth(task.dueDate), isOverdue: false };
}
