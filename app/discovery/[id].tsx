/**
 * Discovery result modal — shown immediately after a successful scan.
 * The user can review the result and choose to save it to their PocketDex,
 * or discard it and return to the camera.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { StatBar } from '@/components/ui/StatBar';
import { RarityBadge } from '@/components/ui/RarityBadge';
import { useDiscoveryStore } from '@/store';
import { useDiscoveryById } from '@/hooks/useDiscoveries';
import { rarityColor, rarityGlow } from '@/utils/rarityUtils';
import { STAT_KEYS } from '@/utils/statGenerator';

export default function DiscoveryResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const discovery = useDiscoveryById(id ?? '');

  if (!discovery) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Discovery data not available.</Text>
      </View>
    );
  }

  const borderColor = rarityColor(discovery.rarity);

  function handleViewFull() {
    router.replace({ pathname: '/animal/[id]', params: { id: discovery!.id } });
  }

  function handleClose() {
    router.back();
  }

  return (
    <View style={styles.root}>
      {/* Drag handle */}
      <View style={styles.handle} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: discovery.imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', Colors.background]}
            style={styles.imageGradient}
          />
          <View style={styles.rarityWrap}>
            <RarityBadge rarity={discovery.rarity} size="lg" />
          </View>
        </View>

        {/* Names */}
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{discovery.animalName}</Text>
          <Text style={styles.sci}>{discovery.scientificName}</Text>
        </View>

        {/* Confidence */}
        <View style={[styles.confPill, { borderColor }]}>
          <Ionicons name="analytics-outline" size={13} color={borderColor} />
          <Text style={[styles.confText, { color: borderColor }]}>
            {Math.round(discovery.confidence * 100)}% AI confidence · {discovery.biome}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>{discovery.description}</Text>

        {/* Stats card */}
        <View style={[styles.statsCard, { borderColor: borderColor + '44' }]}>
          <View style={[styles.statsGlow, { backgroundColor: rarityGlow(discovery.rarity) }]} />
          <Text style={styles.statsTitle}>CREATURE STATS</Text>
          {STAT_KEYS.map((key, i) => (
            <StatBar
              key={key}
              statKey={key}
              value={discovery.stats[key]}
              delay={i * 70}
            />
          ))}
        </View>

        {/* Quick facts */}
        <View style={styles.factsRow}>
          <FactChip icon="leaf-outline" label="Habitat" value={discovery.habitat.split(' — ')[0] ?? discovery.habitat} />
          <FactChip icon="restaurant-outline" label="Diet" value={discovery.diet.split(' — ')[0] ?? discovery.diet} />
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleViewFull} activeOpacity={0.85}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryGradient}
          >
            <Ionicons name="library" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>View Full Entry</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
          <Text style={styles.secondaryText}>Scan Another</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function FactChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.factChip}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color={Colors.primary} />
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  notFound: {
    ...Typography.bodyMD,
    color: Colors.textSecondary,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  content: {
    padding: Spacing.lg,
  },

  // Image
  imageWrap: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    height: 240,
    marginBottom: Spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  rarityWrap: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
  },

  // Names
  nameBlock: {
    marginBottom: Spacing.sm,
  },
  name: {
    ...Typography.displayLG,
    color: Colors.textPrimary,
  },
  sci: {
    ...Typography.bodyMD,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },

  // Confidence
  confPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  confText: {
    ...Typography.labelMD,
  },

  description: {
    ...Typography.bodyMD,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },

  // Stats
  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  statsGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  statsTitle: {
    ...Typography.labelSM,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },

  // Fact chips
  factsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  factChip: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  factLabel: {
    ...Typography.labelSM,
    color: Colors.textMuted,
  },
  factValue: {
    ...Typography.bodyMD,
    color: Colors.textPrimary,
    lineHeight: 18,
  },

  // Buttons
  primaryButton: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
  },
  primaryButtonText: {
    ...Typography.labelLG,
    color: '#fff',
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  secondaryText: {
    ...Typography.labelLG,
    color: Colors.textSecondary,
  },
});
