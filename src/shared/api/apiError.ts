/**
 * One error type for every failed backend call (brief §8.2). `message` is always safe to show to a
 * user; `status`, `serverMessages` and `endpoint` are for logs and for mapping field errors.
 * Message rules come from API_CONTRACT.md §2.2.
 */
import { isRecord } from '@/shared/utils/isRecord';

export type ApiErrorType =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'validation'
  | 'notFound'
  | 'server'
  | 'cancelled';

/** Maps the start of a backend validation message to a form field name (API_CONTRACT §7). */
export type FieldErrorMap = Readonly<Record<string, string>>;

export interface ApiErrorOptions {
  type: ApiErrorType;
  message: string;
  status?: number | null;
  serverMessages?: readonly string[];
  fieldErrors?: Readonly<Record<string, string>>;
  endpoint?: string | null;
  method?: string | null;
  /** Overrides the default: network, timeout and server errors are retryable. */
  retryable?: boolean;
  cause?: unknown;
}

const RETRYABLE_TYPES: readonly ApiErrorType[] = ['network', 'timeout', 'server'];

export class ApiError extends Error {
  readonly type: ApiErrorType;
  readonly status: number | null;
  readonly serverMessages: readonly string[];
  readonly fieldErrors: Readonly<Record<string, string>>;
  readonly endpoint: string | null;
  readonly method: string | null;
  readonly isRetryable: boolean;

  constructor(options: ApiErrorOptions) {
    super(options.message);
    this.name = 'ApiError';
    this.type = options.type;
    this.status = options.status ?? null;
    this.serverMessages = options.serverMessages ?? [];
    this.fieldErrors = options.fieldErrors ?? {};
    this.endpoint = options.endpoint ?? null;
    this.method = options.method ?? null;
    this.isRetryable = options.retryable ?? RETRYABLE_TYPES.includes(options.type);
    this.cause = options.cause;
  }

  get hasFieldErrors(): boolean {
    return Object.keys(this.fieldErrors).length > 0;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** What the HTTP client knows about the request when it builds an ApiError. */
export interface ApiRequestInfo {
  /** Path template with ids replaced, e.g. /api/v1/orders/daily-assignments/:id/accept. */
  endpoint: string | null;
  method: string | null;
  /** Show the backend's 4xx message to the user. Login uses this: its messages match the design copy. */
  useServerMessage?: boolean;
  fieldErrorMap?: FieldErrorMap;
}

const USER_MESSAGES: Record<ApiErrorType, string> = {
  network: "You're offline or the connection dropped. Check your network and try again.",
  timeout: 'The server is taking too long to respond. Please try again.',
  unauthorized: 'Your session has ended. Please sign in again.',
  forbidden: "You don't have permission to do that.",
  validation: 'Some details are not valid. Please check them and try again.',
  notFound: "We couldn't find that item. It may have been removed or reassigned.",
  server: 'Something went wrong on our side. Please try again in a moment.',
  cancelled: 'The request was cancelled.',
};

const FIELD_ERRORS_MESSAGE = 'Please correct the highlighted fields.';
const UNEXPECTED_RESPONSE_MESSAGE =
  'The server sent a response the app does not understand. Please try again later.';

export function errorTypeForStatus(status: number): ApiErrorType {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 408) return 'timeout';
  if (status === 429 || status >= 500) return 'server';
  if (status >= 400) return 'validation';
  return 'server';
}

interface ServerErrorMessages {
  messages: string[];
  /** class-validator returns a list of constraint messages; a single string is a human-written message. */
  isConstraintList: boolean;
}

function readServerMessages(body: unknown): ServerErrorMessages {
  if (!isRecord(body)) return { messages: [], isConstraintList: false };
  const { message } = body;
  if (typeof message === 'string') {
    const trimmed = message.trim();
    return { messages: trimmed ? [trimmed] : [], isConstraintList: false };
  }
  if (Array.isArray(message)) {
    const messages = message
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    return { messages, isConstraintList: true };
  }
  return { messages: [], isConstraintList: false };
}

/** Assigns each backend message to the first field whose prefix it starts with; first message per field wins. */
export function mapFieldErrors(
  messages: readonly string[],
  fieldErrorMap: FieldErrorMap,
): Record<string, string> {
  const prefixes = Object.keys(fieldErrorMap).sort((a, b) => b.length - a.length);
  const fieldErrors: Record<string, string> = {};
  for (const message of messages) {
    const prefix = prefixes.find((candidate) => message.startsWith(candidate));
    const field = prefix === undefined ? undefined : fieldErrorMap[prefix];
    if (field !== undefined && fieldErrors[field] === undefined) {
      fieldErrors[field] = message;
    }
  }
  return fieldErrors;
}

function asSentence(text: string): string {
  const capitalised = text.charAt(0).toUpperCase() + text.slice(1);
  return /[.!?]$/.test(capitalised) ? capitalised : `${capitalised}.`;
}

function userMessageFor(
  type: ApiErrorType,
  server: ServerErrorMessages,
  hasFieldErrors: boolean,
  useServerMessage: boolean,
): string {
  const first = server.messages[0];
  if (type === 'validation') {
    if (hasFieldErrors) return FIELD_ERRORS_MESSAGE;
    if (first !== undefined && (!server.isConstraintList || useServerMessage))
      return asSentence(first);
    return USER_MESSAGES.validation;
  }
  if (
    (type === 'unauthorized' || type === 'forbidden') &&
    useServerMessage &&
    first !== undefined
  ) {
    return asSentence(first);
  }
  return USER_MESSAGES[type];
}

/** Builds the ApiError for an HTTP error response with the backend's error envelope (or any body). */
export function apiErrorFromResponse(
  status: number,
  body: unknown,
  request: ApiRequestInfo,
): ApiError {
  const type = errorTypeForStatus(status);
  const server = readServerMessages(body);
  const fieldErrors =
    type === 'validation' && request.fieldErrorMap
      ? mapFieldErrors(server.messages, request.fieldErrorMap)
      : {};
  return new ApiError({
    type,
    status,
    serverMessages: server.messages,
    fieldErrors,
    endpoint: request.endpoint,
    method: request.method,
    message: userMessageFor(
      type,
      server,
      Object.keys(fieldErrors).length > 0,
      request.useServerMessage === true,
    ),
  });
}

/** Builds the ApiError for a request that never got an HTTP response. */
export function apiErrorFromTransport(
  type: 'network' | 'timeout' | 'cancelled',
  request: ApiRequestInfo,
  cause?: unknown,
): ApiError {
  return new ApiError({
    type,
    message: USER_MESSAGES[type],
    endpoint: request.endpoint,
    method: request.method,
    cause,
  });
}

/** A 2xx response that is not the backend envelope, or a payload that fails its DTO schema. Not retryable. */
export function unexpectedResponseError(
  request: ApiRequestInfo,
  status: number | null,
  cause?: unknown,
): ApiError {
  return new ApiError({
    type: 'server',
    status,
    message: UNEXPECTED_RESPONSE_MESSAGE,
    endpoint: request.endpoint,
    method: request.method,
    retryable: false,
    cause,
  });
}

/** Any thrown value as an ApiError, so view-models can show `error.message` without type checks. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError({
    type: 'server',
    message: USER_MESSAGES.server,
    retryable: false,
    cause: error,
  });
}
