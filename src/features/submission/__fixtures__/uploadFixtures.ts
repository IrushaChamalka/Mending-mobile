import type { UploadQueueItem } from '../types';

/** A queued submission with sensible defaults for tests; override what the test is about. */
export function makeUploadItem(overrides: Partial<UploadQueueItem> = {}): UploadQueueItem {
  const id = overrides.id ?? 'sub-0';
  return {
    id,
    taskId: 'task-1',
    ownerId: 'user-1',
    taskTitle: "Men's Formal Shirts",
    taskDueDate: '2026-10-22',
    photoName: `${id}.jpg`,
    photoUrl: null,
    completedQuantity: 120,
    acceptedQuantity: null,
    note: null,
    createdAt: '2026-10-22T08:00:00.000Z',
    status: 'queued',
    attempts: 0,
    nextAttemptAt: null,
    lastError: null,
    ...overrides,
  };
}
