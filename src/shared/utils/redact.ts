import { isRecord } from './isRecord';

/** Keys whose values never reach logs or Sentry: credentials, tokens, image data and personal details. */
const SENSITIVE_KEY =
  /pass(word)?|token|secret|authorization|cookie|signature|base64|phone|email|^nic$/i;
const MAX_DEPTH = 4;
const MAX_ARRAY_ITEMS = 20;

/**
 * Returns a log-safe copy of a value. Sensitive keys are replaced, data URIs (image data) are
 * dropped, Errors are reduced to name and message, and deep or long structures are truncated.
 */
export function redact(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') return value.startsWith('data:') ? '[data-uri]' : value;
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (depth >= MAX_DEPTH) return '[truncated]';
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item: unknown) => redact(item, depth + 1));
  }
  if (!isRecord(value)) return '[object]';
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = SENSITIVE_KEY.test(key) ? '[redacted]' : redact(entry, depth + 1);
  }
  return result;
}

/** `redact` for a key-value context object, keeping the record type. */
export function redactRecord(record: Record<string, unknown>): Record<string, unknown> {
  const redacted = redact(record);
  return isRecord(redacted) ? redacted : {};
}
