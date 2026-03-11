import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimalScanResult } from '@/types';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { rarityColor, rarityGlow } from '@/utils/rarityUtils';
import { relativeTime } from '@/utils/dateUtils';
import { RarityBadge } from './RarityBadge';
import { BIOMES } from '@/constants';

interface AnimalCardProps {
  discovery: AnimalScanResult;
  onPress: () => void;
  compact?: boolean;
}

export function AnimalCard({ discovery, onPress, compact = false }: AnimalCardProps) {
  const borderColor = rarityColor(discovery.rarity);
  const glow = rarityGlow(discovery.rarity);
  const biomeInfo = BIOMES.find((biome) => biome.id === discovery.biome);
  const cardStyles = compact ? styles.compactCard : styles.gridCard;
  const imageStyles = compact ? styles.imageSm : styles.imageLg;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, cardStyles, { borderColor, shadowColor: borderColor }]}
      activeOpacity={0.8}
    >
      <View style={[styles.glowOverlay, { backgroundColor: glow }]} />
      <View style={styles.topStripe} />

      <Image
        source={{ uri: discovery.imageUri }}
        style={imageStyles}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <View style={styles.dexRow}>
          <Text style={styles.dexNo}>#{discovery.id.slice(-3).padStart(3, '0')}</Text>
          {discovery.favorite && (
            <Ionicons name="heart" size={14} color={Colors.error} />
          )}
        </View>

        <View style={styles.header}>
          <View style={styles.nameBlock}>
            <Text style={styles.name} numberOfLines={1}>{discovery.animalName}</Text>
            <Text style={styles.scientific} numberOfLines={1}>{discovery.scientificName}</Text>
          </View>
        </View>

        {!compact && (
          <View style={styles.metaPills}>
            <RarityBadge rarity={discovery.rarity} size="sm" />
            <View style={styles.biomePill}>
              {biomeInfo && (
                <Ionicons name={biomeInfo.icon as keyof typeof Ionicons.glyphMap} size={11} color={biomeInfo.color} />
              )}
              <Text style={[styles.biomePillText, biomeInfo ? { color: biomeInfo.color } : undefined]}>
                {discovery.biome}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          {compact ? <RarityBadge rarity={discovery.rarity} size="sm" /> : <Text style={styles.captureLabel}>Captured</Text>}
          <Text style={styles.time}>{relativeTime(discovery.detectedAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadow.md,
    position: 'relative',
  },
  compactCard: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    minHeight: 84,
  },
  gridCard: {
    width: '48%',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.45,
  },
  topStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  imageSm: {
    width: 70,
    height: 70,
    margin: Spacing.sm,
    borderRadius: Radius.md,
  },
  imageLg: {
    width: '100%',
    height: 132,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  dexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dexNo: {
    ...Typography.labelSM,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameBlock: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  name: {
    ...Typography.h3,
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  scientific: {
    ...Typography.bodySM,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  metaPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  biomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  biomePillText: {
    ...Typography.labelSM,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  captureLabel: {
    ...Typography.labelSM,
    color: Colors.textMuted,
  },
  time: {
    ...Typography.bodySM,
    color: Colors.textMuted,
  },
});
