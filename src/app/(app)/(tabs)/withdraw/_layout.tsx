import { Stack } from 'expo-router';
import type { JSX } from 'react';

/** Deep links and reloads open the tab's root screen beneath the linked one. */
export const unstable_settings = { anchor: 'index' };

/** The tab's own stack: its detail screens keep the tab bar, as designed. */
export default function TabStackLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Listed first so it is the stack's initial screen ("[id]" would sort before it). */}
      <Stack.Screen name="index" />
    </Stack>
  );
}
