import { router } from 'expo-router';
import { useState } from 'react';

import {
  retryUpload as retryQueuedUpload,
  uploadBadgeFor,
  useSyncPill,
  useTaskUpload,
  type SyncPillState,
  type TaskUploadInfo,
  type UploadBadge,
} from '@/features/submission';
import { toApiError, type ApiError } from '@/shared/api/apiError';
import { useIsOnline } from '@/shared/hooks/useIsOnline';
import { useToday } from '@/shared/hooks/useToday';
import { formatRelativeDayMonth, type CalendarDate } from '@/shared/utils/date';

import { flattenTaskPages } from '../data/taskCache';
import {
  acceptLocally,
  canAcceptTask,
  canSubmitTask,
  getProgressCounts,
  isOverdue,
  type ProgressCounts,
} from '../domain/taskRules';
import { getDueLabel, getTaskBadge, type TaskBadge } from '../domain/taskStatus';
import type { Task } from '../types';

import { useAcceptTask } from './useAcceptTask';
import { usePendingAccepts } from './usePendingAccepts';
import { useTaskListQuery } from './useTaskListQuery';

export type TaskDetailState = 'loading' | 'waitingForNetwork' | 'error' | 'notFound' | 'ready';

export interface TaskDetailFact {
  label: string;
  value: string;
  isAlert?: boolean;
}

/** The blue (or neutral) line under the progress tiles: what happens next for this task. */
export interface TaskStatusNote {
  tone: 'info' | 'warning';
  message: string;
}

/** The designs' wording (E 3.2): the supervisor's review is what records the day's output. */
const SUPERVISOR_RECORDS = 'Your supervisor records your daily output.';

function statusNoteFor(task: Task): TaskStatusNote | null {
  switch (task.status) {
    case 'ASSIGNED':
      return { tone: 'info', message: `Accept the task to start. ${SUPERVISOR_RECORDS}` };
    case 'ACCEPTED':
    case 'IN_PROGRESS':
      return {
        tone: 'info',
        message: `When you finish, photograph the signed tally sheet and submit your count. ${SUPERVISOR_RECORDS}`,
      };
    case 'SUBMITTED':
      return { tone: 'info', message: `Submitted. ${SUPERVISOR_RECORDS}` };
    case 'REVIEWED':
      return null;
    case 'REJECTED':
      return {
        tone: 'warning',
        message: task.rejectionReason
          ? `You declined this task: ${task.rejectionReason}`
          : 'You declined this task.',
      };
    case 'CANCELLED':
      return { tone: 'warning', message: 'This task was cancelled.' };
  }
}

function factsFor(task: Task, today: CalendarDate): TaskDetailFact[] {
  const facts: TaskDetailFact[] = [];
  if (task.location) facts.push({ label: 'Location', value: task.location });
  const due = getDueLabel(task, today);
  facts.push({
    label: 'Due',
    value: due.isOverdue
      ? `${formatRelativeDayMonth(task.dueDate, today)} · ${due.label}`
      : formatRelativeDayMonth(task.dueDate, today),
    isAlert: due.isOverdue,
  });
  const style = [task.garment.description, task.garment.color].filter(Boolean).join(' · ');
  if (style) facts.push({ label: 'Style', value: style });
  if (task.garment.styleNumber) facts.push({ label: 'Style no.', value: task.garment.styleNumber });
  if (task.garment.size) facts.push({ label: 'Sizes', value: task.garment.size });
  return facts;
}

