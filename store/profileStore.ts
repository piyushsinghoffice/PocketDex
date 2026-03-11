import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement, AchievementId } from '@/types';
import { ACHIEVEMENTS } from '@/constants';

const PROFILE_STORAGE_KEY = '@pocketdex/profile';

interface ProfileState {
  totalScans: number;
  achievements: Achievement[];
  isLoaded: boolean;

  // Actions
  loadProfile: () => Promise<void>;
  incrementScans: () => Promise<void>;
  unlockAchievements: (ids: AchievementId[]) => Promise<void>;
}

interface PersistedProfile {
  totalScans: number;
  achievements: Achievement[];
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  totalScans: 0,
  achievements: ACHIEVEMENTS.map((a) => ({ ...a })),
  isLoaded: false,

  loadProfile: async () => {
    try {
      const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const persisted: PersistedProfile = JSON.parse(raw);
        // Merge with any new achievements added since last launch
        const merged = ACHIEVEMENTS.map((base) => {
          const saved = persisted.achievements.find((a) => a.id === base.id);
          return saved ? { ...base, unlockedAt: saved.unlockedAt } : base;
        });
        set({
          totalScans: persisted.totalScans,
          achievements: merged,
          isLoaded: true,
        });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  incrementScans: async () => {
    const next = get().totalScans + 1;
    set({ totalScans: next });
    await persist(get);
  },

  unlockAchievements: async (ids) => {
    if (ids.length === 0) return;
    const now = new Date().toISOString();
    set((state) => ({
      achievements: state.achievements.map((a) =>
        ids.includes(a.id) && !a.unlockedAt ? { ...a, unlockedAt: now } : a
      ),
    }));
    await persist(get);
  },
}));

async function persist(get: () => ProfileState): Promise<void> {
  try {
    const { totalScans, achievements } = get();
    await AsyncStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({ totalScans, achievements } satisfies PersistedProfile)
    );
  } catch {
    // Non-fatal persistence failure
  }
}
