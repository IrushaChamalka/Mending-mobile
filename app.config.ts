import type { ConfigContext, ExpoConfig } from 'expo/config';
import { withAndroidManifest, type ConfigPlugin } from 'expo/config-plugins';

const APP_NAME = 'StitchFlow';
// TODO: confirm the bundle identifier / Android package name with the team before the first store build.
const APPLICATION_ID = 'com.technyne.stitchflow';

/**
 * Android release builds refuse plain-HTTP requests. Internal test builds that point at the
 * HTTP-only hosted backend (eas.json "hosted-test", scripts/build-test-apk.sh) need them, so this
 * turns cleartext on only when the bundled API URL is http://. Builds with an https:// URL never
 * get it. (Debug builds already allow cleartext through the template's debug manifest.)
 */
const withCleartextForHttpApi: ConfigPlugin = (config) => {
  if (!process.env.EXPO_PUBLIC_API_URL?.startsWith('http://')) return config;
  return withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (application) application.$['android:usesCleartextTraffic'] = 'true';
    return mod;
  });
};

const appConfig = ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  owner: 'irusha',
  slug: 'stitchflow',
  version: '1.0.0',
  scheme: 'stitchflow',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  ios: {
    bundleIdentifier: APPLICATION_ID,
    supportsTablet: false,
  },
  android: {
    package: APPLICATION_ID,
    adaptiveIcon: {
      backgroundColor: '#FFFFFF',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    // The camera plugin adds CAMERA. The app never records audio or touches shared storage (photos stay
    // in its private document directory), so these are kept out of the manifest.
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#FFFFFF',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission:
          'StitchFlow uses the camera to photograph the signed tally sheet when you submit work.',
        recordAudioAndroid: false,
      },
    ],
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/Inter-Regular.ttf',
          './assets/fonts/Inter-Medium.ttf',
          './assets/fonts/Inter-SemiBold.ttf',
          './assets/fonts/Inter-Bold.ttf',
        ],
      },
    ],
    [
      '@sentry/react-native/expo',
      {
        // Read at build time (EAS secrets or a local shell), never bundled into the app.
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        // Source maps upload only when a token is present; builds without one skip the upload instead of failing.
        disableAutoUpload: !process.env.SENTRY_AUTH_TOKEN,
      },
    ],
    [
      'expo-status-bar',
      {
        style: 'dark',
        hidden: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      // @irusha/stitchflow on expo.dev (created by `eas init` on 2026-10-31).
      projectId: 'ef893f9e-65d5-4453-8728-17e2f25e1366',
    },
  },
});

export default (context: ConfigContext): ExpoConfig => withCleartextForHttpApi(appConfig(context));