export interface TaskDetailViewModel {
  state: TaskDetailState;
  task: Task | null;
  today: CalendarDate;
  isOverdue: boolean;
  /** Header title and subtitle: the order number and the customer. */
  heading: string;
  customerName: string | null;
  badge: TaskBadge | null;
  facts: TaskDetailFact[];
  /** The submitted photo, when there is one. */
  photos: string[];
  progress: ProgressCounts | null;
  statusNote: TaskStatusNote | null;
  canAccept: boolean;
  /** Accepted work with no submission on its way. */
  canSubmit: boolean;
  /** The submission failed: a new photo and counts replace it. */
  canRetake: boolean;
  /** The task's submission while it is on its way to the server (brief §13: "Submitting"). */
  upload: TaskUploadInfo | null;
  uploadBadge: UploadBadge | null;
  isOnline: boolean;
  syncPill: SyncPillState;
  isAccepting: boolean;
  /** Accepted on this device while offline; the server hears about it when the network returns. */
  isAcceptQueued: boolean;
  acceptError: string | null;
  loadError: ApiError | null;
  isRefreshing: boolean;
  accept: () => void;
  completeTask: () => void;
  retryUpload: () => void;
  openSyncCenter: () => void;
  refresh: () => void;
  retry: () => void;
  goBack: () => void;
}

/**
 * Task detail (E 3.2, plus the accept and photo-submit actions the backend supports). There is no single-task endpoint (API_CONTRACT Gap 11), so the task is
 * read from the cached list, and refreshing refetches the list.
 */
export function useTaskDetailViewModel(taskId: string): TaskDetailViewModel {
  const query = useTaskListQuery();
  const acceptTask = useAcceptTask();
  const pendingAccepts = usePendingAccepts();
  const upload = useTaskUpload(taskId);
  const isOnline = useIsOnline();
  const syncPill = useSyncPill();
  const today = useToday();
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const pending = pendingAccepts.get(taskId);
  const cached = flattenTaskPages(query.data).find((candidate) => candidate.id === taskId) ?? null;
  const task = cached && pending ? acceptLocally(cached, pending.acceptedAt) : cached;

  let state: TaskDetailState = 'ready';
  if (!task) {
    if (query.data !== undefined) state = 'notFound';
    else if (query.isError) state = 'error';
    else if (query.fetchStatus === 'paused') state = 'waitingForNetwork';
    else state = 'loading';
  }

  const canAccept = task !== null && pending === undefined && canAcceptTask(task);
  const isSubmittable = task !== null && canSubmitTask(task);

  return {
    state,
    task,
    today,
    isOverdue: task !== null && isOverdue(task, today),
    heading: task?.orderNumber ?? 'Task details',
    customerName: task?.customerName ?? null,
    badge: task ? getTaskBadge(task, today) : null,
    facts: task ? factsFor(task, today) : [],
    photos: task?.latestSubmission?.photoUrl ? [task.latestSubmission.photoUrl] : [],
    progress: task ? getProgressCounts(task) : null,
    statusNote: task ? statusNoteFor(task) : null,
    canAccept,
    canSubmit: isSubmittable && upload === null,
    canRetake: isSubmittable && upload?.status === 'failed',
    upload,
    uploadBadge: upload ? uploadBadgeFor(upload.status) : null,
    isOnline,
    syncPill,
    isAccepting: pending !== undefined && !pending.isPaused,
    isAcceptQueued: pending?.isPaused ?? false,
    acceptError: acceptTask.isError ? toApiError(acceptTask.error).message : null,
    loadError: state === 'error' ? toApiError(query.error) : null,
    isRefreshing: isPullRefreshing,
    accept: () => {
      if (canAccept) acceptTask.mutate({ taskId });
    },
    completeTask: () => {
      router.push({ pathname: '/capture/[id]', params: { id: taskId } });
    },
    retryUpload: () => {
      if (upload) retryQueuedUpload(upload.itemId);
    },
    openSyncCenter: () => {
      router.push('/sync');
    },
    refresh: () => {
      setIsPullRefreshing(true);
      void query.refetch().finally(() => {
        setIsPullRefreshing(false);
      });
    },
    retry: () => {
      void query.refetch();
    },
    goBack: () => {
      if (router.canGoBack()) router.back();
      else router.replace('/tasks');
    },
  };
}
