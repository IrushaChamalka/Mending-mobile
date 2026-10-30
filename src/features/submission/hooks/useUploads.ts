import { useSessionUser } from '@/features/auth';
import { useIsOnline } from '@/shared/hooks/useIsOnline';

import {
  canRetryUpload,
  latestUploadByTask,
  ownUploads,
  summarizeUploads,
  syncPillState,
  type SyncPillState,
} from '../domain/uploadRules';
import { useUploadProgressStore } from '../store/uploadProgressStore';
import { useUploadQueueStore } from '../store/uploadQueueStore';
import type { TaskUploadInfo, UploadQueueItem, UploadStatus, UploadSummary } from '../types';

function toUploadInfo(item: UploadQueueItem, progress: number | undefined): TaskUploadInfo {
  return {
    itemId: item.id,
    status: item.status,
    progress: item.status === 'uploading' ? (progress ?? 0) : null,
    isWaitingToRetry: item.status === 'queued' && item.nextAttemptAt !== null,
    error: item.lastError,
    canRetry: canRetryUpload(item),
  };
}

/** The signed-in user's queue items. */
export function useOwnUploads(): UploadQueueItem[] {
  const user = useSessionUser();
  const items = useUploadQueueStore((state) => state.items);
  return ownUploads(items, user?.id ?? null);
}

/** Counts for the sync pill, the offline banner and the profile. */
export function useUploadSummary(): UploadSummary {
  const uploads = useOwnUploads();
  const lastSyncedAt = useUploadQueueStore((state) => state.lastSyncedAt);
  return { ...summarizeUploads(uploads), lastSyncedAt };
}

/** The header pill: all synced, N pending, N failed, or offline. */
export function useSyncPill(): SyncPillState {
  const isOnline = useIsOnline();
  const summary = useUploadSummary();
  return syncPillState(isOnline, summary);
}

/** Upload status by task id, for the task list. Progress is left out so the list does not re-render per step. */
export function useTaskUploadStatuses(): ReadonlyMap<string, UploadStatus> {
  const uploads = useOwnUploads();
  const statuses = new Map<string, UploadStatus>();
  for (const [taskId, item] of latestUploadByTask(uploads)) statuses.set(taskId, item.status);
  return statuses;
}

/** The task's submission that is still on its way to the server, with live progress, or null. */
export function useTaskUpload(taskId: string): TaskUploadInfo | null {
  const uploads = useOwnUploads();
  const item = latestUploadByTask(uploads).get(taskId) ?? null;
  const itemId = item?.id ?? null;
  const progress = useUploadProgressStore((state) =>
    itemId === null ? undefined : state.progress[itemId],
  );
  return item ? toUploadInfo(item, progress) : null;
}

/** One submission by id, or null once the server has confirmed it (or it was discarded). */
export function useUploadInfo(itemId: string | null): TaskUploadInfo | null {
  const item = useUploadQueueStore((state) =>
    itemId === null ? null : (state.items.find((candidate) => candidate.id === itemId) ?? null),
  );
  const progress = useUploadProgressStore((state) =>
    itemId === null ? undefined : state.progress[itemId],
  );
  return item ? toUploadInfo(item, progress) : null;
}
