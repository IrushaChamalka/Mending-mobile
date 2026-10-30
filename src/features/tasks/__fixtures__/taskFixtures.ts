import type { Task } from '../types';

/** A task with sensible defaults for tests; override what the test is about. */
export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Mending · 120 garments',
    garment: { description: 'Denim jacket', color: 'Indigo', size: 'M, L, XL', styleNumber: null },
    status: 'ASSIGNED',
    dueDate: '2026-10-22',
    target: { value: 120, unit: 'garments', achieved: 0 },
    latestSubmission: null,
    review: null,
    instructions: null,
    serviceName: 'Mending',
    orderNumber: 'ORD-2026-0142',
    customerName: 'Lanka Apparel Ltd',
    location: 'Biyagama',
    acceptedAt: null,
    payout: { unitRate: 18, estimated: 2160, completed: 0, accepted: 0 },
    rejectionReason: null,
    ...overrides,
  };
}
