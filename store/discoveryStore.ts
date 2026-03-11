import { create } from 'zustand';
import { AnimalScanResult } from '@/types';
import {
  insertDiscovery,
  getAllDiscoveries,
  updateFavorite,
  updateNotes,
  deleteDiscovery,
} from '@/db/discoveryRepository';

interface DiscoveryState {
  discoveries: AnimalScanResult[];
  isLoading: boolean;
  pendingScan: Omit<AnimalScanResult, 'id' | 'imageUri' | 'detectedAt' | 'latitude' | 'longitude' | 'favorite' | 'notes'> | null;

  // Actions
  loadDiscoveries: () => Promise<void>;
  addDiscovery: (discovery: AnimalScanResult) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  saveNotes: (id: string, notes: string) => Promise<void>;
  removeDiscovery: (id: string) => Promise<void>;
  setPendingScan: (scan: DiscoveryState['pendingScan']) => void;
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  discoveries: [],
  isLoading: false,
  pendingScan: null,

  loadDiscoveries: async () => {
    set({ isLoading: true });
    try {
      const discoveries = await getAllDiscoveries();
      set({ discoveries });
    } finally {
      set({ isLoading: false });
    }
  },

  addDiscovery: async (discovery) => {
    await insertDiscovery(discovery);
    set((state) => ({ discoveries: [discovery, ...state.discoveries] }));
  },

  toggleFavorite: async (id) => {
    const current = get().discoveries.find((d) => d.id === id);
    if (!current) return;
    const next = !current.favorite;
    await updateFavorite(id, next);
    set((state) => ({
      discoveries: state.discoveries.map((d) =>
        d.id === id ? { ...d, favorite: next } : d
      ),
    }));
  },

  saveNotes: async (id, notes) => {
    await updateNotes(id, notes);
    set((state) => ({
      discoveries: state.discoveries.map((d) =>
        d.id === id ? { ...d, notes } : d
      ),
    }));
  },

  removeDiscovery: async (id) => {
    await deleteDiscovery(id);
    set((state) => ({
      discoveries: state.discoveries.filter((d) => d.id !== id),
    }));
  },

  setPendingScan: (scan) => set({ pendingScan: scan }),
}));
