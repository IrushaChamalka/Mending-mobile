import { QueryClient } from '@tanstack/react-query';

import { isAcceptPending, subscribeToAcceptSettled } from '../acceptState';
import { taskMutationKeys } from '../queryKeys';

jest.mock('@/shared/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    breadcrumb: jest.fn(),
  },
}));

/** No garbage-collection timers, so finished mutations do not keep Jest running. */
function makeClient(): QueryClient {
  return new QueryClient({ defaultOptions: { mutations: { gcTime: Infinity } } });
}

function pendingAccept(client: QueryClient, taskId: string): void {
  client.getMutationCache().build(
    client,
    { mutationKey: taskMutationKeys.accept },
    {
      context: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      isPaused: true,
      status: 'pending',
      variables: { taskId },
      submittedAt: Date.now(),
    },
  );
}

describe('isAcceptPending', () => {
  it('finds an accept still on its way for the task', () => {
    const client = makeClient();
    pendingAccept(client, 'task-1');

    expect(isAcceptPending(client, 'task-1')).toBe(true);
    expect(isAcceptPending(client, 'task-2')).toBe(false);
  });

  it('ignores other mutations', () => {
    const client = makeClient();
    client.getMutationCache().build(
      client,
      { mutationKey: ['profile', 'update'] },
      {
        context: undefined,
        data: undefined,
        error: null,
        failureCount: 0,
        failureReason: null,
        isPaused: true,
        status: 'pending',
        variables: { taskId: 'task-1' },
        submittedAt: Date.now(),
      },
    );

    expect(isAcceptPending(client, 'task-1')).toBe(false);
  });
});

describe('subscribeToAcceptSettled', () => {
  it('calls back when an accept finishes, and not for other mutations', async () => {
    const client = makeClient();
    const listener = jest.fn();
    const unsubscribe = subscribeToAcceptSettled(client, listener);

    await client
      .getMutationCache()
      .build(client, { mutationKey: ['profile', 'update'], mutationFn: () => Promise.resolve(1) })
      .execute(undefined);
    expect(listener).not.toHaveBeenCalled();

    await client
      .getMutationCache()
      .build(client, { mutationKey: taskMutationKeys.accept, mutationFn: () => Promise.resolve(1) })
      .execute({ taskId: 'task-1' });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});
