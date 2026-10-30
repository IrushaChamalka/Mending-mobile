import { env } from '@/shared/config/env';
import { logger } from '@/shared/lib/logger';

import type { ApiError } from './apiError';
import { createHttpClient, type HttpAuthBridge, type HttpClient } from './createHttpClient';

export type {
  HttpAuthBridge,
  HttpClient,
  HttpRequestOptions,
  UploadRequestOptions,
} from './createHttpClient';

let authBridge: HttpAuthBridge | null = null;

/** Connects the client to the session (done by the auth feature at startup). */
export function configureHttpAuth(bridge: HttpAuthBridge | null): void {
  authBridge = bridge;
}

/**
 * Expected field conditions (offline, timeouts, 4xx) become breadcrumbs. Server faults and responses
 * that break the contract become Sentry exceptions.
 */
function reportApiError(error: ApiError): void {
  if (error.type === 'cancelled') return;
  const context = {
    endpoint: error.endpoint,
    method: error.method,
    status: error.status,
    type: error.type,
  };
  if (error.type === 'server') {
    logger.error('API request failed', error, context);
    return;
  }
  logger.warn('API request failed', context);
}

/** The app's single HTTP client. Feature api/ modules call it; nothing else talks to the network. */
export const httpClient: HttpClient = createHttpClient({
  baseURL: env.apiUrl,
  getAuthBridge: () => authBridge,
  onError: reportApiError,
});
