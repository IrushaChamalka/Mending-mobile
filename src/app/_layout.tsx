import { Stack } from 'expo-router';
import type { JSX } from 'react';

import { useAuthStatus } from '@/features/auth';
import { AppErrorFallback } from '@/providers/AppErrorFallback';
import { AppProviders } from '@/providers/AppProviders';
import { initializeApp } from '@/providers/initializeApp';
import { useAppReady } from '@/providers/useAppReady';
import { wrapErrorBoundary, wrapRootComponent } from '@/shared/lib/sentry';

// Sentry, splash-screen hold, network and focus monitoring, session restore. Runs once.
initializeApp();

/** Replaces the app when a render error escapes; the error is reported to Sentry. */
export const ErrorBoundary = wrapErrorBoundary(AppErrorFallback);

/** Auth guard: signed-in users get (app), everyone else (auth). Renders nothing until the session is known. */
function RootNavigator(): JSX.Element | null {
  const isReady = useAppReady();
  const isSignedIn = useAuthStatus() === 'signedIn';
  if (!isReady) return null;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      {/*
        Leaf screens, login first, and no (auth) layout: a signed-out start at "/" (the protected
        Home tab) then falls back to sign-in. With a nested (auth) navigator it showed "Unmatched
        Route" (providers/__tests__/authRouting.test.tsx).
      */}
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/forgot-password" />
        <Stack.Screen name="(auth)/verify-code" />
        <Stack.Screen name="(auth)/new-password" />
      </Stack.Protected>
    </Stack>
  );
}

function RootLayout(): JSX.Element {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

export default wrapRootComponent(RootLayout);
