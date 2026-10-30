import type { TaskStatus } from '../../types';
import {
  acceptLocally,
  applyPendingAccepts,
  canAcceptTask,
  canSubmitTask,
  getProgressCounts,
  getTargetProgress,
  isOverdue,
  submitLocally,
} from '../taskRules';

import { makeTask } from '../../__fixtures__/taskFixtures';

describe('canAcceptTask and canSubmitTask', () => {
  it.each<[TaskStatus, boolean, boolean]>([
    ['ASSIGNED', true, false],
    ['ACCEPTED', false, true],
    ['IN_PROGRESS', false, true],
    ['SUBMITTED', false, false],
    ['REVIEWED', false, false],
    ['REJECTED', false, false],
    ['CANCELLED', false, false],
  ])('%s: accept %s, submit %s', (status, accept, submit) => {
    expect(canAcceptTask({ status })).toBe(accept);
    expect(canSubmitTask({ status })).toBe(submit);
  });
});

describe('isOverdue', () => {
  const today = '2026-10-22';

  it('flags open work from an earlier day', () => {
    expect(isOverdue(makeTask({ status: 'ACCEPTED', dueDate: '2026-10-21' }), today)).toBe(true);
  });

  it("does not flag today's work", () => {
    expect(isOverdue(makeTask({ status: 'ASSIGNED', dueDate: today }), today)).toBe(false);
  });

  it('does not flag submitted or reviewed work', () => {
    expect(isOverdue(makeTask({ status: 'SUBMITTED', dueDate: '2026-10-01' }), today)).toBe(false);
    expect(isOverdue(makeTask({ status: 'REVIEWED', dueDate: '2026-10-01' }), today)).toBe(false);
  });
});

describe('getTargetProgress', () => {
  it('reports the share done', () => {
    expect(getTargetProgress({ value: 150, unit: 'pcs', achieved: 60 })).toEqual({
      achieved: 60,
      total: 150,
      fraction: 0.4,
      isComplete: false,
    });
  });

  it('caps the bar at 100% when the target is exceeded', () => {
    expect(getTargetProgress({ value: 150, unit: 'pcs', achieved: 160 })).toMatchObject({
      fraction: 1,
      isComplete: true,
    });
  });

  it('has no fraction when no target was set', () => {
    expect(getTargetProgress({ value: 0, unit: 'pcs', achieved: 12 })).toMatchObject({
      total: 0,
      fraction: null,
      isComplete: false,
    });
  });
});

describe('acceptLocally and applyPendingAccepts', () => {
  it('accepts an assigned task', () => {
    expect(acceptLocally(makeTask(), '2026-10-22T08:00:00.000Z')).toMatchObject({
      status: 'ACCEPTED',
      acceptedAt: '2026-10-22T08:00:00.000Z',
    });
  });

  it('leaves tasks in other states untouched', () => {
    const submitted = makeTask({ status: 'SUBMITTED' });
    expect(acceptLocally(submitted, '2026-10-22T08:00:00.000Z')).toBe(submitted);
  });

  it('overlays pending accepts and keeps the other tasks as they were', () => {
    const pendingTask = makeTask({ id: 'a' });
    const otherTask = makeTask({ id: 'b' });
    const result = applyPendingAccepts(
      [pendingTask, otherTask],
      new Map([['a', { acceptedAt: '2026-10-22T08:00:00.000Z' }]]),
    );
    expect(result[0]?.status).toBe('ACCEPTED');
    expect(result[1]).toBe(otherTask);
  });
});

describe('submitLocally', () => {
  const confirmed = {
    completedQuantity: 120,
    acceptedQuantity: 118,
    note: 'Two collars re-stitched.',
    photoUrl: 'https://bucket.s3/photo.jpg',
    submittedAt: '2026-10-22T09:00:00.000Z',
  };

  it('shows the confirmed submission until the list is refetched', () => {
    const task = submitLocally(makeTask({ status: 'ACCEPTED' }), confirmed);

    expect(task.status).toBe('SUBMITTED');
    expect(task.target.achieved).toBe(120);
    expect(task.latestSubmission).toEqual({
      photoUrl: confirmed.photoUrl,
      note: confirmed.note,
      submittedAt: confirmed.submittedAt,
      completedQuantity: 120,
      acceptedQuantity: 118,
    });
  });

  it('keeps what the server keeps when optional fields were left empty (API_CONTRACT Gap 18)', () => {
    const task = submitLocally(
      makeTask({ status: 'ACCEPTED', instructions: 'Check the cuffs first.' }),
      { ...confirmed, acceptedQuantity: null, note: null },
    );

    // The backend keeps the stored note, which before a submission is the assigner's.
    expect(task.latestSubmission?.note).toBe('Check the cuffs first.');
    expect(task.latestSubmission?.acceptedQuantity).toBe(0);
    expect(task.instructions).toBeNull();
  });
});

describe('getProgressCounts', () => {
  it('shows only reported pieces until the work is reviewed', () => {
    const task = makeTask({
      status: 'SUBMITTED',
      latestSubmission: {
        photoUrl: null,
        note: null,
        submittedAt: '2026-10-22T10:00:00.000Z',
        completedQuantity: 58,
        acceptedQuantity: 0,
      },
    });
    expect(getProgressCounts(task)).toEqual({ done: 58, accepted: null, rejected: null });
  });

  it('counts what review left out as rejected', () => {
    const task = makeTask({
      status: 'REVIEWED',
      review: { reviewedAt: null, notes: null, completedQuantity: 58, acceptedQuantity: 52 },
    });
    expect(getProgressCounts(task)).toEqual({ done: 58, accepted: 52, rejected: 6 });
  });

  it('is zero before anything is reported', () => {
    expect(getProgressCounts(makeTask())).toEqual({ done: 0, accepted: null, rejected: null });
  });
});
