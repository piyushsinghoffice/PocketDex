export type RarityTier = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export type Biome =
  | 'Forest'
  | 'Wetland'
  | 'Urban'
  | 'Grassland'
  | 'Mountain'
  | 'Coastal'
  | 'Desert'
  | 'Unknown';

export interface AnimalStats {
  power: number;        // 1-100
  agility: number;      // 1-100
  intelligence: number; // 1-100
  camouflage: number;   // 1-100
  friendliness: number; // 1-100
  rarityScore: number;  // 1-100
}

export interface AnimalScanResult {
  id: string;
  animalName: string;
  scientificName: string;
  description: string;
  habitat: string;
  diet: string;
  behavior: string;
  rarity: RarityTier;
  confidence: number; // 0-1
  stats: AnimalStats;
  biome: Biome;
  imageUri: string;
  detectedAt: string; // ISO string
  latitude?: number;
  longitude?: number;
  favorite: boolean;
  notes: string;
}

export interface AnimalTemplate {
  animalName: string;
  scientificName: string;
  description: string;
  habitat: string;
  diet: string;
  behavior: string;
  rarity: RarityTier;
  biome: Biome;
  baseStats: AnimalStats;
}
