/**
 * The upload queue (brief §13). A submission is saved on the device first, then uploaded in two
 * steps (photo, then quantities) whenever the user is signed in and online. Failures back off and
 * retry; after MAX_UPLOAD_ATTEMPTS, or at once when retrying cannot help, the item waits as "failed"
 * for the user. The task shows as "Submitting" until the server confirms.
 */
import { focusManager } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { getSessionUser, subscribeToSessionUser } from '@/features/auth';
import {
  invalidateTaskList,
  isAcceptPending,
  markTaskSubmitted,
  subscribeToAcceptSettled,
} from '@/features/tasks';
import { toApiError } from '@/shared/api/apiError';
import { logger } from '@/shared/lib/logger';
import { isOnline, subscribeToOnlineStatus } from '@/shared/lib/network';
import { queryClient } from '@/shared/lib/queryClient';

import { submissionRepository } from '../data/submissionRepository';
import {
  canRetryUpload,
  decideAfterFailure,
  nextRetryAt,
  ownUploads,
  PHOTO_PROGRESS_SHARE,
  pickNextUpload,
} from '../domain/uploadRules';
import { useUploadProgressStore } from '../store/uploadProgressStore';
import { useUploadQueueStore } from '../store/uploadQueueStore';
import type { SubmissionInput, UploadError, UploadQueueItem } from '../types';

import {
  deleteQueuedPhoto,
  deleteUnqueuedPhotos,
  queuedPhotoExists,
  queuedPhotoUri,
  saveQueuedPhoto,
} from './photoFiles';

/** Progress moves in 5 % steps, so a slow upload does not re-render the screen for every chunk. */
const PROGRESS_STEPS = 20;

const MISSING_PHOTO_ERROR: UploadError = {
  type: 'photoMissing',
  message:
    'The photo for this submission is no longer on this device. Take a new photo to submit again.',
  retryable: false,
};

let started = false;
let currentRun: Promise<void> | null = null;
let rerunRequested = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
/** The upload in flight, so discarding it can cancel the request. */
let activeUpload: { itemId: string; controller: AbortController } | null = null;

function findItem(id: string): UploadQueueItem | undefined {
  return useUploadQueueStore.getState().items.find((item) => item.id === id);
}

function setProgress(itemId: string, fraction: number): void {
  const stepped = Math.floor(Math.min(Math.max(fraction, 0), 1) * PROGRESS_STEPS) / PROGRESS_STEPS;
  const store = useUploadProgressStore.getState();
  if (store.progress[itemId] !== stepped) store.setProgress(itemId, stepped);
}

function removeItem(item: UploadQueueItem): void {
  deleteQueuedPhoto(item.photoName);
  useUploadQueueStore.getState().removeItem(item.id);
  useUploadProgressStore.getState().clearProgress(item.id);
}

function failItem(item: UploadQueueItem, attempts: number, error: UploadError): void {
  useUploadQueueStore
    .getState()
    .updateItem(item.id, { status: 'failed', attempts, nextAttemptAt: null, lastError: error });
  logger.warn('Upload needs the user', {
    taskId: item.taskId,
    submissionId: item.id,
    errorType: error.type,
    attempts,
  });
}

/** After success: delete the local file, show the task as submitted, then refetch the tasks. */
function completeItem(item: UploadQueueItem, photoUrl: string): void {
  const syncedAt = new Date().toISOString();
  deleteQueuedPhoto(item.photoName);
  markTaskSubmitted(queryClient, item.taskId, {
    completedQuantity: item.completedQuantity,
    acceptedQuantity: item.acceptedQuantity,
    note: item.note,
    photoUrl,
    submittedAt: syncedAt,
  });
  useUploadQueueStore.getState().completeItem(item.id, syncedAt);
  logger.breadcrumb('upload_success', {
    taskId: item.taskId,
    submissionId: item.id,
    attempt: item.attempts + 1,
  });
  void invalidateTaskList(queryClient);
}

