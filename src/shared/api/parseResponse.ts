import type { z } from 'zod';

import { logger } from '@/shared/lib/logger';

import { unexpectedResponseError } from './apiError';
import { toEndpointTemplate } from './endpoints';

const MAX_REPORTED_ISSUES = 5;

interface IssueLike {
  path: readonly PropertyKey[];
  code: string;
  message: string;
}

function summarizeIssues(issues: readonly IssueLike[]): Record<string, string>[] {
  return issues.slice(0, MAX_REPORTED_ISSUES).map((issue) => ({
    path: issue.path.map(String).join('.'),
    code: issue.code,
    message: issue.message,
  }));
}

/**
 * Validates a response payload against its DTO schema (used by each feature's data/ layer). A
 * mismatch means the backend contract changed: it is reported to Sentry and surfaces as a
 * non-retryable server error.
 */
export function parseResponse<TSchema extends z.ZodType>(
  schema: TSchema,
  payload: unknown,
  url: string,
): z.output<TSchema> {
  const result = schema.safeParse(payload);
  if (result.success) return result.data;
  const error = unexpectedResponseError(
    { endpoint: toEndpointTemplate(url), method: null },
    null,
    result.error,
  );
  logger.error('Response did not match the API contract', error, {
    endpoint: error.endpoint,
    issues: summarizeIssues(result.error.issues),
  });
  throw error;
}

/**
 * Validates list items one by one. Items that break the contract are dropped and reported once, so
 * one bad row never hides the whole list.
 */
export function parseItems<TSchema extends z.ZodType>(
  schema: TSchema,
  items: readonly unknown[],
  url: string,
): z.output<TSchema>[] {
  const valid: z.output<TSchema>[] = [];
  let invalidCount = 0;
  let firstIssues: Record<string, string>[] = [];
  for (const item of items) {
    const result = schema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalidCount += 1;
      if (invalidCount === 1) firstIssues = summarizeIssues(result.error.issues);
    }
  }
  if (invalidCount > 0) {
    const error = unexpectedResponseError(
      { endpoint: toEndpointTemplate(url), method: null },
      null,
    );
    logger.error('List items did not match the API contract', error, {
      endpoint: error.endpoint,
      invalidCount,
      total: items.length,
      issues: firstIssues,
    });
  }
  return valid;
}
