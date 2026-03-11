export const Colors = {
  // Backgrounds
  background: '#f4efe7',
  surface: '#fff8ef',
  surfaceElevated: '#fffdf8',
  card: '#fff8ef',
  cardHover: '#f8efe2',

  // Brand
  primary: '#de3341',
  primaryDark: '#b92531',
  accent: '#f2b544',
  accentGlow: 'rgba(222, 51, 65, 0.18)',

  // Text
  textPrimary: '#3b2418',
  textSecondary: '#7a5a49',
  textMuted: '#a07e69',
  textInverse: '#fff8ef',

  // Rarity tiers
  rarity: {
    Common: '#6b7280',
    Uncommon: '#22c55e',
    Rare: '#3b82f6',
    Epic: '#a855f7',
    Legendary: '#f59e0b',
  },

  // Rarity glow/dim
  rarityGlow: {
    Common: 'rgba(107, 114, 128, 0.2)',
    Uncommon: 'rgba(34, 197, 94, 0.2)',
    Rare: 'rgba(59, 130, 246, 0.2)',
    Epic: 'rgba(168, 85, 247, 0.2)',
    Legendary: 'rgba(245, 158, 11, 0.25)',
  },

  // Stats
  statPower: '#ef4444',
  statAgility: '#22c55e',
  statIntelligence: '#3b82f6',
  statCamouflage: '#6b7280',
  statFriendliness: '#ec4899',
  statRarity: '#f59e0b',

  // Biomes
  biome: {
    Forest: '#16a34a',
    Wetland: '#0891b2',
    Urban: '#64748b',
    Grassland: '#ca8a04',
    Mountain: '#7c3aed',
    Coastal: '#0284c7',
    Desert: '#d97706',
    Unknown: '#374151',
  },

  // UI
  border: '#e4d4bf',
  borderSubtle: '#efe3d2',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  overlay: 'rgba(59, 36, 24, 0.42)',

  // Gradients (as arrays for LinearGradient)
  gradients: {
    hero: ['#f7b267', '#f4845f', '#de3341'],
    card: ['#fffdf8', '#f7efe3'],
    scan: ['transparent', 'rgba(59, 36, 24, 0.55)'],
    legendary: ['#f4c95d', '#e59f2a'],
    epic: ['#f4845f', '#de3341'],
  },
} as const;

export type ColorKey = keyof typeof Colors;
