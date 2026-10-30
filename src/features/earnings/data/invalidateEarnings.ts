import type { QueryClient } from '@tanstack/react-query';

import { earningsKeys } from './queryKeys';

/** Refetches the salary, e.g. after a withdrawal request changes what is available. */
export function invalidateEarnings(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: earningsKeys.all });
}
