import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { appStorage } from '@/shared/lib/storage';

import type { UploadQueueItem } from '../types';

interface UploadQueueState {
  items: UploadQueueItem[];
  lastSyncedAt: string | null;
}

interface UploadQueueActions {
  addItem(item: UploadQueueItem): void;
  updateItem(id: string, patch: Partial<UploadQueueItem>): void;
  removeItem(id: string): void;
  /** The server confirmed the submission. */
  completeItem(id: string, syncedAt: string): void;
  reset(): void;
}

/**
 * The upload queue (brief §12): persisted to MMKV on every change, so submissions survive the app
 * being killed. Change it through services/uploadQueue.ts; read it through the hooks.
 */
export const useUploadQueueStore = create<UploadQueueState & UploadQueueActions>()(
  persist(
    (set) => ({
      items: [],
      lastSyncedAt: null,
      addItem: (item) => {
        set((state) => ({ items: [...state.items, item] }));
      },
      updateItem: (id, patch) => {
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        }));
      },
      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
      },
      completeItem: (id, syncedAt) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          lastSyncedAt: syncedAt,
        }));
      },
      reset: () => {
        set({ items: [], lastSyncedAt: null });
      },
    }),
    {
      name: 'upload-queue',
      storage: createJSONStorage(() => appStorage),
      version: 1,
      partialize: (state) => ({ items: state.items, lastSyncedAt: state.lastSyncedAt }),
    },
  ),
);
