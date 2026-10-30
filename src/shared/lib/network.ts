import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

/** `isInternetReachable` is null while unknown; only an explicit false counts as offline. */
export function isConnectedState(state: NetInfoState): boolean {
  return state.isConnected !== false && state.isInternetReachable !== false;
}

/**
 * Feeds NetInfo into TanStack Query's onlineManager, which is the app's single source of truth for
 * connectivity: queries pause while offline, and the upload queue listens to the same signal.
 */
export function startNetworkMonitoring(): void {
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      setOnline(isConnectedState(state));
    }),
  );
}

export function isOnline(): boolean {
  return onlineManager.isOnline();
}

/** Calls `listener` whenever connectivity changes. Returns the unsubscribe function. */
export function subscribeToOnlineStatus(listener: (online: boolean) => void): () => void {
  return onlineManager.subscribe(listener);
}
