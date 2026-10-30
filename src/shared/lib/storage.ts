import { createMMKV, type MMKV } from 'react-native-mmkv';

/**
 * Synchronous key-value interface shared by the query-cache persister and zustand's persist
 * middleware. Never store tokens here: they belong in secureStorage.
 */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function createKeyValueStorage(mmkv: MMKV): KeyValueStorage {
  return {
    getItem: (key) => mmkv.getString(key) ?? null,
    setItem: (key, value) => {
      mmkv.set(key, value);
    },
    removeItem: (key) => {
      mmkv.remove(key);
    },
  };
}

// Separate MMKV files, so sign-out can drop the query cache without touching the upload queue.
const queryCacheMMKV = createMMKV({ id: 'stitchflow.query-cache' });
const appMMKV = createMMKV({ id: 'stitchflow.app' });

/** Persisted TanStack Query cache. Cleared on sign-out. */
export const queryCacheStorage: KeyValueStorage = createKeyValueStorage(queryCacheMMKV);

/** App state that outlives a session: the upload queue and settings. */
export const appStorage: KeyValueStorage = createKeyValueStorage(appMMKV);

/** Deletes everything in the query-cache file. */
export function clearQueryCacheStorage(): void {
  queryCacheMMKV.clearAll();
}
