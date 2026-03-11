import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { useDiscoveryStore } from '@/store';
import { useProfileStore } from '@/store';
import { AnimalCard } from '@/components/ui/AnimalCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { rarestDiscovery } from '@/utils/achievementEngine';
import { completionPercentage } from '@/utils/achievementEngine';
import { ANIMAL_TEMPLATES } from '@/constants';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function StatChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statChip}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={Colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { discoveries } = useDiscoveryStore();
  const { totalScans, achievements } = useProfileStore();

  const recent = discoveries.slice(0, 3);
  const rarest = rarestDiscovery(discoveries);
  const completion = completionPercentage(discoveries, ANIMAL_TEMPLATES.length);
  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <LinearGradient
        colors={['#0f3460', '#16213e', '#0a0a14']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTag}>
          <View style={styles.liveDot} />
          <Text style={styles.heroTagText}>ON-DEVICE AI</Text>
        </View>

        <Text style={styles.heroTitle}>PocketDex AI</Text>
        <Text style={styles.heroSubtitle}>
          Point your camera at any animal. Identify, collect, and explore the natural world.
        </Text>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('MainTabs')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scanButtonGradient}
          >
            <Ionicons name="scan" size={20} color="#fff" />
            <Text style={styles.scanButtonText}>Scan an Animal</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatChip icon="search" label="Scans" value={String(totalScans)} />
        <StatChip icon="library" label="Collected" value={String(discoveries.length)} />
        <StatChip icon="trophy" label="Achievements" value={`${unlockedCount}/${achievements.length}`} />
        <StatChip icon="pie-chart" label="Complete" value={`${completion}%`} />
      </View>

      {/* Rarest find */}
      {rarest && (
        <View style={styles.section}>
          <SectionHeader title="Rarest Find" />
          <AnimalCard
            discovery={rarest}
            onPress={() => navigation.navigate('AnimalDetail', { id: rarest.id })}
          />
        </View>
      )}

      {/* Recent discoveries */}
      {recent.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Recent Discoveries" />
          {recent.map((d) => (
            <AnimalCard
              key={d.id}
              discovery={d}
              onPress={() => navigation.navigate('AnimalDetail', { id: d.id })}
            />
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
    margin: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '22',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  heroTagText: {
    ...Typography.labelSM,
    color: Colors.primary,
    fontSize: 10,
  },
  heroTitle: {
    ...Typography.displayXL,
    color: Colors.textPrimary,
  },
  heroSubtitle: {
    ...Typography.bodyMD,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  scanButton: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
  },
  scanButtonText: {
    ...Typography.labelLG,
    color: '#fff',
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  statValue: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  statLabel: {
    ...Typography.labelSM,
    color: Colors.textMuted,
    fontSize: 9,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
});
