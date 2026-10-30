import { matchMutation, type QueryClient } from '@tanstack/react-query';

import { isAcceptTaskVariables } from './acceptTaskMutation';
import { taskMutationKeys } from './queryKeys';

/**
 * True while an accept for this task has not reached the server (offline, or in flight). Work for
 * the task should wait: submit-work has no status check, so a submission that lands first would
 * make the accept fail (API_CONTRACT §5.2).
 */
export function isAcceptPending(queryClient: QueryClient, taskId: string): boolean {
  return queryClient
    .getMutationCache()
    .findAll({ mutationKey: taskMutationKeys.accept, status: 'pending' })
    .some(
      (mutation) =>
        isAcceptTaskVariables(mutation.state.variables) &&
        mutation.state.variables.taskId === taskId,
    );
}

/** Calls `listener` whenever an accept finishes, successfully or not. Returns the unsubscribe function. */
export function subscribeToAcceptSettled(
  queryClient: QueryClient,
  listener: () => void,
): () => void {
  return queryClient.getMutationCache().subscribe((event) => {
    if (event.type !== 'updated') return;
    if (event.action.type !== 'success' && event.action.type !== 'error') return;
    if (matchMutation({ mutationKey: taskMutationKeys.accept }, event.mutation)) listener();
  });
}
