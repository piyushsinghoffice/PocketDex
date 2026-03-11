import { create } from 'zustand';
import { isModelDownloaded } from '@/services/model/ModelManager';

export type ModelStatus =
  | 'checking'
  | 'not_downloaded'
  | 'downloading'
  | 'loading'
  | 'ready'
  | 'error';

interface ModelState {
  status: ModelStatus;
  modelProgress: number;    // 0–1
  mmprojProgress: number;   // 0–1
  error: string | null;

  setStatus: (status: ModelStatus) => void;
  setModelProgress: (p: number) => void;
  setMmprojProgress: (p: number) => void;
  setError: (err: string | null) => void;
  checkDownloaded: () => Promise<boolean>;

  /** Combined progress 0–1 (model = 70%, mmproj = 30% of total) */
  totalProgress: () => number;
}

export const useModelStore = create<ModelState>((set, get) => ({
  status: 'checking',
  modelProgress: 0,
  mmprojProgress: 0,
  error: null,

  setStatus: (status) => set({ status }),
  setModelProgress: (p) => set({ modelProgress: p }),
  setMmprojProgress: (p) => set({ mmprojProgress: p }),
  setError: (error) => set({ error }),

  checkDownloaded: async () => {
    set({ status: 'checking' });
    const downloaded = await isModelDownloaded();
    set({ status: downloaded ? 'ready' : 'not_downloaded' });
    return downloaded;
  },

  totalProgress: () => {
    const { modelProgress, mmprojProgress } = get();
    return modelProgress * 0.7 + mmprojProgress * 0.3;
  },
}));