function handleFailure(item: UploadQueueItem, error: unknown): void {
  const apiError = toApiError(error);
  const decision = decideAfterFailure(apiError, item.attempts, isOnline());
  const { updateItem } = useUploadQueueStore.getState();

  if (decision.kind === 'requeue') {
    // Offline, signed out or cancelled: not the submission's fault, so the attempt does not count.
    updateItem(item.id, { status: 'queued', nextAttemptAt: null });
    return;
  }

  const lastError: UploadError = {
    type: apiError.type,
    message: apiError.message,
    retryable: apiError.isRetryable,
  };
  logger.breadcrumb('upload_failure', {
    taskId: item.taskId,
    submissionId: item.id,
    errorType: apiError.type,
    status: apiError.status,
    attempt: decision.attempts,
    willRetry: decision.kind === 'retry',
  });

  if (decision.kind === 'retry') {
    updateItem(item.id, {
      status: 'queued',
      attempts: decision.attempts,
      nextAttemptAt: Date.now() + decision.delayMs,
      lastError,
    });
    return;
  }
  failItem(item, decision.attempts, lastError);
}

async function uploadItem(item: UploadQueueItem): Promise<void> {
  if (item.photoUrl === null && !queuedPhotoExists(item.photoName)) {
    logger.error('A queued photo is missing', undefined, { submissionId: item.id });
    failItem(item, item.attempts, MISSING_PHOTO_ERROR);
    return;
  }

  const controller = new AbortController();
  activeUpload = { itemId: item.id, controller };
  useUploadQueueStore.getState().updateItem(item.id, { status: 'uploading', nextAttemptAt: null });
  setProgress(item.id, 0);

  try {
    let { photoUrl } = item;
    if (photoUrl === null) {
      photoUrl = await submissionRepository.uploadPhoto(
        item.taskId,
        queuedPhotoUri(item.photoName),
        {
          signal: controller.signal,
          onProgress: (fraction) => {
            setProgress(item.id, fraction * PHOTO_PROGRESS_SHARE);
          },
        },
      );
      // Saved at once, so a retry after this point skips the photo (API_CONTRACT Gap 7).
      useUploadQueueStore.getState().updateItem(item.id, { photoUrl });
    }
    setProgress(item.id, PHOTO_PROGRESS_SHARE);
    await submissionRepository.submitWork(
      item.taskId,
      {
        completedQuantity: item.completedQuantity,
        acceptedQuantity: item.acceptedQuantity,
        note: item.note,
        photoUrl,
      },
      { signal: controller.signal },
    );
    completeItem(item, photoUrl);
  } catch (error) {
    handleFailure(item, error);
  } finally {
    activeUpload = null;
    useUploadProgressStore.getState().clearProgress(item.id);
  }
}

/** Uploads due items one at a time, oldest first, each at most once per pass. */
async function drainQueue(): Promise<void> {
  const attempted = new Set<string>();
  for (;;) {
    const user = getSessionUser();
    if (!user || !isOnline()) return;
    const candidates = ownUploads(useUploadQueueStore.getState().items, user.id).filter(
      // An accept still on its way must reach the server before the task's submission does.
      (item) => !attempted.has(item.id) && !isAcceptPending(queryClient, item.taskId),
    );
    const item = pickNextUpload(candidates, Date.now());
    if (!item) return;
    attempted.add(item.id);
    await uploadItem(item);
  }
}

/** Wakes the queue when the next backoff wait ends (while the app is open; foregrounding also wakes it). */
function scheduleRetry(): void {
  if (retryTimer !== null) clearTimeout(retryTimer);
  retryTimer = null;
  const user = getSessionUser();
  if (!user) return;
  const now = Date.now();
  const wakeAt = nextRetryAt(ownUploads(useUploadQueueStore.getState().items, user.id), now);
  if (wakeAt === null) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void processUploadQueue();
  }, wakeAt - now);
}

/** Processes the queue now. Calls during a run share it, and the run makes one more pass for them. */
export function processUploadQueue(): Promise<void> {
  if (currentRun) {
    rerunRequested = true;
    return currentRun;
  }
  currentRun = (async () => {
    try {
      do {
        rerunRequested = false;
        await drainQueue();
      } while (rerunRequested);
    } catch (error) {
      logger.error('The upload queue stopped unexpectedly', error);
    } finally {
      currentRun = null;
      scheduleRetry();
    }
  })();
  return currentRun;
}

/**
 * Saves a submission on this device and starts uploading it (brief §13): a clientSubmissionId, the
 * photo copied into the document directory, the item persisted in the queue, then an immediate
 * upload attempt. Resolves with the submission id once the submission is safely stored; the upload
 * continues in the background. Rejects only when the device cannot store it.
 */
