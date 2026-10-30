import type { CalendarDate } from '@/shared/utils/date';

import type { Task, TaskStatus, TaskTarget } from '../types';

const OPEN_STATUSES: readonly TaskStatus[] = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'];

/** Work that still has to be done. */
export function isTaskOpen(status: TaskStatus): boolean {
  return OPEN_STATUSES.includes(status);
}

/** Only an assigned task can be accepted; accepted tasks are already accepted. */
export function canAcceptTask(task: Pick<Task, 'status'>): boolean {
  return task.status === 'ASSIGNED';
}

/**
 * Accepted work can be submitted once. SUBMITTED waits for the supervisor and REVIEWED is final
 * (decision of 2026-10-22), even though the backend would accept another submission.
 */
export function canSubmitTask(task: Pick<Task, 'status'>): boolean {
  return task.status === 'ACCEPTED' || task.status === 'IN_PROGRESS';
}

/** Open work whose working day has passed, by the device's calendar. */
export function isOverdue(task: Pick<Task, 'status' | 'dueDate'>, today: CalendarDate): boolean {
  return isTaskOpen(task.status) && task.dueDate < today;
}

export interface ProgressCounts {
  /** Pieces the employee reported (completedQuantity). */
  done: number;
  /** Pieces the supervisor accepted; null until the work is reviewed. */
  accepted: number | null;
  /** Reported pieces the supervisor did not accept; null until the work is reviewed. */
  rejected: number | null;
}

/**
 * The "My progress" tiles (E 3.2). The backend tracks reported and accepted pieces only, so the
 * designed Rework tile has no data (API_CONTRACT Gap 21) and Rejected is what review left out.
 */
export function getProgressCounts(task: Pick<Task, 'review' | 'latestSubmission'>): ProgressCounts {
  if (task.review) {
    const { completedQuantity, acceptedQuantity } = task.review;
    return {
      done: completedQuantity,
      accepted: acceptedQuantity,
      rejected: Math.max(completedQuantity - acceptedQuantity, 0),
    };
  }
  return { done: task.latestSubmission?.completedQuantity ?? 0, accepted: null, rejected: null };
}

export interface TargetProgress {
  achieved: number;
  total: number;
  /** 0 to 1, or null when no target was set. */
  fraction: number | null;
  isComplete: boolean;
}

export function getTargetProgress(target: TaskTarget): TargetProgress {
  if (target.value <= 0) {
    return { achieved: target.achieved, total: 0, fraction: null, isComplete: false };
  }
  return {
    achieved: target.achieved,
    total: target.value,
    fraction: Math.min(Math.max(target.achieved / target.value, 0), 1),
    isComplete: target.achieved >= target.value,
  };
}

/** The task as it looks right after the user accepts it, before the server confirms. */
export function acceptLocally(task: Task, acceptedAt: string): Task {
  return canAcceptTask(task) ? { ...task, status: 'ACCEPTED', acceptedAt } : task;
}

/**
 * Shows accepts that are still on their way to the server (offline, or in flight during a refetch)
 * on top of the fetched tasks, so a task never flips back to Assigned while its accept is pending.
 */
export function applyPendingAccepts(
  tasks: Task[],
  pending: ReadonlyMap<string, { acceptedAt: string }>,
): Task[] {
  if (pending.size === 0) return tasks;
  return tasks.map((task) => {
    const accept = pending.get(task.id);
    return accept ? acceptLocally(task, accept.acceptedAt) : task;
  });
}

/** A submission the server has just confirmed, before the list is refetched. */
export interface ConfirmedSubmission {
  completedQuantity: number;
  /** Null when the worker left it empty: the server then keeps the stored value. */
  acceptedQuantity: number | null;
  /** Null when the worker left it empty: the server then keeps the stored note (API_CONTRACT Gap 18). */
  note: string | null;
  photoUrl: string;
  submittedAt: string;
}

/**
 * The task as the server now has it after submit-work, mirroring the mapper's rules, so the task
 * goes straight from "Submitting" to "Submitted" instead of flashing its old status until the
 * refetch lands.
 */
export function submitLocally(task: Task, submission: ConfirmedSubmission): Task {
  const previous = task.latestSubmission;
  return {
    ...task,
    status: 'SUBMITTED',
    target: { ...task.target, achieved: submission.completedQuantity },
    latestSubmission: {
      photoUrl: submission.photoUrl,
      note: submission.note ?? previous?.note ?? task.instructions,
      submittedAt: submission.submittedAt,
      completedQuantity: submission.completedQuantity,
      acceptedQuantity: submission.acceptedQuantity ?? previous?.acceptedQuantity ?? 0,
    },
    instructions: null,
  };
}
