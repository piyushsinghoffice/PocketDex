import { AnimalStats, AnimalTemplate, RarityTier } from '@/types';

/**
 * Applies controlled randomness to base stats.
 * Variance is higher for Common animals and tighter for Legendary.
 */
function jitter(base: number, variance: number): number {
  const delta = (Math.random() * 2 - 1) * variance;
  return Math.min(100, Math.max(1, Math.round(base + delta)));
}

function varianceForRarity(rarity: RarityTier): number {
  switch (rarity) {
    case 'Legendary': return 4;
    case 'Epic':      return 7;
    case 'Rare':      return 10;
    case 'Uncommon':  return 13;
    case 'Common':    return 16;
  }
}

export function generateStats(template: AnimalTemplate): AnimalStats {
  const v = varianceForRarity(template.rarity);
  return {
    power:        jitter(template.baseStats.power, v),
    agility:      jitter(template.baseStats.agility, v),
    intelligence: jitter(template.baseStats.intelligence, v),
    camouflage:   jitter(template.baseStats.camouflage, v),
    friendliness: jitter(template.baseStats.friendliness, v),
    rarityScore:  jitter(template.baseStats.rarityScore, v),
  };
}

export function generateConfidence(rarity: RarityTier): number {
  // Rarer animals are "harder" for the model to identify → lower avg confidence
  const base: Record<RarityTier, number> = {
    Common:    0.91,
    Uncommon:  0.84,
    Rare:      0.76,
    Epic:      0.68,
    Legendary: 0.60,
  };
  const variance = 0.07;
  const raw = base[rarity] + (Math.random() * 2 - 1) * variance;
  return parseFloat(Math.min(0.99, Math.max(0.40, raw)).toFixed(2));
}

export function statColor(key: keyof AnimalStats): string {
  const map: Record<keyof AnimalStats, string> = {
    power:        '#ef4444',
    agility:      '#22c55e',
    intelligence: '#3b82f6',
    camouflage:   '#6b7280',
    friendliness: '#ec4899',
    rarityScore:  '#f59e0b',
  };
  return map[key];
}

export function statLabel(key: keyof AnimalStats): string {
  const map: Record<keyof AnimalStats, string> = {
    power:        'Power',
    agility:      'Agility',
    intelligence: 'Intel',
    camouflage:   'Stealth',
    friendliness: 'Social',
    rarityScore:  'Rarity',
  };
  return map[key];
}

export const STAT_KEYS: (keyof AnimalStats)[] = [
  'power',
  'agility',
  'intelligence',
  'camouflage',
  'friendliness',
  'rarityScore',
];
