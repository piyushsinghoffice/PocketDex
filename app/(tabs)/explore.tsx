import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, Radius } from '@/theme';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useBiomeCounts } from '@/hooks/useDiscoveries';
import { useDiscoveryStore } from '@/store';
import { BIOMES } from '@/constants';

const BIOME_TARGETS: Record<string, number> = {
  Forest: 5,
  Wetland: 5,
  Urban: 5,
  Grassland: 5,
  Mountain: 5,
  Coastal: 5,
};

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Survey every biome like a route map</Text>
      </View>

      <LinearGradient colors={['#5dc7a5', '#2bb68a']} style={styles.banner}>
        <View style={styles.bannerRow}>
          <BannerStat label="Animals" value={String(totalAnimalsFound)} icon="paw" />
          <View style={styles.bannerDivider} />
          <BannerStat label="Biomes" value={`${totalBiomesExplored}/6`} icon="map" />
          <View style={styles.bannerDivider} />
          <BannerStat label="Clear" value={`${Math.round((totalBiomesExplored / 6) * 100)}%`} icon="pie-chart" />
        </View>
        <Text style={styles.bannerHint}>Clear all six habitats to complete the route chart</Text>
      </LinearGradient>

      <View style={styles.section}>
        <SectionHeader title="Biomes" subtitle="Habitats waiting to be explored" />
        {BIOMES.map((biome) => {
          const count = biomeCounts[biome.id] ?? 0;
          const target = BIOME_TARGETS[biome.id] ?? 5;
          const progress = Math.min(count / target, 1);
          const explored = count > 0;

          return (
            <TouchableOpacity
              key={biome.id}
              style={[styles.biomeCard, { borderColor: explored ? biome.color : '#d8cfbf' }]}
              onPress={() => router.push({ pathname: '/(tabs)/pokedex', params: { biomeFilter: biome.id } })}
              activeOpacity={0.82}
            >
              <View style={[styles.biomeCardTint, { backgroundColor: biome.color + (explored ? '14' : '08') }]} />
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
                      <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: biome.color }]} />
                    </View>
                    <Text style={[styles.progressLabel, { color: biome.color }]}>{count}/{target}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.tipRow}>
                <Ionicons name="bulb-outline" size={12} color="#8c7d70" />
                <Text style={styles.tipText}>{biome.tip}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: Spacing.xxxl }} />
    </ScrollView>
  );
}

function BannerStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.bannerStat}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color="#fff8ef" />
      <Text style={styles.bannerStatValue}>{value}</Text>
      <Text style={styles.bannerStatLabel}>{label}</Text>
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: '#221c17',
  },
  subtitle: {
    ...Typography.bodySM,
    color: '#7f7367',
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
    color: '#fff8ef',
  },
  bannerStatLabel: {
    ...Typography.labelSM,
    color: 'rgba(255,248,239,0.82)',
    textAlign: 'center',
  },
  bannerDivider: {
    width: 1,
    backgroundColor: 'rgba(255,248,239,0.2)',
  },
  bannerHint: {
    ...Typography.bodySM,
    color: 'rgba(255,248,239,0.82)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    paddingHorizontal: Spacing.lg,
  },
  biomeCard: {
    backgroundColor: '#fff8ef',
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
    color: '#221c17',
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
    color: '#5a5047',
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
    height: 8,
    backgroundColor: '#e8dcc7',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressLabel: {
    ...Typography.labelMD,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  tipText: {
    ...Typography.bodySM,
    color: '#7f7367',
    flex: 1,
  },
});
