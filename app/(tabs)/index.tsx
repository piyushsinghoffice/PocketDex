import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, Radius } from '@/theme';
import { useDiscoveryStore, useProfileStore } from '@/store';
import { AnimalCard } from '@/components/ui/AnimalCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { rarestDiscovery, completionPercentage } from '@/utils/achievementEngine';
import { ANIMAL_TEMPLATES } from '@/constants';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { discoveries } = useDiscoveryStore();
  const { totalScans, achievements } = useProfileStore();

  const recent = discoveries.slice(0, 4);
  const rarest = rarestDiscovery(discoveries);
  const completion = completionPercentage(discoveries, ANIMAL_TEMPLATES.length);
  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={['#de3341', '#b42034']} style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroTag}>
            <View style={styles.liveDot} />
            <Text style={styles.heroTagText}>FIELD SCANNER</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="radio-button-on" size={18} color="#fff8ef" />
          </View>
        </View>

        <Text style={styles.heroTitle}>PocketDex</Text>
        <Text style={styles.heroSubtitle}>
          Scan, catalog, and review every creature like a pocket field cartridge.
        </Text>

        <TouchableOpacity style={styles.scanButton} onPress={() => router.push('/(tabs)/scan')} activeOpacity={0.85}>
          <LinearGradient colors={['#fff8ef', '#f6ecdc']} style={styles.scanButtonGradient}>
            <Ionicons name="scan" size={20} color="#de3341" />
            <Text style={styles.scanButtonText}>Scan an Animal</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.statsRow}>
        <StatChip icon="search" label="Scans" value={String(totalScans)} />
        <StatChip icon="library" label="Collected" value={String(discoveries.length)} />
        <StatChip icon="trophy" label="Badges" value={`${unlockedCount}/${achievements.length}`} />
        <StatChip icon="pie-chart" label="Dex" value={`${completion}%`} />
      </View>

      {rarest && (
        <View style={styles.section}>
          <SectionHeader title="Rarest Find" subtitle="Best encounter so far" />
          <AnimalCard
            discovery={rarest}
            compact
            onPress={() => router.push({ pathname: '/animal/[id]', params: { id: rarest.id } })}
          />
        </View>
      )}

      {recent.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            title="Recent Captures"
            subtitle="Latest dex entries"
            action={{ label: 'View all', onPress: () => router.push('/(tabs)/pokedex') }}
          />
          <View style={styles.recentGrid}>
            {recent.map((d) => (
              <AnimalCard
                key={d.id}
                discovery={d}
                onPress={() => router.push({ pathname: '/animal/[id]', params: { id: d.id } })}
              />
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <SectionHeader title="Field Manual" subtitle="How the dex works" />
        <FeatureCard icon="camera-outline" title="Scan" body="Aim the camera at an animal and capture the frame." />
        <FeatureCard icon="sparkles-outline" title="Identify" body="On-device VLM inference extracts the creature entry." />
        <FeatureCard icon="albums-outline" title="Catalog" body="Every discovery is stored as a collectible PocketDex record." />
      </View>

      <View style={{ height: Spacing.xxxl }} />
    </ScrollView>
  );
}

function StatChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statChip}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color="#de3341" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={24} color="#de3341" />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureBody}>{body}</Text>
      </View>
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
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff8ef',
  },
  heroTagText: {
    ...Typography.labelSM,
    color: '#fff8ef',
  },
  heroBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroTitle: {
    ...Typography.displayXL,
    color: '#fff8ef',
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    ...Typography.bodyLG,
    color: 'rgba(255,248,239,0.82)',
    lineHeight: 26,
    marginBottom: Spacing.xl,
  },
  scanButton: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  scanButtonText: {
    ...Typography.labelLG,
    color: '#de3341',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#fff8ef',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: '#e2d5c2',
  },
  statValue: {
    ...Typography.h3,
    color: '#221c17',
  },
  statLabel: {
    ...Typography.labelSM,
    color: '#7f7367',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#fff8ef',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#e2d5c2',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(222,51,65,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.labelLG,
    color: '#221c17',
    marginBottom: 4,
  },
  featureBody: {
    ...Typography.bodySM,
    color: '#5a5047',
    lineHeight: 18,
  },
});
