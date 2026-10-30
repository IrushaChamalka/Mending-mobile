import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { initializeSession } from '@/features/auth';
import { registerTaskMutationDefaults } from '@/features/tasks';
import { logger } from '@/shared/lib/logger';
import { startNetworkMonitoring } from '@/shared/lib/network';
import { queryClient, startFocusMonitoring } from '@/shared/lib/queryClient';
import { initSentry } from '@/shared/lib/sentry';
import { iconFonts } from '@/shared/ui/Icon';

let started = false;
let iconFont: Promise<void> = Promise.resolve();
let session: Promise<void> = Promise.resolve();

/**
 * One-time startup work, called at module load of the root layout before the first render. Keeps the
 * startup path to what the first screen needs.
 */
export function initializeApp(): void {
  if (started) return;
  started = true;

  initSentry(); // First, so failures later in startup are reported.
  SplashScreen.preventAutoHideAsync().catch(() => undefined); // Hidden by useAppReady.
  startNetworkMonitoring();
  startFocusMonitoring();
  // Before the persisted cache restores, so accepts queued offline can resume.
  registerTaskMutationDefaults(queryClient);
  // Loaded behind the splash so icons never render blank on the first screen.
  iconFont = Font.loadAsync(iconFonts).catch((error: unknown) => {
    logger.warn('Icon font failed to load', { error });
  });
  session = initializeSession();
}

/** Resolves when the icon fonts are ready (or failed, so startup never hangs). */
export function waitForIconFont(): Promise<void> {
  return iconFont;
}

/** Resolves when the saved session has been restored or ruled out. */
export function waitForSession(): Promise<void> {
  return session;
}
