import { randomUUID } from 'expo-crypto';

import type { SessionUser } from '@/features/auth';
import { invalidateTaskList, markTaskSubmitted } from '@/features/tasks';
import { ApiError } from '@/shared/api/apiError';
import { logger } from '@/shared/lib/logger';
import { queryClient } from '@/shared/lib/queryClient';

import { makeUploadItem } from '../../__fixtures__/uploadFixtures';
import { submissionRepository } from '../../data/submissionRepository';
import { MAX_UPLOAD_ATTEMPTS } from '../../domain/uploadRules';
import { useUploadProgressStore } from '../../store/uploadProgressStore';
import { useUploadQueueStore } from '../../store/uploadQueueStore';
import type { SubmissionInput, UploadQueueItem } from '../../types';
import { deleteQueuedPhoto, deleteUnqueuedPhotos, saveQueuedPhoto } from '../photoFiles';
import {
  discardUpload,
  discardUploadsOf,
  enqueueSubmission,
  processUploadQueue,
  retryAllUploads,
  retryUpload,
  startUploadQueue,
} from '../uploadQueue';

const USER: SessionUser = { id: 'user-1', employeeId: 'user00006', role: 'EMPLOYEE', phone: null };

const mockSession = {
  user: USER as SessionUser | null,
  listeners: [] as ((user: SessionUser | null) => void)[],
};
const mockNetwork = { online: true, listeners: [] as ((online: boolean) => void)[] };
const mockTasks = { pendingAccepts: new Set<string>(), acceptListeners: [] as (() => void)[] };
/** Photo files that exist in the fake submissions folder. */
const mockFiles = new Set<string>();

jest.mock('@/features/auth', () => ({
  getSessionUser: () => mockSession.user,
  subscribeToSessionUser: (listener: (user: SessionUser | null) => void) => {
    mockSession.listeners.push(listener);
    return () => undefined;
  },
}));
jest.mock('@/features/tasks', () => ({
  invalidateTaskList: jest.fn(() => Promise.resolve()),
  markTaskSubmitted: jest.fn(),
  isAcceptPending: (_client: unknown, taskId: string) => mockTasks.pendingAccepts.has(taskId),
  subscribeToAcceptSettled: (_client: unknown, listener: () => void) => {
    mockTasks.acceptListeners.push(listener);
    return () => undefined;
  },
}));
jest.mock('@/shared/lib/network', () => ({
  isOnline: () => mockNetwork.online,
  subscribeToOnlineStatus: (listener: (online: boolean) => void) => {
    mockNetwork.listeners.push(listener);
    return () => undefined;
  },
}));
jest.mock('@/shared/lib/queryClient', () => ({ queryClient: { name: 'test-query-client' } }));
jest.mock('@/shared/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    breadcrumb: jest.fn(),
  },
}));
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('../photoFiles', () => ({
  saveQueuedPhoto: jest.fn((_sourceUri: string, submissionId: string) => {
    const name = `${submissionId}.jpg`;
    mockFiles.add(name);
    return Promise.resolve(name);
  }),
  queuedPhotoExists: (name: string) => mockFiles.has(name),
  queuedPhotoUri: (name: string) => `file:///documents/submissions/${name}`,
  deleteQueuedPhoto: jest.fn((name: string) => {
    mockFiles.delete(name);
  }),
  deleteUnqueuedPhotos: jest.fn(),
}));
jest.mock('../../data/submissionRepository', () => ({
  submissionRepository: { uploadPhoto: jest.fn(), submitWork: jest.fn() },
}));

const uploadPhoto = jest.mocked(submissionRepository.uploadPhoto);
const submitWork = jest.mocked(submissionRepository.submitWork);

const NOW = Date.parse('2026-10-22T09:00:00.000Z');
const PHOTO_URL = 'https://bucket.s3.amazonaws.com/user00006/order/1760950000000-photo.jpg';
const INPUT: SubmissionInput = {
  taskId: 'task-1',
  taskTitle: "Men's Formal Shirts",
  taskDueDate: '2026-10-22',
  photoUri: 'file:///cache/ImageManipulator/compressed.jpg',
  completedQuantity: 120,
  acceptedQuantity: 118,
  note: 'Two collars re-stitched.',
};

