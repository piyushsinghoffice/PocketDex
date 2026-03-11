import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RarityTier } from '@/types';
import { rarityColor, rarityGlow } from '@/utils/rarityUtils';
import { Typography, Spacing, Radius } from '@/theme';

interface RarityBadgeProps {
  rarity: RarityTier;
  size?: 'sm' | 'md' | 'lg';
}

export function RarityBadge({ rarity, size = 'md' }: RarityBadgeProps) {
  const color = rarityColor(rarity);
  const glow = rarityGlow(rarity);

  const textStyle = size === 'sm' ? styles.textSm : size === 'lg' ? styles.textLg : styles.textMd;
  const paddingStyle = size === 'sm' ? styles.paddingSm : size === 'lg' ? styles.paddingLg : styles.paddingMd;

  return (
    <View style={[styles.badge, paddingStyle, { borderColor: color, backgroundColor: glow }]}>
      <Text style={[textStyle, { color }]}>{rarity.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  paddingSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  paddingMd: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  paddingLg: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  textSm: {
    ...Typography.labelSM,
    fontSize: 9,
  },
  textMd: {
    ...Typography.labelSM,
  },
  textLg: {
    ...Typography.labelMD,
    letterSpacing: 1,
  },
});
