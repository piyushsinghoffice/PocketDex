import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useBiomeCounts } from '@/hooks/useDiscoveries';
import { useDiscoveryStore } from '@/store';
import { BIOMES } from '@/constants';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const BIOME_TARGETS: Record<string, number> = {
  Forest: 5,
  Wetland: 5,
  Urban: 5,
  Grassland: 5,
  Mountain: 5,
  Coastal: 5,
};

function BannerStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.bannerStat}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={Colors.primary} />
      <Text style={styles.bannerStatValue}>{value}</Text>
      <Text style={styles.bannerStatLabel}>{label}</Text>
    </View>
  );
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const biomeCounts = useBiomeCounts();
  const { discoveries } = useDiscoveryStore();

  const totalBiomesExplored = Object.keys(biomeCounts).length;
  const totalAnimalsFound = discoveries.length;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Discover animals across every habitat</Text>
      </View>

      {/* Progress banner */}
      <LinearGradient
        colors={['#0f3460', '#16213e']}
        style={styles.banner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.bannerRow}>
          <BannerStat label="Animals Found" value={String(totalAnimalsFound)} icon="paw" />
          <View style={styles.bannerDivider} />
          <BannerStat label="Biomes Explored" value={`${totalBiomesExplored}/6`} icon="map" />
          <View style={styles.bannerDivider} />
          <BannerStat
            label="Completion"
            value={`${Math.round((totalBiomesExplored / 6) * 100)}%`}
            icon="pie-chart"
          />
        </View>
        <Text style={styles.bannerHint}>
          Explore all 6 biomes to unlock the Habitat Master achievement
        </Text>
      </LinearGradient>

      {/* Biome cards */}
      <View style={styles.section}>
        <SectionHeader title="Biomes" subtitle="Habitats waiting to be explored" />
        {BIOMES.map((biome) => {
          const count = biomeCounts[biome.id] ?? 0;
          const target = BIOME_TARGETS[biome.id] ?? 5;
          const progress = Math.min(count / target, 1);
          const explored = count > 0;

          return (
            <View
              key={biome.id}
              style={[styles.biomeCard, { borderColor: explored ? biome.color : Colors.border }]}
            >
              <View style={[styles.biomeCardTint, { backgroundColor: biome.color + (explored ? '15' : '08') }]} />

              <View style={styles.biomeCardRow}>
                <View style={[styles.biomeIcon, { backgroundColor: biome.color + '22', borderColor: biome.color + '44' }]}>
                  <Ionicons name={biome.icon as keyof typeof Ionicons.glyphMap} size={24} color={biome.color} />
                </View>

                <View style={styles.biomeTextBlock}>
                  <View style={styles.biomeNameRow}>
                    <Text style={styles.biomeName}>{biome.label}</Text>
                    {explored && (
                      <View style={[styles.exploredBadge, { backgroundColor: biome.color + '22', borderColor: biome.color }]}>
                        <Text style={[styles.exploredText, { color: biome.color }]}>EXPLORED</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.biomeDesc} numberOfLines={2}>{biome.description}</Text>

                  <View style={styles.progressRow}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${progress * 100}%`, backgroundColor: biome.color },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressLabel, { color: biome.color }]}>
                      {count}/{target}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.tipRow}>
                <Ionicons name="bulb-outline" size={12} color={Colors.textMuted} />
                <Text style={styles.tipText}>{biome.tip}</Text>
              </View>
            </View>
          );
        })}
      </View>

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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.bodySM,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  banner: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  bannerStat: {
    alignItems: 'center',
    gap: 4,
  },
  bannerStatValue: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  bannerStatLabel: {
    ...Typography.labelSM,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  bannerDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  bannerHint: {
    ...Typography.bodySM,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    paddingHorizontal: Spacing.lg,
  },
  biomeCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    padding: Spacing.md,
  },
  biomeCardTint: {
    ...StyleSheet.absoluteFillObject,
  },
  biomeCardRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  biomeIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biomeTextBlock: {
    flex: 1,
  },
  biomeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  biomeName: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  exploredBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  exploredText: {
    ...Typography.labelSM,
    fontSize: 8,
  },
  biomeDesc: {
    ...Typography.bodySM,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    ...Typography.monoMD,
    fontSize: 11,
    minWidth: 28,
    textAlign: 'right',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  tipText: {
    ...Typography.bodySM,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 17,
    fontStyle: 'italic',
  },
});
