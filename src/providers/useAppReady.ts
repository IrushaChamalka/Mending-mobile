import { useIsRestoring } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { useAuthStatus } from '@/features/auth';

import { waitForIconFont } from './initializeApp';

/**
 * True once the app can show its first real screen: the session is known, the persisted query cache
 * is restored, and the icon font is loaded. Hides the splash screen at that moment.
 */
export function useAppReady(): boolean {
  const authStatus = useAuthStatus();
  const isRestoringCache = useIsRestoring();
  const [iconFontReady, setIconFontReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void waitForIconFont().then(() => {
      if (mounted) setIconFontReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const ready = authStatus !== 'restoring' && !isRestoringCache && iconFontReady;

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  return ready;
}