export async function enqueueSubmission(input: SubmissionInput): Promise<string> {
  const user = getSessionUser();
  if (!user) throw new Error('No signed-in user to queue the submission for.');

  const id = randomUUID();
  const photoName = await saveQueuedPhoto(input.photoUri, id);

  // A new submission replaces the task's earlier ones that are not mid-upload (normally a failed one).
  for (const earlier of ownUploads(useUploadQueueStore.getState().items, user.id)) {
    if (earlier.taskId === input.taskId && earlier.status !== 'uploading') removeItem(earlier);
  }

  useUploadQueueStore.getState().addItem({
    id,
    taskId: input.taskId,
    ownerId: user.id,
    taskTitle: input.taskTitle,
    taskDueDate: input.taskDueDate,
    photoName,
    photoUrl: null,
    completedQuantity: input.completedQuantity,
    acceptedQuantity: input.acceptedQuantity,
    note: input.note,
    createdAt: new Date().toISOString(),
    status: 'queued',
    attempts: 0,
    nextAttemptAt: null,
    lastError: null,
  });
  logger.breadcrumb('submission_queued', { taskId: input.taskId, submissionId: id });
  void processUploadQueue();
  return id;
}

/** Manual retry: a fresh set of attempts for a failed item, or right away for one waiting out its backoff. */
export function retryUpload(id: string): void {
  const item = findItem(id);
  if (!item || item.status === 'uploading') return;
  useUploadQueueStore
    .getState()
    .updateItem(id, { status: 'queued', attempts: 0, nextAttemptAt: null, lastError: null });
  void processUploadQueue();
}

/** "Sync now": retries every failed item that retrying can help, and skips any backoff wait. */
export function retryAllUploads(): void {
  const user = getSessionUser();
  if (!user) return;
  const { items, updateItem } = useUploadQueueStore.getState();
  for (const item of ownUploads(items, user.id)) {
    if (canRetryUpload(item)) {
      updateItem(item.id, { status: 'queued', attempts: 0, nextAttemptAt: null, lastError: null });
    } else if (item.status === 'queued' && item.nextAttemptAt !== null) {
      updateItem(item.id, { nextAttemptAt: null });
    }
  }
  void processUploadQueue();
}

/** Deletes a submission from this device without uploading it, cancelling the upload if one is running. */
export function discardUpload(id: string): void {
  const item = findItem(id);
  if (!item) return;
  if (activeUpload?.itemId === id) activeUpload.controller.abort();
  removeItem(item);
}

/**
 * Explicit sign-out, after the user confirmed it: deletes every unsent submission of that user, with
 * its photo, and forgets the last sync time. Other users' submissions stay for their next sign-in.
 */
export function discardUploadsOf(ownerId: string): void {
  for (const item of ownUploads(useUploadQueueStore.getState().items, ownerId)) {
    discardUpload(item.id);
  }
  useUploadQueueStore.setState({ lastSyncedAt: null });
}

/**
 * Starts the queue once, at app start: repairs uploads cut off when the app was killed, deletes stray
 * photo files, and processes the queue whenever the device comes online, the app returns to the
 * foreground, a user signs in, or an accept the queue was waiting for finishes.
 */
export function startUploadQueue(): void {
  if (started) return;
  started = true;

  // The store is already hydrated: MMKV storage is synchronous.
  const { items, updateItem } = useUploadQueueStore.getState();
  for (const item of items) {
    if (item.status === 'uploading') updateItem(item.id, { status: 'queued' });
  }
  // Synchronous and before any enqueue can start, so a photo being queued is never mistaken for a stray.
  deleteUnqueuedPhotos(new Set(items.map((item) => item.photoName)));

  subscribeToOnlineStatus((online) => {
    if (online) void processUploadQueue();
  });
  focusManager.subscribe((focused) => {
    if (focused) void processUploadQueue();
  });
  subscribeToSessionUser((user) => {
    if (user) void processUploadQueue();
    else scheduleRetry(); // Clears the retry timer.
  });
  subscribeToAcceptSettled(queryClient, () => {
    void processUploadQueue();
  });
  void processUploadQueue();
}
