import { settleWithTimers } from '@/test-utils/timers';

import { myTaskSchema, myTasksResponseSchema } from '../../data/dto';
import { mockTasksApi } from '../mockTasksApi';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

async function loadTasks(): Promise<{ assignmentId: string; status: string }[]> {
  const payload = await settleWithTimers(mockTasksApi.getMyTasks());
  return myTasksResponseSchema.parse(payload).tasks.map((task) => myTaskSchema.parse(task));
}

describe('mockTasksApi', () => {
  it('returns backend-shaped tasks in every status the backend produces', async () => {
    const statuses = (await loadTasks()).map((task) => task.status);
    expect(new Set(statuses)).toEqual(
      new Set(['ASSIGNED', 'ACCEPTED', 'SUBMITTED', 'REVIEWED', 'REJECTED']),
    );
  });

  it('accepts an assigned task, like the backend', async () => {
    const assigned = (await loadTasks()).find((task) => task.status === 'ASSIGNED');
    expect(assigned).toBeDefined();
    if (!assigned) return;

    await expect(
      settleWithTimers(mockTasksApi.acceptTask(assigned.assignmentId)),
    ).resolves.toMatchObject({ id: assigned.assignmentId, status: 'ACCEPTED' });
    const after = (await loadTasks()).find((task) => task.assignmentId === assigned.assignmentId);
    expect(after?.status).toBe('ACCEPTED');
  });

  it('refuses to accept a submitted task with the backend message', async () => {
    const submitted = (await loadTasks()).find((task) => task.status === 'SUBMITTED');
    if (!submitted) throw new Error('fixture missing a submitted task');

    await expect(
      settleWithTimers(mockTasksApi.acceptTask(submitted.assignmentId)),
    ).rejects.toMatchObject({
      type: 'validation',
      message: 'Cannot accept task with status SUBMITTED.',
    });
  });

  it('answers 404 for an unknown task', async () => {
    await expect(settleWithTimers(mockTasksApi.acceptTask('missing'))).rejects.toMatchObject({
      type: 'notFound',
    });
  });
});
