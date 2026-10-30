/**
 * Helpers for each feature's mock api implementation (EXPO_PUBLIC_USE_MOCK_API=true). Mocks return
 * the exact backend DTO shapes and fail with the same ApiErrors the real client produces.
 */
import { apiErrorFromResponse, type ApiError, type FieldErrorMap } from './apiError';
import { toEndpointTemplate } from './endpoints';

const MIN_DELAY_MS = 250;
const MAX_DELAY_MS = 700;

/** Simulated network latency. */
export function mockDelay(ms?: number): Promise<void> {
  const duration = ms ?? MIN_DELAY_MS + Math.round(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

export interface MockErrorOptions {
  useServerMessage?: boolean;
  fieldErrorMap?: FieldErrorMap;
}

/** The ApiError the real client would build for this backend error envelope. */
export function mockApiError(
  status: number,
  message: string | string[],
  request: { method: string; url: string },
  options: MockErrorOptions = {},
): ApiError {
  const body = {
    success: false,
    statusCode: status,
    message,
    error: null,
    timestamp: new Date().toISOString(),
  };
  return apiErrorFromResponse(status, body, {
    endpoint: toEndpointTemplate(request.url),
    method: request.method,
    ...options,
  });
}
