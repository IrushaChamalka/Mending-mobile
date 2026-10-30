import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { StatusBar } from 'expo-status-bar';
import type { JSX, ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { startUploadQueue } from '@/features/submission';
import { queryClient, queryPersistOptions } from '@/shared/lib/queryClient';
import { spacing } from '@/shared/theme';
import { toastConfig } from '@/shared/ui';

export interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Runs once the persisted cache is back. Accepts made offline resume first; the upload queue starts
 * only now, because it holds a task's submission while that task's accept is still pending, and
 * those accepts are only visible after the restore.
 */
function onCacheRestored(): Promise<unknown> {
  const resumed = queryClient.resumePausedMutations();
  startUploadQueue();
  return resumed;
}

/**
 * App-wide providers: the persisted query client, the status bar style and the toast host. Expo
 * Router's root already provides the SafeAreaProvider.
 */
export function AppProviders({ children }: AppProvidersProps): JSX.Element {
  const insets = useSafeAreaInsets();
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={queryPersistOptions}
      onSuccess={onCacheRestored}
      onError={startUploadQueue}
    >
      <StatusBar style="dark" />
      {children}
      <Toast config={toastConfig} topOffset={insets.top + spacing.sm} />
    </PersistQueryClientProvider>
  );
}