function items(): UploadQueueItem[] {
  return useUploadQueueStore.getState().items;
}

function breadcrumbs(): string[] {
  return jest.mocked(logger.breadcrumb).mock.calls.map(([event]) => event);
}

function seed(...queued: UploadQueueItem[]): void {
  useUploadQueueStore.setState({ items: queued });
  for (const item of queued) mockFiles.add(item.photoName);
}

function networkError(): ApiError {
  return new ApiError({ type: 'network', message: "You're offline or the connection dropped." });
}

function serverError(): ApiError {
  return new ApiError({ type: 'server', status: 500, message: 'Something went wrong.' });
}

let startState: { items: UploadQueueItem[]; keptPhotos: unknown };

beforeAll(() => {
  // App start with one upload that was cut off and the network still down.
  mockNetwork.online = false;
  seed(makeUploadItem({ id: 'interrupted', status: 'uploading' }));
  startUploadQueue();
  startState = {
    items: items(),
    keptPhotos: jest.mocked(deleteUnqueuedPhotos).mock.calls[0]?.[0],
  };
});

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  useUploadQueueStore.setState({ items: [], lastSyncedAt: null });
  useUploadProgressStore.setState({ progress: {} });
  mockSession.user = USER;
  mockNetwork.online = true;
  mockTasks.pendingAccepts.clear();
  mockFiles.clear();
  let counter = 0;
  jest.mocked(randomUUID).mockImplementation(() => {
    counter += 1;
    return `sub-${counter}`;
  });
  uploadPhoto.mockResolvedValue(PHOTO_URL);
  submitWork.mockResolvedValue(undefined);
});

