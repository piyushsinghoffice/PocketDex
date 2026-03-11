import { RarityTier } from '@/types';
import { Colors } from '@/theme';

export function rarityColor(rarity: RarityTier): string {
  return Colors.rarity[rarity];
}

export function rarityGlow(rarity: RarityTier): string {
  return Colors.rarityGlow[rarity];
}

export function rarityOrder(rarity: RarityTier): number {
  const order: Record<RarityTier, number> = {
    Common: 0,
    Uncommon: 1,
    Rare: 2,
    Epic: 3,
    Legendary: 4,
  };
  return order[rarity];
}

export function rarityEmoji(rarity: RarityTier): string {
  const map: Record<RarityTier, string> = {
    Common: '⚪',
    Uncommon: '🟢',
    Rare: '🔵',
    Epic: '🟣',
    Legendary: '🟡',
  };
  return map[rarity];
}

export const ALL_RARITIES: RarityTier[] = [
  'Common',
  'Uncommon',
  'Rare',
  'Epic',
  'Legendary',
];
