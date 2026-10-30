import type { ApiErrorType } from '@/shared/api/apiError';
import type { CalendarDate } from '@/shared/utils/date';

/** queued: waiting for its turn, the network or a retry · uploading: in progress · failed: needs the user. */
export type UploadStatus = 'queued' | 'uploading' | 'failed';

/** Why an upload failed. `photoMissing`: the queued photo file is gone from the device. */
export type UploadErrorType = ApiErrorType | 'photoMissing';

export interface UploadError {
  type: UploadErrorType;
  /** Safe to show to the user. */
  message: string;
  /** False when trying again cannot help (validation, not found, forbidden, missing photo). */
  retryable: boolean;
}

/** One submission on its way to the server. Persisted in MMKV until the server confirms it. */
export interface UploadQueueItem {
  /** The clientSubmissionId (randomUUID). The backend cannot take it yet (API_CONTRACT Gap 8). */
  id: string;
  taskId: string;
  /** The user who made it. Only their session uploads it or lists it. */
  ownerId: string;
  /** Snapshot for the sync center, in case the task leaves the cache. */
  taskTitle: string;
  taskDueDate: CalendarDate;
  /**
   * The photo's file name in the app's submissions folder. A name, not a URI: iOS moves the app's
   * data folder when the app updates, so a saved absolute path would go stale.
   */
  photoName: string;
  /** Set once the photo upload succeeds, so a retry goes straight to submit-work (API_CONTRACT Gap 7). */
  photoUrl: string | null;
  completedQuantity: number;
  acceptedQuantity: number | null;
  note: string | null;
  createdAt: string;
  status: UploadStatus;
  /** Failed attempts that counted toward MAX_UPLOAD_ATTEMPTS. */
  attempts: number;
  /** Epoch ms before which the item is not retried (backoff). */
  nextAttemptAt: number | null;
  lastError: UploadError | null;
}

/** What the submit form hands to the queue. */
export interface SubmissionInput {
  taskId: string;
  taskTitle: string;
  taskDueDate: CalendarDate;
  /** The compressed photo, still in the cache directory. */
  photoUri: string;
  completedQuantity: number;
  acceptedQuantity: number | null;
  note: string | null;
}

/** A task's submission on its way to the server, as other features see it. */
export interface TaskUploadInfo {
  itemId: string;
  status: UploadStatus;
  /** 0 to 1 while uploading, otherwise null. */
  progress: number | null;
  /** Queued, but waiting for the backoff delay after a failed attempt. */
  isWaitingToRetry: boolean;
  error: UploadError | null;
  canRetry: boolean;
}

export interface UploadSummary {
  /** Queued or uploading. */
  pendingCount: number;
  failedCount: number;
  lastSyncedAt: string | null;
}
