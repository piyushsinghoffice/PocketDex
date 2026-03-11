import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, Radius } from '@/theme';
import { AchievementBadge } from '@/components/ui/AchievementBadge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useDiscoveryStore } from '@/store';
import { useProfile } from '@/hooks/useDiscoveries';
import { rarestDiscovery, completionPercentage } from '@/utils/achievementEngine';
import { rarityColor } from '@/utils/rarityUtils';
import { ANIMAL_TEMPLATES } from '@/constants';

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
      <LinearGradient colors={['#6cb9e9', '#50a8de', '#6cb9e9']} style={styles.hero}>
        <View style={styles.avatarWrap}>
          <Ionicons name="person" size={40} color="#fff8ef" />
        </View>
        <Text style={styles.heroName}>Field Researcher</Text>
        <Text style={styles.heroSub}>PocketDex explorer profile</Text>
        <View style={styles.completionRing}>
          <Text style={styles.completionValue}>{completion}%</Text>
          <Text style={styles.completionSub}>Complete</Text>
        </View>
      </LinearGradient>

      <View style={styles.statsGrid}>
        <StatCard icon="search" label="Scans" value={String(totalScans)} />
        <StatCard icon="library" label="Entries" value={String(discoveries.length)} />
        <StatCard icon="map" label="Biomes" value={`${biomeCount}/6`} />
        <StatCard icon="heart" label="Favs" value={String(favoriteCount)} />
        <StatCard icon="trophy" label="Badges" value={`${unlockedAchievements.length}/${achievements.length}`} />
        {rarest && <StatCard icon="diamond" label="Rarest" value={rarest.rarity} valueColor={rarityColor(rarest.rarity)} />}
      </View>

      {rarest && (
        <View style={styles.section}>
          <SectionHeader title="Rarest Discovery" subtitle="Signature encounter" />
          <View style={[styles.rarestCard, { borderColor: rarityColor(rarest.rarity) }]}>
            <View style={[styles.rarestGlow, { backgroundColor: rarityColor(rarest.rarity) + '15' }]} />
            <View style={styles.rarestIcon}>
              <Ionicons name="star" size={24} color={rarityColor(rarest.rarity)} />
            </View>
            <View style={styles.rarestText}>
              <Text style={styles.rarestName}>{rarest.animalName}</Text>
              <Text style={styles.rarestSci}>{rarest.scientificName}</Text>
              <Text style={[styles.rarestRarity, { color: rarityColor(rarest.rarity) }]}>{rarest.rarity.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      )}

      {unlockedAchievements.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Achievements" subtitle={`${unlockedAchievements.length} unlocked`} />
          {unlockedAchievements.map((a) => <AchievementBadge key={a.id} achievement={a} />)}
        </View>
      )}

      {lockedAchievements.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Locked" subtitle={`${lockedAchievements.length} remaining`} />
          {lockedAchievements.map((a) => <AchievementBadge key={a.id} achievement={a} />)}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>PocketDex AI</Text>
        <Text style={styles.footerSub}>Made by Piyush Singh</Text>
        <Text style={styles.footerVersion}>v1.0.0 · On-device AI · Your data never leaves this device</Text>
      </View>

      <View style={{ height: Spacing.xxxl }} />
    </ScrollView>
  );
}

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
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color="#de3341" />
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4efe7',
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  hero: {
    padding: Spacing.xl,
    alignItems: 'center',
    paddingBottom: Spacing.xxl,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroName: {
    ...Typography.h2,
    color: '#fff8ef',
  },
  heroSub: {
    ...Typography.bodyMD,
    color: 'rgba(255,248,239,0.82)',
    marginTop: 4,
    marginBottom: Spacing.xl,
  },
  completionRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff8ef',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  completionValue: {
    ...Typography.h1,
    color: '#fff8ef',
  },
  completionSub: {
    ...Typography.labelSM,
    color: 'rgba(255,248,239,0.82)',
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
    backgroundColor: '#fff8ef',
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: '#e2d5c2',
  },
  statValue: {
    ...Typography.h2,
    color: '#221c17',
  },
  statLabel: {
    ...Typography.labelSM,
    color: '#7f7367',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  rarestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8ef',
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
    backgroundColor: '#f3ede2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rarestText: {
    flex: 1,
  },
  rarestName: {
    ...Typography.h3,
    color: '#221c17',
  },
  rarestSci: {
    ...Typography.bodySM,
    color: '#7f7367',
    fontStyle: 'italic',
  },
  rarestRarity: {
    ...Typography.labelSM,
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    gap: 4,
  },
  footerText: {
    ...Typography.labelLG,
    color: '#483f36',
  },
  footerSub: {
    ...Typography.bodyMD,
    color: '#de3341',
  },
  footerVersion: {
    ...Typography.bodySM,
    color: '#b0a89a',
    textAlign: 'center',
    marginTop: 2,
    fontSize: 11,
  },
});
