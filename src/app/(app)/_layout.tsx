import { Stack } from 'expo-router';
import type { JSX } from 'react';

/** Signed-in area: the tab shell, with the full-screen camera, submit and sync screens above it. */
export default function AppLayout(): JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />;
}
