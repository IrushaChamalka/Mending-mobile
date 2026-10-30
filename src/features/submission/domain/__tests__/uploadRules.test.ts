import type { ApiErrorType } from '@/shared/api/apiError';

import { makeUploadItem } from '../../__fixtures__/uploadFixtures';
import {
  canRetryUpload,
  decideAfterFailure,
  isUploadDue,
  latestUploadByTask,
  MAX_RETRY_DELAY_MS,
  MAX_UPLOAD_ATTEMPTS,
  nextRetryAt,
  ownUploads,
  pickNextUpload,
  queueRowBadge,
  retryDelayMs,
  summarizeUploads,
  syncPillState,
  uploadBadgeFor,
} from '../uploadRules';

const NOW = Date.parse('2026-10-22T09:00:00.000Z');

function failure(
  type: ApiErrorType,
  isRetryable = true,
): { type: ApiErrorType; isRetryable: boolean } {
  return { type, isRetryable };
}

describe('retryDelayMs', () => {
  it('doubles from 5 seconds', () => {
    expect([1, 2, 3, 4].map(retryDelayMs)).toEqual([5_000, 10_000, 20_000, 40_000]);
  });

  it('never waits longer than 10 minutes', () => {
    expect(retryDelayMs(20)).toBe(MAX_RETRY_DELAY_MS);
  });
});

describe('decideAfterFailure', () => {
  it('waits without counting the attempt when the session ended or the request was cancelled', () => {
    expect(decideAfterFailure(failure('unauthorized', false), 3, true)).toEqual({
      kind: 'requeue',
    });
    expect(decideAfterFailure(failure('cancelled', false), 3, true)).toEqual({ kind: 'requeue' });
  });

  it('waits for the network without counting the attempt when the connection is gone', () => {
    expect(decideAfterFailure(failure('network'), 2, false)).toEqual({ kind: 'requeue' });
    expect(decideAfterFailure(failure('timeout'), 2, false)).toEqual({ kind: 'requeue' });
  });

  it('retries a network failure while online, with backoff', () => {
    expect(decideAfterFailure(failure('network'), 0, true)).toEqual({
      kind: 'retry',
      attempts: 1,
      delayMs: 5_000,
    });
    expect(decideAfterFailure(failure('server'), 2, true)).toEqual({
      kind: 'retry',
      attempts: 3,
      delayMs: 20_000,
    });
  });

  it('fails at once when retrying cannot help (brief §13: 4xx is not retryable)', () => {
    expect(decideAfterFailure(failure('validation', false), 0, true)).toEqual({
      kind: 'fail',
      attempts: 1,
    });
    expect(decideAfterFailure(failure('notFound', false), 0, true)).toEqual({
      kind: 'fail',
      attempts: 1,
    });
  });

  it('fails after the last attempt', () => {
    expect(decideAfterFailure(failure('network'), MAX_UPLOAD_ATTEMPTS - 1, true)).toEqual({
      kind: 'fail',
      attempts: MAX_UPLOAD_ATTEMPTS,
    });
  });
});

describe('isUploadDue', () => {
  it('is due when queued without a wait, or when the wait is over', () => {
    expect(isUploadDue({ status: 'queued', nextAttemptAt: null }, NOW)).toBe(true);
    expect(isUploadDue({ status: 'queued', nextAttemptAt: NOW }, NOW)).toBe(true);
    expect(isUploadDue({ status: 'queued', nextAttemptAt: NOW + 1_000 }, NOW)).toBe(false);
  });

  it('treats a wait longer than any backoff as a clock that moved back', () => {
    expect(
      isUploadDue({ status: 'queued', nextAttemptAt: NOW + MAX_RETRY_DELAY_MS + 1 }, NOW),
    ).toBe(true);
  });

  it('is never due while uploading or failed', () => {
    expect(isUploadDue({ status: 'uploading', nextAttemptAt: null }, NOW)).toBe(false);
    expect(isUploadDue({ status: 'failed', nextAttemptAt: null }, NOW)).toBe(false);
  });
});

