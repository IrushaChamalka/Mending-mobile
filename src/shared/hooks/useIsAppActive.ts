import { focusManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

function subscribeToAppFocus(onChange: () => void): () => void {
  return focusManager.subscribe(onChange);
}

function isAppFocused(): boolean {
  return focusManager.isFocused();
}

/** False while the app is in the background (the camera, for one, must not run then). */
export function useIsAppActive(): boolean {
  return useSyncExternalStore(subscribeToAppFocus, isAppFocused, isAppFocused);
}
