import { create } from 'zustand';

interface UploadProgressState {
  /** 0 to 1 by queue item id, while uploading. In memory only: progress is not worth persisting. */
  progress: Record<string, number>;
  setProgress(id: string, fraction: number): void;
  clearProgress(id: string): void;
}

export const useUploadProgressStore = create<UploadProgressState>()((set) => ({
  progress: {},
  setProgress: (id, fraction) => {
    set((state) => ({ progress: { ...state.progress, [id]: fraction } }));
  },
  clearProgress: (id) => {
    set((state) => {
      const { [id]: _cleared, ...rest } = state.progress;
      return { progress: rest };
    });
  },
}));
