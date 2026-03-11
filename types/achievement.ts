export type AchievementId =
  | 'first_discovery'
  | 'park_explorer'
  | 'night_spotter'
  | 'rare_hunter'
  | 'habitat_master'
  | 'collector_5'
  | 'collector_20'
  | 'collector_50'
  | 'legendary_finder'
  | 'biome_master'
  | 'favorited_5'
  | 'sharp_eye';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string; // Ionicons name
  unlockedAt?: string; // ISO string, undefined = locked
  condition: string; // human-readable unlock condition
}
