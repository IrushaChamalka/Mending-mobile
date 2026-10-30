import { router } from 'expo-router';
import { useState } from 'react';

import { invalidateTaskList } from '@/features/tasks';
import { useIsOnline } from '@/shared/hooks/useIsOnline';
import { useToday } from '@/shared/hooks/useToday';
import { queryClient } from '@/shared/lib/queryClient';
import { formatCalendarDate, formatRecentTime, type CalendarDate } from '@/shared/utils/date';
import { formatCount } from '@/shared/utils/number';

import {
  canRetryUpload,
  queueRowBadge,
  type SyncPillState,
  type UploadBadge,
} from '../domain/uploadRules';
import { discardUpload, retryAllUploads, retryUpload } from '../services/uploadQueue';
import type { UploadErrorType, UploadQueueItem } from '../types';

import { useOwnUploads, useSyncPill, useUploadSummary } from './useUploads';

export interface SyncQueueRow {
  id: string;
  title: string;
  subtitle: string;
  badge: UploadBadge;
  /** Shown for failures that trying again can fix. */
  canRetry: boolean;
  /** Shown for failures that trying again cannot fix, so the row can be cleared. */
  canDiscard: boolean;
}

export interface SyncCenterViewModel {
  isOnline: boolean;
  syncPill: SyncPillState;
  lastSyncedLabel: string;
  rows: SyncQueueRow[];
  pendingCount: number;
  isSyncing: boolean;
  syncNow: () => void;
  retry: (id: string) => void;
  /** The row waiting for the discard confirmation, if any. */
  discardCandidate: SyncQueueRow | null;
  askToDiscard: (id: string) => void;
  confirmDiscard: () => void;
  cancelDiscard: () => void;
  goBack: () => void;
}

/** One line for a failed row; the task screen shows the full message. */
const FAILURE_REASONS: Record<Exclude<UploadErrorType, 'validation'>, string> = {
  network: 'Connection problem',
  timeout: 'Connection too slow',
  server: 'Server problem',
  notFound: 'Task no longer exists',
  forbidden: 'Not allowed for this account',
  unauthorized: 'Signed out',
  cancelled: 'Cancelled',
  photoMissing: 'Photo missing from this phone',
};

function toRow(item: UploadQueueItem, isOnline: boolean, today: CalendarDate): SyncQueueRow {
  const error = item.status === 'failed' ? item.lastError : null;
  let subtitle = `${formatCalendarDate(item.taskDueDate, today)} · ${formatCount(item.completedQuantity)} completed`;
  if (error) {
    // The backend's own validation message is the most useful explanation.
    subtitle = error.type === 'validation' ? error.message : FAILURE_REASONS[error.type];
  }
  const canRetry = canRetryUpload(item);
  return {
    id: item.id,
    title: item.taskTitle,
    subtitle,
    badge: queueRowBadge(item, isOnline),
    canRetry,
    canDiscard: item.status === 'failed' && !canRetry,
  };
}

/** The sync center (M 6.1 without the conflict card): the upload queue, retry, discard, "Sync now". */
export function useSyncCenterViewModel(): SyncCenterViewModel {
  const uploads = useOwnUploads();
  const summary = useUploadSummary();
  const syncPill = useSyncPill();
  const isOnline = useIsOnline();
  const today = useToday();
  const [discardId, setDiscardId] = useState<string | null>(null);

  const rows = uploads.map((item) => toRow(item, isOnline, today));
  const discardCandidate = rows.find((row) => row.id === discardId) ?? null;

  return {
    isOnline,
    syncPill,
    lastSyncedLabel: summary.lastSyncedAt
      ? `Last synced ${formatRecentTime(summary.lastSyncedAt, today)}`
      : 'Nothing uploaded yet',
    rows,
    pendingCount: summary.pendingCount + summary.failedCount,
    isSyncing: uploads.some((item) => item.status === 'uploading'),
    syncNow: () => {
      retryAllUploads();
      void invalidateTaskList(queryClient);
    },
    retry: retryUpload,
    discardCandidate,
    askToDiscard: setDiscardId,
    confirmDiscard: () => {
      if (discardId) discardUpload(discardId);
      setDiscardId(null);
    },
    cancelDiscard: () => {
      setDiscardId(null);
    },
    goBack: () => {
      if (router.canGoBack()) router.back();
      else router.replace('/');
    },
  };
}