describe('pickNextUpload and nextRetryAt', () => {
  const older = makeUploadItem({ id: 'older', createdAt: '2026-10-22T07:00:00.000Z' });
  const newer = makeUploadItem({ id: 'newer', createdAt: '2026-10-22T08:00:00.000Z' });
  const waiting = makeUploadItem({
    id: 'waiting',
    createdAt: '2026-10-22T06:00:00.000Z',
    nextAttemptAt: NOW + 20_000,
  });

  it('uploads the oldest due submission first', () => {
    expect(pickNextUpload([newer, waiting, older], NOW)?.id).toBe('older');
  });

  it('returns null when nothing is due', () => {
    expect(pickNextUpload([waiting, makeUploadItem({ status: 'failed' })], NOW)).toBeNull();
  });

  it('wakes up when the earliest wait ends', () => {
    const later = makeUploadItem({ id: 'later', nextAttemptAt: NOW + 60_000 });
    expect(nextRetryAt([later, waiting, older], NOW)).toBe(NOW + 20_000);
    expect(nextRetryAt([older], NOW)).toBeNull();
  });
});

describe('queue summaries', () => {
  const items = [
    makeUploadItem({ id: 'a', taskId: 'task-1', createdAt: '2026-10-22T07:00:00.000Z' }),
    makeUploadItem({ id: 'b', taskId: 'task-1', createdAt: '2026-10-22T08:00:00.000Z' }),
    makeUploadItem({ id: 'c', taskId: 'task-2', status: 'failed' }),
    makeUploadItem({ id: 'd', ownerId: 'someone-else' }),
  ];

  it("keeps the signed-in user's items only", () => {
    expect(ownUploads(items, 'user-1').map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(ownUploads(items, null)).toEqual([]);
  });

  it('counts pending and failed submissions', () => {
    expect(summarizeUploads(ownUploads(items, 'user-1'))).toEqual({
      pendingCount: 2,
      failedCount: 1,
    });
  });

  it('keeps the newest submission per task', () => {
    const latest = latestUploadByTask(ownUploads(items, 'user-1'));
    expect(latest.get('task-1')?.id).toBe('b');
    expect(latest.get('task-2')?.id).toBe('c');
  });
});

describe('canRetryUpload', () => {
  it('offers retry for failures the connection or the server caused', () => {
    const lastError = { type: 'network' as const, message: 'Offline', retryable: true };
    expect(canRetryUpload({ status: 'failed', lastError })).toBe(true);
  });

  it('does not offer retry when the submission itself was rejected', () => {
    const lastError = { type: 'validation' as const, message: 'Rejected', retryable: false };
    expect(canRetryUpload({ status: 'failed', lastError })).toBe(false);
    expect(canRetryUpload({ status: 'queued', lastError: null })).toBe(false);
  });
});

describe('badges', () => {
  it('shows a task as "Submitting" until the server confirms it (brief §13)', () => {
    expect(uploadBadgeFor('queued')).toEqual({ label: 'Submitting', tone: 'warning' });
    expect(uploadBadgeFor('uploading')).toEqual({ label: 'Submitting', tone: 'warning' });
    expect(uploadBadgeFor('failed')).toEqual({ label: 'Upload failed', tone: 'danger' });
  });

  it('returns the same object every time, so memoised rows stay put', () => {
    expect(uploadBadgeFor('queued')).toBe(uploadBadgeFor('queued'));
  });

  it('labels sync center rows by what they are doing', () => {
    expect(queueRowBadge(makeUploadItem(), true).label).toBe('Pending');
    expect(queueRowBadge(makeUploadItem(), false).label).toBe('Waiting');
    expect(queueRowBadge(makeUploadItem({ status: 'uploading' }), true).label).toBe('Uploading');
    expect(queueRowBadge(makeUploadItem({ status: 'failed' }), true).label).toBe('Failed');
  });
});

describe('syncPillState', () => {
  it('is synced with nothing waiting', () => {
    expect(syncPillState(true, { pendingCount: 0, failedCount: 0 }).status).toBe('synced');
  });

  it('shows failures before pending uploads while online', () => {
    expect(syncPillState(true, { pendingCount: 2, failedCount: 1 }).status).toBe('failed');
    expect(syncPillState(true, { pendingCount: 2, failedCount: 0 }).status).toBe('pending');
  });

  it('counts everything unsent as pending while offline', () => {
    expect(syncPillState(false, { pendingCount: 2, failedCount: 1 })).toEqual({
      status: 'offline',
      pendingCount: 3,
      failedCount: 1,
    });
  });
});
