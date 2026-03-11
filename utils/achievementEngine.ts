import { AnimalScanResult, Achievement, AchievementId } from '@/types';
import { isNightTime } from './dateUtils';

export interface AchievementCheckInput {
  allDiscoveries: AnimalScanResult[];
  latestDiscovery: AnimalScanResult;
  currentAchievements: Achievement[];
}

/**
 * Returns IDs of achievements that should be newly unlocked.
 */
export function checkForNewAchievements(input: AchievementCheckInput): AchievementId[] {
  const { allDiscoveries, latestDiscovery, currentAchievements } = input;
  const unlocked = new Set(
    currentAchievements.filter((a) => a.unlockedAt).map((a) => a.id)
  );

  const newlyUnlocked: AchievementId[] = [];

  function check(id: AchievementId, condition: boolean) {
    if (condition && !unlocked.has(id)) {
      newlyUnlocked.push(id);
    }
  }

  const total = allDiscoveries.length;
  const biomes = new Set(allDiscoveries.map((d) => d.biome));
  const favorites = allDiscoveries.filter((d) => d.favorite).length;
  const biomeCounts = allDiscoveries.reduce<Record<string, number>>((acc, d) => {
    acc[d.biome] = (acc[d.biome] ?? 0) + 1;
    return acc;
  }, {});

  check('first_discovery', total >= 1);
  check('collector_5', total >= 5);
  check('collector_20', total >= 20);
  check('collector_50', total >= 50);
  check('park_explorer', biomes.size >= 3);
  check('habitat_master', biomes.size >= 5);
  check('night_spotter', isNightTime(latestDiscovery.detectedAt));
  check('rare_hunter', ['Rare', 'Epic', 'Legendary'].includes(latestDiscovery.rarity));
  check('legendary_finder', latestDiscovery.rarity === 'Legendary');
  check('biome_master', Object.values(biomeCounts).some((c) => c >= 5));
  check('favorited_5', favorites >= 5);
  check('sharp_eye', latestDiscovery.confidence >= 0.9);

  return newlyUnlocked;
}

export function completionPercentage(
  discoveries: AnimalScanResult[],
  totalAnimals: number
): number {
  const unique = new Set(discoveries.map((d) => d.animalName)).size;
  return Math.round((unique / totalAnimals) * 100);
}

export function rarestDiscovery(
  discoveries: AnimalScanResult[]
): AnimalScanResult | null {
  if (discoveries.length === 0) return null;
  const order: Record<string, number> = {
    Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4,
  };
  return discoveries.reduce((best, d) =>
    order[d.rarity] > order[best.rarity] ? d : best
  );
}
