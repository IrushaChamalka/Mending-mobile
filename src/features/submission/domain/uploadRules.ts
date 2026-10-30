import type { ApiErrorType } from '@/shared/api/apiError';
import type { StatusTone } from '@/shared/theme';

import type { UploadQueueItem, UploadStatus, UploadSummary } from '../types';

/** After this many failed attempts a submission waits for the user to retry (brief §13). */
export const MAX_UPLOAD_ATTEMPTS = 8;

const BASE_RETRY_DELAY_MS = 5_000;
export const MAX_RETRY_DELAY_MS = 10 * 60_000;

/** Share of the progress bar taken by the photo upload; submit-work takes the rest. */
export const PHOTO_PROGRESS_SHARE = 0.9;

/**
 * Exponential backoff: 5 s, 10 s, 20 s, 40 s, 80 s, 160 s, 320 s, capped at 10 minutes. With 8
 * attempts a submission keeps trying for about 10 minutes of bad connection before it needs the user;
 * time spent offline does not count.
 */
export function retryDelayMs(attempts: number): number {
  return Math.min(BASE_RETRY_DELAY_MS * 2 ** Math.max(attempts - 1, 0), MAX_RETRY_DELAY_MS);
}

export type FailureDecision =
  | { kind: 'requeue' }
  | { kind: 'retry'; attempts: number; delayMs: number }
  | { kind: 'fail'; attempts: number };

/**
 * What to do after an upload attempt failed:
 * - session ended (401) or request cancelled: wait, without counting the attempt;
 * - connection lost: wait for the network, without counting the attempt;
 * - anything not worth repeating (validation, not found, forbidden): fail now and show the reason;
 * - network blip, timeout or server fault: retry with backoff, up to MAX_UPLOAD_ATTEMPTS.
 */
export function decideAfterFailure(
  error: { type: ApiErrorType; isRetryable: boolean },
  attempts: number,
  isOnline: boolean,
): FailureDecision {
  if (error.type === 'unauthorized' || error.type === 'cancelled') return { kind: 'requeue' };
  const lostConnection = (error.type === 'network' || error.type === 'timeout') && !isOnline;
  if (lostConnection) return { kind: 'requeue' };
  const nextAttempts = attempts + 1;
  if (!error.isRetryable || nextAttempts >= MAX_UPLOAD_ATTEMPTS) {
    return { kind: 'fail', attempts: nextAttempts };
  }
  return { kind: 'retry', attempts: nextAttempts, delayMs: retryDelayMs(nextAttempts) };
}

/** The signed-in user's items. Other users' items wait on the device until they sign in again. */
export function ownUploads(
  items: readonly UploadQueueItem[],
  ownerId: string | null,
): UploadQueueItem[] {
  return ownerId === null ? [] : items.filter((item) => item.ownerId === ownerId);
}

/** Queued and due. A wait longer than the longest backoff means the device clock moved back: due now. */
export function isUploadDue(
  item: Pick<UploadQueueItem, 'status' | 'nextAttemptAt'>,
  now: number,
): boolean {
  if (item.status !== 'queued') return false;
  if (item.nextAttemptAt === null) return true;
  return item.nextAttemptAt <= now || item.nextAttemptAt - now > MAX_RETRY_DELAY_MS;
}

function byCreatedAt(a: UploadQueueItem, b: UploadQueueItem): number {
  return a.createdAt.localeCompare(b.createdAt);
}

/** The oldest due item: submissions upload one at a time, in the order they were made. */
export function pickNextUpload(
  items: readonly UploadQueueItem[],
  now: number,
): UploadQueueItem | null {
  return items.filter((item) => isUploadDue(item, now)).sort(byCreatedAt)[0] ?? null;
}

/** When the next backoff wait ends, or null when nothing is waiting. */
export function nextRetryAt(items: readonly UploadQueueItem[], now: number): number | null {
  let earliest: number | null = null;
  for (const item of items) {
    if (item.status !== 'queued' || item.nextAttemptAt === null || isUploadDue(item, now)) continue;
    if (earliest === null || item.nextAttemptAt < earliest) earliest = item.nextAttemptAt;
  }
  return earliest;
}

export function summarizeUploads(
  items: readonly UploadQueueItem[],
): Pick<UploadSummary, 'pendingCount' | 'failedCount'> {
  let pendingCount = 0;
  let failedCount = 0;
  for (const item of items) {
    if (item.status === 'failed') failedCount += 1;
    else pendingCount += 1;
  }
  return { pendingCount, failedCount };
}

/** The newest item per task (a new submission replaces older ones, so there is normally one). */
export function latestUploadByTask(
  items: readonly UploadQueueItem[],
): ReadonlyMap<string, UploadQueueItem> {
  const latest = new Map<string, UploadQueueItem>();
  for (const item of [...items].sort(byCreatedAt)) latest.set(item.taskId, item);
  return latest;
}

/** Retry only helps when the failure was the connection or the server, not the submission itself. */
export function canRetryUpload(item: Pick<UploadQueueItem, 'status' | 'lastError'>): boolean {
  return item.status === 'failed' && (item.lastError?.retryable ?? true);
}

export interface UploadBadge {
  label: string;
  tone: StatusTone;
}

const UPLOAD_BADGES: Readonly<Record<UploadStatus, UploadBadge>> = {
  queued: { label: 'Submitting', tone: 'warning' },
  uploading: { label: 'Submitting', tone: 'warning' },
  failed: { label: 'Upload failed', tone: 'danger' },
};

/**
 * The pill shown instead of the task's status while its submission is on the way (brief §13: the
 * task shows as "Submitting" until the server confirms). One shared object per status, so memoised
 * list rows do not re-render.
 */
export function uploadBadgeFor(status: UploadStatus): UploadBadge {
  return UPLOAD_BADGES[status];
}

/** Sync center rows: what the item is doing right now. */
export function queueRowBadge(item: UploadQueueItem, isOnline: boolean): UploadBadge {
  if (item.status === 'failed') return { label: 'Failed', tone: 'danger' };
  if (item.status === 'uploading') return { label: 'Uploading', tone: 'info' };
  return { label: isOnline ? 'Pending' : 'Waiting', tone: 'warning' };
}

export interface SyncPillState {
  status: 'synced' | 'pending' | 'offline' | 'failed';
  pendingCount: number;
  failedCount: number;
}

/** Failed uploads show first when online; offline, everything not yet uploaded counts as pending. */
export function syncPillState(
  isOnline: boolean,
  summary: Pick<UploadSummary, 'pendingCount' | 'failedCount'>,
): SyncPillState {
  const { pendingCount, failedCount } = summary;
  if (!isOnline) {
    return { status: 'offline', pendingCount: pendingCount + failedCount, failedCount };
  }
  if (failedCount > 0) return { status: 'failed', pendingCount, failedCount };
  if (pendingCount > 0) return { status: 'pending', pendingCount, failedCount };
  return { status: 'synced', pendingCount, failedCount };
}
