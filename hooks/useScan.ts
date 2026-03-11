import { useState, useCallback } from 'react';
import { inferenceService } from '@/services/inference';
import { getCurrentLocation } from '@/services/location/LocationService';
import { useDiscoveryStore, useProfileStore } from '@/store';
import { checkForNewAchievements } from '@/utils/achievementEngine';
import { AnimalScanResult } from '@/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type ScanStatus = 'idle' | 'capturing' | 'analyzing' | 'done' | 'error';

export function useScan() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnimalScanResult | null>(null);

  const { addDiscovery, discoveries } = useDiscoveryStore();
  const { achievements, unlockAchievements, incrementScans } = useProfileStore();

  const scan = useCallback(async (imageUri: string) => {
    setError(null);
    setStatus('analyzing');

    try {
      const inferenceResult = await inferenceService.analyzeAnimalImage(imageUri);
      const location = await getCurrentLocation();

      const discovery: AnimalScanResult = {
        ...inferenceResult,
        id: generateId(),
        imageUri,
        detectedAt: new Date().toISOString(),
        latitude: location?.latitude,
        longitude: location?.longitude,
        favorite: false,
        notes: '',
      };

      setResult(discovery);
      setStatus('done');
      await incrementScans();
      return discovery;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStatus('error');
      return null;
    }
  }, []);

  const saveDiscovery = useCallback(
    async (discovery: AnimalScanResult) => {
      await addDiscovery(discovery);

      const allDiscoveries = [discovery, ...discoveries];
      const newIds = checkForNewAchievements({
        allDiscoveries,
        latestDiscovery: discovery,
        currentAchievements: achievements,
      });
      if (newIds.length > 0) {
        await unlockAchievements(newIds);
      }
    },
    [discoveries, achievements]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResult(null);
  }, []);

  return { status, error, result, scan, saveDiscovery, reset };
}
