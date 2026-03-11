import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { AchievementBadge } from '@/components/ui/AchievementBadge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useDiscoveryStore } from '@/store';
import { useProfile } from '@/hooks/useDiscoveries';
import { rarestDiscovery, completionPercentage } from '@/utils/achievementEngine';
import { rarityColor } from '@/utils/rarityUtils';
import { ANIMAL_TEMPLATES } from '@/constants';

function StatCard({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={20}
        color={Colors.primary}
      />
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { discoveries } = useDiscoveryStore();
  const { totalScans, achievements } = useProfile();

  const rarest = rarestDiscovery(discoveries);
  const completion = completionPercentage(discoveries, ANIMAL_TEMPLATES.length);
  const unlockedAchievements = achievements.filter((a) => a.unlockedAt);
  const lockedAchievements = achievements.filter((a) => !a.unlockedAt);

  const biomeCount = new Set(discoveries.map((d) => d.biome)).size;
  const favoriteCount = discoveries.filter((d) => d.favorite).length;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['#0f3460', '#16213e', '#0a0a14']}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.avatarWrap}>
          <Ionicons name="person" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.heroName}>Field Researcher</Text>
        <Text style={styles.heroSub}>PocketDex AI Explorer</Text>

        <View style={styles.completionBlock}>
          <View style={styles.completionRing}>
            <Text style={styles.completionValue}>{completion}%</Text>
            <Text style={styles.completionSub}>Complete</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.statsGrid}>
        <StatCard icon="search" label="Total Scans" value={String(totalScans)} />
        <StatCard icon="library" label="Discoveries" value={String(discoveries.length)} />
        <StatCard icon="map" label="Biomes" value={`${biomeCount}/6`} />
        <StatCard icon="heart" label="Favourites" value={String(favoriteCount)} />
        <StatCard icon="trophy" label="Achievements" value={`${unlockedAchievements.length}/${achievements.length}`} />
        {rarest && (
          <StatCard
            icon="diamond"
            label="Rarest"
            value={rarest.rarity}
            valueColor={rarityColor(rarest.rarity)}
          />
        )}
      </View>

      {rarest && (
        <View style={styles.section}>
          <SectionHeader title="Rarest Discovery" />
          <View style={[styles.rarestCard, { borderColor: rarityColor(rarest.rarity) }]}>
            <View style={[styles.rarestGlow, { backgroundColor: rarityColor(rarest.rarity) + '15' }]} />
            <View style={styles.rarestIcon}>
              <Ionicons name="star" size={24} color={rarityColor(rarest.rarity)} />
            </View>
            <View style={styles.rarestText}>
              <Text style={styles.rarestName}>{rarest.animalName}</Text>
              <Text style={styles.rarestSci}>{rarest.scientificName}</Text>
              <Text style={[styles.rarestRarity, { color: rarityColor(rarest.rarity) }]}>
                {rarest.rarity.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      )}

      {unlockedAchievements.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Achievements" subtitle={`${unlockedAchievements.length} unlocked`} />
          {unlockedAchievements.map((a) => (
            <AchievementBadge key={a.id} achievement={a} />
          ))}
        </View>
      )}

      {lockedAchievements.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Locked" subtitle={`${lockedAchievements.length} remaining`} />
          {lockedAchievements.map((a) => (
            <AchievementBadge key={a.id} achievement={a} />
          ))}
        </View>
      )}

      <View style={{ height: Spacing.xxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  hero: {
    padding: Spacing.xl,
    alignItems: 'center',
    paddingBottom: Spacing.xxl,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '22',
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroName: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  heroSub: {
    ...Typography.bodyMD,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.xl,
  },
  completionBlock: {
    alignItems: 'center',
  },
  completionRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
  },
  completionValue: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  completionSub: {
    ...Typography.labelSM,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    width: '30.5%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  statLabel: {
    ...Typography.labelSM,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  rarestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  rarestGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  rarestIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rarestText: {
    flex: 1,
  },
  rarestName: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  rarestSci: {
    ...Typography.bodySM,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  rarestRarity: {
    ...Typography.labelSM,
    marginTop: 4,
  },
});
