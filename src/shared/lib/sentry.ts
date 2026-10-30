import * as Sentry from '@sentry/react-native';

import { env } from '@/shared/config/env';

/** Product events recorded as breadcrumbs (brief §14). */
export type AppBreadcrumb =
  | 'login'
  | 'logout'
  | 'session_expired'
  | 'task_accepted'
  | 'photo_captured'
  | 'submission_queued'
  | 'upload_success'
  | 'upload_failure'
  | 'withdrawal_requested'
  | 'password_changed'
  | 'password_reset';

export type BreadcrumbLevel = 'debug' | 'info' | 'warning' | 'error';

export interface ExceptionContext {
  tags?: Record<string, string | number | boolean | null>;
  extra?: Record<string, unknown>;
  fingerprint?: string[];
}

let initialized = false;

/** Sentry reports from preview and production builds, and from development only when explicitly enabled. */
export function isSentryEnabled(): boolean {
  return env.sentryDsn !== undefined && (!__DEV__ || env.sentryEnableInDev);
}

export function initSentry(): void {
  if (initialized) return;
  initialized = true;
  Sentry.init({
    dsn: env.sentryDsn,
    enabled: isSentryEnabled(),
    environment: env.appEnv,
    // `release` and `dist` are filled in by the native SDK from the installed binary
    // (bundleId@version+build). JavaScript cannot read the build number: expo-constants dropped it
    // in favour of expo-application, which is not installed.
    tracesSampleRate: 0.1,
    tracePropagationTargets: [env.apiUrl],
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    // Session replay is off: mobileReplayIntegration is intentionally not added.
    integrations: [Sentry.expoRouterIntegration()],
  });
}

/** Identifies the user by employee ID only (brief §14). Pass null on sign-out. */
export function setSentryUser(employeeId: string | null): void {
  Sentry.setUser(employeeId ? { id: employeeId } : null);
}

export function addSentryBreadcrumb(
  category: string,
  message: string,
  level: BreadcrumbLevel,
  data?: Record<string, unknown>,
): void {
  Sentry.addBreadcrumb({ category, message, level, data });
}

export function captureSentryException(error: unknown, context: ExceptionContext = {}): void {
  Sentry.captureException(error, {
    tags: context.tags,
    extra: context.extra,
    fingerprint: context.fingerprint,
  });
}

/** Wraps the root layout for touch breadcrumbs and app-start tracing. */
export const wrapRootComponent = Sentry.wrap;

/** Wraps an Expo Router ErrorBoundary so render errors that reach it are reported. */
export const wrapErrorBoundary = Sentry.wrapExpoRouterErrorBoundary;
