import { focusManager, QueryClient } from '@tanstack/react-query';
import type {
  PersistedClient,
  PersistQueryClientOptions,
  Persister,
} from '@tanstack/react-query-persist-client';
import { AppState } from 'react-native';

import { isApiError } from '@/shared/api/apiError';
import { appInfo } from '@/shared/config/appInfo';

import { clearQueryCacheStorage, queryCacheStorage } from './storage';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const MAX_QUERY_RETRIES = 2;
const CACHE_KEY = 'tanstack-query';
const SAVE_THROTTLE_MS = 1000;

/** Bump when a persisted DTO or model shape changes, so caches from older versions are discarded. */
const CACHE_SCHEMA_VERSION = 2; // 2: employee designs (Task garment/payout, profile age/gender, salary).

/** How long the last known server data stays usable offline. */
export const QUERY_CACHE_MAX_AGE = 7 * DAY;

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) return false;
  // Only network blips, timeouts and server faults are worth retrying. Anything else is a bug.
  return isApiError(error) && error.isRetryable;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: MINUTE,
      // Must be at least the persister's maxAge, or restored queries are garbage-collected at once.
      gcTime: QUERY_CACHE_MAX_AGE,
      retry: shouldRetry,
    },
  },
});

interface FlushablePersister extends Persister {
  /** Writes a pending throttled save now (the app is going to the background). */
  flush(): void;
}

/**
 * Persists the query cache to MMKV. MMKV is synchronous, so this implements TanStack's three-method
 * Persister directly instead of using the deprecated sync-storage persister package.
 */
function createQueryCachePersister(): FlushablePersister {
  let pendingClient: PersistedClient | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    if (pendingClient === null) return;
    queryCacheStorage.setItem(CACHE_KEY, JSON.stringify(pendingClient));
    pendingClient = null;
  };

  return {
    persistClient(client) {
      pendingClient = client;
      timer ??= setTimeout(flush, SAVE_THROTTLE_MS);
    },
    restoreClient() {
      const saved = queryCacheStorage.getItem(CACHE_KEY);
      // A corrupt value throws here; TanStack then removes it and starts with an empty cache.
      return saved ? (JSON.parse(saved) as PersistedClient) : undefined;
    },
    removeClient() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      pendingClient = null;
      queryCacheStorage.removeItem(CACHE_KEY);
    },
    flush,
  };
}

const queryPersister = createQueryCachePersister();

/** Options for PersistQueryClientProvider. */
export const queryPersistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: queryPersister,
  maxAge: QUERY_CACHE_MAX_AGE,
  buster: `${appInfo.version}-${CACHE_SCHEMA_VERSION}`,
};

/** Tells TanStack Query when the app is in the foreground, and saves the cache before backgrounding. */
export function startFocusMonitoring(): void {
  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'background') queryPersister.flush();
      setFocused(status === 'active');
    });
    return () => {
      subscription.remove();
    };
  });
}

/** Drops all cached server data in memory and on disk (sign-out). */
export async function clearQueryCache(): Promise<void> {
  await queryClient.cancelQueries();
  queryClient.clear();
  queryPersister.removeClient();
  clearQueryCacheStorage();
}
