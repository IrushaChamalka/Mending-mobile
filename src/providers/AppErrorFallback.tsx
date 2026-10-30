import type { ErrorBoundaryProps } from 'expo-router';
import type { JSX } from 'react';

import { ErrorState, Screen } from '@/shared/ui';

/**
 * Shown in place of the app when a render error escapes every screen. Deliberately uses no app
 * providers, because one of them may be what failed.
 */
export function AppErrorFallback({ retry }: ErrorBoundaryProps): JSX.Element {
  return (
    <Screen variant="surface" padded>
      <ErrorState
        title="Something went wrong"
        message="The app ran into an unexpected problem. Please try again."
        onRetry={() => {
          void retry();
        }}
      />
    </Screen>
  );
}
