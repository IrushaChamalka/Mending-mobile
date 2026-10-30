import { useMutationState } from '@tanstack/react-query';

import { isAcceptTaskVariables } from '../data/acceptTaskMutation';
import { taskMutationKeys } from '../data/queryKeys';

export interface PendingAccept {
  /** True while offline: the accept waits on this device for the network. */
  isPaused: boolean;
  acceptedAt: string;
}

/** How many accepts the server has not confirmed yet. Sign-out clears them, so it warns first. */
export function usePendingAcceptCount(): number {
  return usePendingAccepts().size;
}

/** Accepts not yet confirmed by the server, by task id. */
export function usePendingAccepts(): ReadonlyMap<string, PendingAccept> {
  const states = useMutationState({
    filters: { mutationKey: taskMutationKeys.accept, status: 'pending' },
    select: (mutation) => mutation.state,
  });
  const pending = new Map<string, PendingAccept>();
  for (const state of states) {
    if (isAcceptTaskVariables(state.variables)) {
      pending.set(state.variables.taskId, {
        isPaused: state.isPaused,
        acceptedAt: new Date(state.submittedAt).toISOString(),
      });
    }
  }
  return pending;
}
