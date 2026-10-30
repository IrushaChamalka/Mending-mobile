import { Stack } from 'expo-router';
import type { JSX } from 'react';

/** Signing out (or opening the app signed out) lands on sign-in, never on a forgot-password step. */
export const unstable_settings = { anchor: 'login' };

/** Signed-out area: sign-in and the forgot-password steps. */
export default function AuthLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-code" />
      <Stack.Screen name="new-password" />
    </Stack>
  );
}
