import { useEffect } from 'react';
import { useDiscoveryStore, useProfileStore } from '@/store';
import { AnimalScanResult } from '@/types';
import { Biome, RarityTier } from '@/types';

export function useDiscoveries() {
  const { discoveries, isLoading, loadDiscoveries } = useDiscoveryStore();

  useEffect(() => {
    loadDiscoveries();
  }, []);

  return { discoveries, isLoading, reload: loadDiscoveries };
}

export function useFilteredDiscoveries(filters: {
  search?: string;
  rarity?: RarityTier | null;
  biome?: Biome | null;
}) {
  const { discoveries } = useDiscoveryStore();

  return discoveries.filter((d) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !d.animalName.toLowerCase().includes(q) &&
        !d.scientificName.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (filters.rarity && d.rarity !== filters.rarity) return false;
    if (filters.biome && d.biome !== filters.biome) return false;
    return true;
  });
}

export function useBiomeCounts(): Record<string, number> {
  const { discoveries } = useDiscoveryStore();
  return discoveries.reduce<Record<string, number>>((acc, d) => {
    acc[d.biome] = (acc[d.biome] ?? 0) + 1;
    return acc;
  }, {});
}

export function useDiscoveryById(id: string): AnimalScanResult | undefined {
  return useDiscoveryStore((s) => s.discoveries.find((d) => d.id === id));
}

export function useProfile() {
  const { totalScans, achievements, isLoaded, loadProfile, unlockAchievements, incrementScans } =
    useProfileStore();

  useEffect(() => {
    if (!isLoaded) loadProfile();
  }, [isLoaded]);

  return { totalScans, achievements, unlockAchievements, incrementScans };
}
