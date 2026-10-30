import {
  AxiosError,
  create as createAxios,
  isAxiosError,
  isCancel,
  type AxiosAdapter,
  type AxiosRequestConfig,
} from 'axios';

import { isRecord } from '@/shared/utils/isRecord';

import {
  ApiError,
  apiErrorFromResponse,
  apiErrorFromTransport,
  unexpectedResponseError,
  type ApiRequestInfo,
  type FieldErrorMap,
} from './apiError';
import { toEndpointTemplate } from './endpoints';

/** How the client reaches the session without importing the auth feature. */
export interface HttpAuthBridge {
  /** Current access token, or null when signed out. Read on every request. */
  getAccessToken(): string | null;
  /**
   * Renews the session after a 401. Stores the new token (so getAccessToken returns it) and resolves
   * to it, or resolves to null when the session cannot be renewed.
   */
  refreshAccessToken(): Promise<string | null>;
  /** Called once when a 401 could not be recovered. Must clear the token before it returns. */
  onSessionExpired(): void;
}

export interface HttpRequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Send without the Authorization header (login). A 401 then never ends the session. */
  skipAuth?: boolean;
  /** Show the backend's 4xx message to the user (login: its messages match the design copy). */
  useServerMessage?: boolean;
  /** Maps backend validation messages to form fields (API_CONTRACT §7). */
  fieldErrorMap?: FieldErrorMap;
}

export interface UploadRequestOptions extends HttpRequestOptions {
  /** Upload progress from 0 to 1. */
  onProgress?: (fraction: number) => void;
}

/** Every method resolves to the envelope's `data` (unknown: the data/ layer validates it) or rejects with ApiError. */
export interface HttpClient {
  get(url: string, options?: HttpRequestOptions): Promise<unknown>;
  post(url: string, body?: unknown, options?: HttpRequestOptions): Promise<unknown>;
  patch(url: string, body?: unknown, options?: HttpRequestOptions): Promise<unknown>;
  postMultipart(url: string, form: FormData, options?: UploadRequestOptions): Promise<unknown>;
}

export interface HttpClientConfig {
  baseURL: string;
  getAuthBridge: () => HttpAuthBridge | null;
  /** Called once per failed request, after normalisation. Used for logging. */
  onError?: (error: ApiError) => void;
  timeoutMs?: number;
  uploadTimeoutMs?: number;
  /** Test seam: replaces axios' network adapter. */
  adapter?: AxiosAdapter;
}

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_UPLOAD_TIMEOUT_MS = 120_000;

interface RequestSpec {
  method: 'GET' | 'POST' | 'PATCH';
  url: string;
  data?: unknown;
  options: UploadRequestOptions;
  isUpload: boolean;
}

/** Code and message only: an AxiosError carries the request config, including the token and the body. */
function transportCause(error: AxiosError): { code: string | undefined; message: string } {
  return { code: error.code, message: error.message };
}

function normalizeError(error: unknown, request: ApiRequestInfo): ApiError {
  if (error instanceof ApiError) return error;
  if (isAxiosError(error)) {
    if (isCancel(error)) return apiErrorFromTransport('cancelled', request, transportCause(error));
    if (error.response) {
      return apiErrorFromResponse(error.response.status, error.response.data, request);
    }
    if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT) {
      return apiErrorFromTransport('timeout', request, transportCause(error));
    }
    return apiErrorFromTransport('network', request, transportCause(error));
  }
  if (isCancel(error)) return apiErrorFromTransport('cancelled', request);
  return unexpectedResponseError(request, null, error);
}

/**
 * Creates the app's HTTP client: Bearer auth from the session, the backend envelope unwrapped, every
 * failure normalised to ApiError, and a 401 handled once (single-flight renewal, then session end).
 */
export function createHttpClient(config: HttpClientConfig): HttpClient {
  const instance = createAxios({
    baseURL: config.baseURL,
    timeout: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    headers: { Accept: 'application/json' },
    adapter: config.adapter,
  });
  const uploadTimeoutMs = config.uploadTimeoutMs ?? DEFAULT_UPLOAD_TIMEOUT_MS;

  // Concurrent 401s share one renewal; requests that start meanwhile wait for it.
  let renewal: Promise<string | null> | null = null;

  function renewOnce(bridge: HttpAuthBridge): Promise<string | null> {
    renewal ??= bridge
      .refreshAccessToken()
      .catch(() => null)
      .finally(() => {
        renewal = null;
      });
    return renewal;
  }

  /** After a 401: true when the request should be retried with the current token. */
  async function recoverFromUnauthorized(
    bridge: HttpAuthBridge,
    failedToken: string,
  ): Promise<boolean> {
    const current = bridge.getAccessToken();
    if (current === null) return false; // Already signed out.
    if (current !== failedToken) return true; // Renewed or replaced while this request was in flight.
    const renewed = await renewOnce(bridge);
    if (renewed !== null) return true;
    const afterRenewal = bridge.getAccessToken();
    // Another request saw the same 401 first and already ended (or replaced) the session.
    if (afterRenewal !== failedToken) return afterRenewal !== null;
    bridge.onSessionExpired();
    return false;
  }

  function toAxiosConfig(spec: RequestSpec, token: string | null): AxiosRequestConfig {
    const { options } = spec;
    const { onProgress } = options;
    return {
      method: spec.method,
      url: spec.url,
      data: spec.data,
      params: options.params,
      signal: options.signal,
      timeout: options.timeoutMs ?? (spec.isUpload ? uploadTimeoutMs : undefined),
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      onUploadProgress: onProgress
        ? (event) => {
            onProgress(event.total ? Math.min(event.loaded / event.total, 1) : 0);
          }
        : undefined,
    };
  }

  function fail(error: ApiError): never {
    config.onError?.(error);
    throw error;
  }

  async function send(spec: RequestSpec, isRetry = false): Promise<unknown> {
    const request: ApiRequestInfo = {
      endpoint: toEndpointTemplate(spec.url),
      method: spec.method,
      useServerMessage: spec.options.useServerMessage,
      fieldErrorMap: spec.options.fieldErrorMap,
    };
    const bridge = spec.options.skipAuth ? null : config.getAuthBridge();
    if (bridge && renewal) await renewal;
    const token = bridge?.getAccessToken() ?? null;

    let body: unknown;
    try {
      const response = await instance.request(toAxiosConfig(spec, token));
      body = response.data;
    } catch (error) {
      const apiError = normalizeError(error, request);
      const canRecover = apiError.type === 'unauthorized' && bridge !== null && token !== null;
      if (canRecover && !isRetry && (await recoverFromUnauthorized(bridge, token))) {
        return send(spec, true);
      }
      return fail(apiError);
    }

    if (isRecord(body) && body.success === true && 'data' in body) return body.data;
    return fail(unexpectedResponseError(request, null));
  }

  return {
    get: (url, options = {}) => send({ method: 'GET', url, options, isUpload: false }),
    post: (url, body, options = {}) =>
      send({ method: 'POST', url, data: body, options, isUpload: false }),
    patch: (url, body, options = {}) =>
      send({ method: 'PATCH', url, data: body, options, isUpload: false }),
    // axios lets React Native set the multipart boundary for FormData bodies.
    postMultipart: (url, form, options = {}) =>
      send({ method: 'POST', url, data: form, options, isUpload: true }),
  };
}
