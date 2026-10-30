/**
 * The app's logger and the only module allowed to use the console (lint override).
 *
 * Development: everything goes to the Metro console.
 * Production and preview: debug/info are dropped, warn becomes a Sentry breadcrumb, error becomes a
 * Sentry exception tagged with the endpoint, status code and ApiError type when it is an API error.
 * Never pass tokens, passwords or image data; contexts are redacted as a second line of defence.
 */
import {
  consoleTransport,
  logger as logs,
  type ConsoleTransportOptions,
  type transportFunctionType,
} from 'react-native-logs';

import { ApiError } from '@/shared/api/apiError';
import { redactRecord } from '@/shared/utils/redact';

import {
  addSentryBreadcrumb,
  captureSentryException,
  isSentryEnabled,
  type AppBreadcrumb,
} from './sentry';

export type LogContext = Record<string, unknown>;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Second argument of every call into react-native-logs; read back by the transport. */
interface LogPayload {
  context?: LogContext;
  error?: unknown;
}

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function isLogPayload(value: unknown): value is LogPayload {
  return typeof value === 'object' && value !== null && ('context' in value || 'error' in value);
}

function describeError(error: unknown): Record<string, unknown> | undefined {
  if (error instanceof ApiError) {
    return { name: error.name, type: error.type, status: error.status, endpoint: error.endpoint };
  }
  if (error instanceof Error) return { name: error.name, message: error.message };
  return error === undefined ? undefined : { value: String(error) };
}

/** Console formatting: strings as-is, payloads as compact redacted JSON. */
function stringify(message: unknown): string {
  if (typeof message === 'string') return `${message} `;
  if (!isLogPayload(message)) return '';
  const details = redactRecord({ ...message.context, error: describeError(message.error) });
  const json = JSON.stringify(details);
  return json === '{}' ? '' : json;
}

function forwardToSentry(level: string, rawMsg: unknown): void {
  if (level !== 'warn' && level !== 'error') return;
  const [message, payload] = Array.isArray(rawMsg) ? rawMsg : [];
  const text = typeof message === 'string' ? message : 'Log message';
  const { context, error } = isLogPayload(payload)
    ? payload
    : { context: undefined, error: undefined };
  const data = context ? redactRecord(context) : undefined;

  if (level === 'warn') {
    addSentryBreadcrumb('log', text, 'warning', data);
    return;
  }
  if (error instanceof ApiError) {
    captureSentryException(error, {
      tags: { api_error_type: error.type, status_code: error.status, endpoint: error.endpoint },
      extra: { message: text, ...data },
      // Every ApiError is created in the same place, so group by what failed instead of by stack.
      fingerprint: ['api-error', error.type, error.endpoint ?? 'unknown', String(error.status)],
    });
    return;
  }
  captureSentryException(error ?? new Error(text), { extra: { message: text, ...data } });
}

const transport: transportFunctionType<ConsoleTransportOptions> = (props) => {
  if (__DEV__) consoleTransport(props);
  if (isSentryEnabled()) forwardToSentry(props.level.text, props.rawMsg);
};

const base = logs.createLogger({
  levels: LEVELS,
  severity: __DEV__ ? 'debug' : 'warn',
  transport,
  transportOptions: { colors: { info: 'blueBright', warn: 'yellowBright', error: 'redBright' } },
  stringifyFunc: stringify,
  async: true,
  printDate: true,
  dateFormat: 'time',
  printLevel: true,
});

function write(level: LogLevel, message: string, payload: LogPayload): void {
  base[level](message, payload);
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    write('debug', message, { context });
  },
  info(message: string, context?: LogContext): void {
    write('info', message, { context });
  },
  warn(message: string, context?: LogContext): void {
    write('warn', message, { context });
  },
  error(message: string, error?: unknown, context?: LogContext): void {
    write('error', message, { context, error });
  },
  /** A product event for the Sentry breadcrumb trail: login, task accepted, upload success… */
  breadcrumb(event: AppBreadcrumb, data?: LogContext): void {
    addSentryBreadcrumb('app', event, 'info', data ? redactRecord(data) : undefined);
    write('debug', `event: ${event}`, { context: data });
  },
};
