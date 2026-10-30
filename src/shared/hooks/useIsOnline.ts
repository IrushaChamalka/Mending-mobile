import { useSyncExternalStore } from 'react';

import { isOnline, subscribeToOnlineStatus } from '@/shared/lib/network';

/** Current connectivity, re-rendering on change. Drives NetworkBanner and the sync pill. */
export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribeToOnlineStatus, isOnline, isOnline);
}