afterEach(async () => {
  await processUploadQueue();
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('startUploadQueue', () => {
  it('puts an upload cut off by a restart back in the queue and keeps its photo', () => {
    expect(startState.items).toEqual([
      expect.objectContaining({ id: 'interrupted', status: 'queued' }),
    ]);
    expect(startState.keptPhotos).toEqual(new Set(['interrupted.jpg']));
  });
});

describe('enqueueSubmission', () => {
  it('saves the photo, queues the submission and uploads it right away (brief §13)', async () => {
    const id = await enqueueSubmission(INPUT);
    await processUploadQueue();

    expect(id).toBe('sub-1');
    expect(saveQueuedPhoto).toHaveBeenCalledWith(INPUT.photoUri, 'sub-1');
    expect(uploadPhoto).toHaveBeenCalledWith(
      'task-1',
      'file:///documents/submissions/sub-1.jpg',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(submitWork).toHaveBeenCalledWith(
      'task-1',
      { completedQuantity: 120, acceptedQuantity: 118, note: INPUT.note, photoUrl: PHOTO_URL },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(items()).toEqual([]);
    expect(useUploadQueueStore.getState().lastSyncedAt).toBe(new Date(NOW).toISOString());
    expect(breadcrumbs()).toEqual(['submission_queued', 'upload_success']);
  });

  it('deletes the photo, shows the task as submitted, then refetches the tasks', async () => {
    await enqueueSubmission(INPUT);
    await processUploadQueue();

    expect(deleteQueuedPhoto).toHaveBeenCalledWith('sub-1.jpg');
    expect(markTaskSubmitted).toHaveBeenCalledWith(queryClient, 'task-1', {
      completedQuantity: 120,
      acceptedQuantity: 118,
      note: INPUT.note,
      photoUrl: PHOTO_URL,
      submittedAt: new Date(NOW).toISOString(),
    });
    expect(invalidateTaskList).toHaveBeenCalledWith(queryClient);
  });

  it('reports upload progress in 5 % steps and clears it afterwards', async () => {
    const seen: (number | undefined)[] = [];
    uploadPhoto.mockImplementation((_taskId, _uri, options) => {
      options?.onProgress?.(0.33);
      seen.push(useUploadProgressStore.getState().progress['sub-1']);
      options?.onProgress?.(0.34);
      seen.push(useUploadProgressStore.getState().progress['sub-1']);
      return Promise.resolve(PHOTO_URL);
    });

    await enqueueSubmission(INPUT);
    await processUploadQueue();

    // The photo is 90 % of the bar: 0.33 → 0.297 → 25 %, 0.34 → 0.306 → 30 %.
    expect(seen).toEqual([0.25, 0.3]);
    expect(useUploadProgressStore.getState().progress).toEqual({});
  });

  it("replaces the task's failed submission with the new one", async () => {
    mockNetwork.online = false;
    seed(makeUploadItem({ id: 'old', status: 'failed' }));

    await enqueueSubmission(INPUT);

    expect(items().map((item) => item.id)).toEqual(['sub-1']);
    expect(deleteQueuedPhoto).toHaveBeenCalledWith('old.jpg');
  });
});

describe('processUploadQueue', () => {
  it('keeps work on the device while offline and uploads it when the connection returns', async () => {
    mockNetwork.online = false;
    await enqueueSubmission(INPUT);
    await processUploadQueue();

    expect(uploadPhoto).not.toHaveBeenCalled();
    expect(items()).toEqual([expect.objectContaining({ status: 'queued', attempts: 0 })]);

    mockNetwork.online = true;
    for (const listener of mockNetwork.listeners) listener(true);
    await processUploadQueue();

    expect(items()).toEqual([]);
  });

  it('retries a failed attempt after an exponential backoff', async () => {
    uploadPhoto.mockRejectedValueOnce(networkError());
    await enqueueSubmission(INPUT);
    await processUploadQueue();

    expect(items()[0]).toMatchObject({
      status: 'queued',
      attempts: 1,
      nextAttemptAt: NOW + 5_000,
      lastError: { type: 'network', retryable: true },
    });
    expect(breadcrumbs()).toEqual(['submission_queued', 'upload_failure']);

    await jest.advanceTimersByTimeAsync(4_999);
    expect(uploadPhoto).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    await processUploadQueue();
    expect(uploadPhoto).toHaveBeenCalledTimes(2);
    expect(items()).toEqual([]);
  });

  it('fails at once when the server rejects the submission, and keeps its message', async () => {
    const message = 'You are not authorized to submit work for this assignment.';
    submitWork.mockRejectedValueOnce(new ApiError({ type: 'validation', status: 400, message }));

    await enqueueSubmission(INPUT);
    await processUploadQueue();

    expect(items()[0]).toMatchObject({
      status: 'failed',
      attempts: 1,
      lastError: { type: 'validation', message, retryable: false },
    });
    expect(jest.getTimerCount()).toBe(0);
  });

  it('skips the photo on the next attempt once it has uploaded (API_CONTRACT Gap 7)', async () => {
    submitWork.mockRejectedValueOnce(serverError());
    await enqueueSubmission(INPUT);
    await processUploadQueue();

    expect(items()[0]).toMatchObject({ status: 'queued', photoUrl: PHOTO_URL, attempts: 1 });

    retryUpload('sub-1');
    await processUploadQueue();

    expect(uploadPhoto).toHaveBeenCalledTimes(1);
    expect(submitWork).toHaveBeenCalledTimes(2);
    expect(items()).toEqual([]);
  });

  it("holds a task's submission until the task's accept reaches the server", async () => {
    mockTasks.pendingAccepts.add('task-1');
    await enqueueSubmission(INPUT);
    await processUploadQueue();

    expect(uploadPhoto).not.toHaveBeenCalled();

    mockTasks.pendingAccepts.delete('task-1');
    for (const listener of mockTasks.acceptListeners) listener();
    await processUploadQueue();

    expect(items()).toEqual([]);
  });

  it('does not count an attempt cut short by sign-out or by losing the connection', async () => {
    uploadPhoto.mockImplementationOnce(() => {
      // A 401 ends the session before the request rejects (the HTTP client's onSessionExpired).
      mockSession.user = null;
      return Promise.reject(
        new ApiError({ type: 'unauthorized', status: 401, message: 'Your session has ended.' }),
      );
    });
    await enqueueSubmission(INPUT);
    await processUploadQueue();

    expect(items()[0]).toMatchObject({ status: 'queued', attempts: 0, nextAttemptAt: null });

    mockSession.user = USER;
    uploadPhoto.mockImplementationOnce(() => {
      mockNetwork.online = false;
      return Promise.reject(networkError());
    });
    await processUploadQueue();

    expect(items()[0]).toMatchObject({ status: 'queued', attempts: 0, nextAttemptAt: null });
  });

  it('waits for the user after the last attempt, and a manual retry starts over', async () => {
    seed(makeUploadItem({ id: 'sub-9', attempts: MAX_UPLOAD_ATTEMPTS - 1 }));
    uploadPhoto.mockRejectedValueOnce(networkError());
    await processUploadQueue();

    expect(items()[0]).toMatchObject({ status: 'failed', attempts: MAX_UPLOAD_ATTEMPTS });

    retryUpload('sub-9');
    await processUploadQueue();

    expect(items()).toEqual([]);
  });

  it('fails without uploading when the saved photo is gone', async () => {
    useUploadQueueStore.setState({ items: [makeUploadItem({ id: 'sub-7' })] });
    await processUploadQueue();

    expect(uploadPhoto).not.toHaveBeenCalled();
    expect(items()[0]).toMatchObject({
      status: 'failed',
      lastError: { type: 'photoMissing', retryable: false },
    });
  });

  it("leaves another user's submissions on the device", async () => {
    seed(makeUploadItem({ id: 'theirs', ownerId: 'user-2' }));
    await processUploadQueue();

    expect(uploadPhoto).not.toHaveBeenCalled();
    expect(items()).toHaveLength(1);
  });

  it('uploads waiting work when its owner signs in again', async () => {
    mockSession.user = null;
    seed(makeUploadItem({ id: 'sub-5' }));
    await processUploadQueue();
    expect(uploadPhoto).not.toHaveBeenCalled();

    mockSession.user = USER;
    for (const listener of mockSession.listeners) listener(USER);
    await processUploadQueue();

    expect(items()).toEqual([]);
  });
});

describe('manual actions', () => {
  it('"Sync now" retries what can be retried and skips any wait', async () => {
    seed(
      makeUploadItem({
        id: 'failed',
        status: 'failed',
        attempts: MAX_UPLOAD_ATTEMPTS,
        lastError: { type: 'network', message: 'Offline', retryable: true },
      }),
      makeUploadItem({ id: 'waiting', taskId: 'task-2', attempts: 2, nextAttemptAt: NOW + 60_000 }),
      makeUploadItem({
        id: 'rejected',
        taskId: 'task-3',
        status: 'failed',
        lastError: { type: 'validation', message: 'Rejected', retryable: false },
      }),
    );

    retryAllUploads();
    await processUploadQueue();

    expect(items().map((item) => item.id)).toEqual(['rejected']);
    expect(submitWork).toHaveBeenCalledTimes(2);
  });

  it('discards a submission and its photo', async () => {
    mockNetwork.online = false;
    await enqueueSubmission(INPUT);

    discardUpload('sub-1');

    expect(items()).toEqual([]);
    expect(deleteQueuedPhoto).toHaveBeenCalledWith('sub-1.jpg');
  });

  it('cancels the request when the submission being uploaded is discarded', async () => {
    let signal: AbortSignal | undefined;
    uploadPhoto.mockImplementationOnce(
      (_taskId, _uri, options) =>
        new Promise((_resolve, reject) => {
          signal = options?.signal;
          signal?.addEventListener('abort', () => {
            reject(new ApiError({ type: 'cancelled', message: 'The request was cancelled.' }));
          });
        }),
    );

    await enqueueSubmission(INPUT);
    discardUpload('sub-1');
    await processUploadQueue();

    expect(signal?.aborted).toBe(true);
    expect(submitWork).not.toHaveBeenCalled();
    expect(items()).toEqual([]);
  });

  it("discards every unsent submission of one user and nobody else's", () => {
    seed(
      makeUploadItem({ id: 'a' }),
      makeUploadItem({ id: 'b', taskId: 'task-2' }),
      makeUploadItem({ id: 'theirs', ownerId: 'user-2' }),
    );
    useUploadQueueStore.setState({ lastSyncedAt: new Date(NOW).toISOString() });

    discardUploadsOf('user-1');

    expect(items().map((item) => item.id)).toEqual(['theirs']);
    expect(deleteQueuedPhoto).toHaveBeenCalledWith('a.jpg');
    expect(deleteQueuedPhoto).toHaveBeenCalledWith('b.jpg');
    expect(useUploadQueueStore.getState().lastSyncedAt).toBeNull();
  });
});
