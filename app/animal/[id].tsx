import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { StatBar } from '@/components/ui/StatBar';
import { RarityBadge } from '@/components/ui/RarityBadge';
import { useDiscoveryById } from '@/hooks/useDiscoveries';
import { useDiscoveryStore } from '@/store';
import { rarityColor, rarityGlow } from '@/utils/rarityUtils';
import { formatDiscoveryDate, formatDiscoveryTime } from '@/utils/dateUtils';
import { STAT_KEYS } from '@/utils/statGenerator';
import { BIOMES } from '@/constants';

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const discovery = useDiscoveryById(id ?? '');
  const { toggleFavorite, saveNotes, removeDiscovery } = useDiscoveryStore();
  const [notes, setNotes] = useState(discovery?.notes ?? '');
  const [editingNotes, setEditingNotes] = useState(false);

  if (!discovery) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Discovery not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const current = discovery;
  const borderColor = rarityColor(current.rarity);
  const biomeInfo = BIOMES.find((b) => b.id === current.biome);
  const dexNo = `#${current.id.slice(-3).padStart(3, '0')}`;

  async function handleFavorite() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleFavorite(current.id);
  }

  async function handleSaveNotes() {
    await saveNotes(current.id, notes);
    setEditingNotes(false);
  }

  function handleDelete() {
    Alert.alert(
      'Remove Discovery',
      `Remove ${current.animalName} from your PocketDex?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeDiscovery(current.id);
            router.back();
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#f3efe5', '#ede0ca']} style={styles.heroShell}>
          <View style={styles.heroCard}>
            <View style={[styles.heroWash, { backgroundColor: borderColor + '20' }]} />
            <TouchableOpacity
              style={[styles.heroButton, styles.backButton, { top: insets.top + Spacing.sm }]}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={22} color="#2a241d" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.heroButton, styles.favoriteButton, { top: insets.top + Spacing.sm }]}
              onPress={handleFavorite}
            >
              <Ionicons
                name={current.favorite ? 'heart' : 'heart-outline'}
                size={22}
                color={current.favorite ? Colors.error : '#2a241d'}
              />
            </TouchableOpacity>

            <View style={styles.heroTopRow}>
              <Text style={styles.dexNo}>{dexNo}</Text>
              <RarityBadge rarity={current.rarity} size="lg" />
            </View>

            <Image source={{ uri: current.imageUri }} style={styles.heroImage} resizeMode="cover" />

            <View style={styles.typeRow}>
              <View style={[styles.typeChip, { borderColor }]}>
                {biomeInfo && (
                  <Ionicons name={biomeInfo.icon as keyof typeof Ionicons.glyphMap} size={13} color={biomeInfo.color} />
                )}
                <Text style={[styles.typeChipText, biomeInfo ? { color: biomeInfo.color } : undefined]}>
                  {current.biome}
                </Text>
              </View>
              <View style={styles.typeChip}>
                <Ionicons name="analytics-outline" size={13} color={borderColor} />
                <Text style={[styles.typeChipText, { color: borderColor }]}>
                  {Math.round(current.confidence * 100)}% confidence
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.animalName}>{current.animalName}</Text>
              <Text style={styles.scientificName}>{current.scientificName}</Text>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <MetricCard label="Power" value={String(current.stats.power)} />
            <MetricCard label="Agility" value={String(current.stats.agility)} />
            <MetricCard label="Intel" value={String(current.stats.intelligence)} />
          </View>

          <View style={[styles.card, { borderColor: borderColor + '44' }]}>
            <View style={[styles.cardGlow, { backgroundColor: rarityGlow(current.rarity) }]} />
            <Text style={styles.cardTitle}>Base Stats</Text>
            {STAT_KEYS.map((key, i) => (
              <StatBar key={key} statKey={key} value={current.stats[key]} delay={i * 80} />
            ))}
          </View>

          <InfoSection icon="information-circle-outline" title="About">
            <Text style={styles.infoText}>{current.description}</Text>
          </InfoSection>

          <InfoSection icon="home-outline" title="Habitat">
            <Text style={styles.infoText}>{current.habitat}</Text>
          </InfoSection>

          <InfoSection icon="restaurant-outline" title="Diet">
            <Text style={styles.infoText}>{current.diet}</Text>
          </InfoSection>

          <InfoSection icon="footsteps-outline" title="Behaviour">
            <Text style={styles.infoText}>{current.behavior}</Text>
          </InfoSection>

          <View style={styles.metaCard}>
            <Text style={styles.cardTitle}>Dex Record</Text>
            <MetaRow icon="calendar-outline" label="Date" value={formatDiscoveryDate(current.detectedAt)} />
            <MetaRow icon="time-outline" label="Time" value={formatDiscoveryTime(current.detectedAt)} />
            {current.latitude !== undefined && current.longitude !== undefined && (
              <MetaRow
                icon="location-outline"
                label="Location"
                value={`${current.latitude.toFixed(4)}°, ${current.longitude.toFixed(4)}°`}
              />
            )}
          </View>

          <View style={styles.notesCard}>
            <View style={styles.notesTitleRow}>
              <Text style={styles.cardTitle}>Trainer Notes</Text>
              {!editingNotes ? (
                <TouchableOpacity onPress={() => setEditingNotes(true)}>
                  <Ionicons name="pencil-outline" size={16} color="#de3341" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleSaveNotes}>
                  <Text style={styles.saveNotesText}>Save</Text>
                </TouchableOpacity>
              )}
            </View>
            {editingNotes ? (
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholder="Add notes about this sighting..."
                placeholderTextColor="#9a8f83"
                autoFocus
              />
            ) : (
              <Text style={[styles.notesText, !notes && styles.notesPlaceholder]}>
                {notes || 'Tap the pencil to add trainer notes...'}
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
            <Text style={styles.deleteText}>Remove from PocketDex</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoSection({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.infoSection}>
      <View style={styles.infoSectionHeader}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color="#de3341" />
        <Text style={styles.infoSectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function MetaRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={14} color="#8c7d70" />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4efe7',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4efe7',
  },
  notFound: {
    ...Typography.h3,
    color: '#4d453d',
  },
  back: {
    ...Typography.bodyMD,
    color: '#de3341',
    marginTop: Spacing.md,
  },
  heroShell: {
    paddingBottom: Spacing.lg,
  },
  heroCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    minHeight: 336,
    backgroundColor: '#fff8ef',
    ...Shadow.md,
  },
  heroWash: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTopRow: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.lg,
    alignItems: 'flex-end',
    gap: Spacing.sm,
    zIndex: 2,
  },
  dexNo: {
    ...Typography.labelLG,
    color: '#6f665c',
  },
  heroButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  backButton: {
    left: Spacing.lg,
  },
  favoriteButton: {
    right: Spacing.lg,
  },
  heroImage: {
    width: '100%',
    height: 255,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#e2d5c2',
  },
  typeChipText: {
    ...Typography.labelMD,
    color: '#4d453d',
  },
  content: {
    padding: Spacing.lg,
  },
  nameRow: {
    marginBottom: Spacing.md,
  },
  animalName: {
    ...Typography.displayLG,
    color: '#221c17',
    textTransform: 'capitalize',
  },
  scientificName: {
    ...Typography.bodyLG,
    color: '#7f7367',
    fontStyle: 'italic',
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff8ef',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2d5c2',
  },
  metricValue: {
    ...Typography.h3,
    color: '#221c17',
  },
  metricLabel: {
    ...Typography.labelSM,
    color: '#7f7367',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff8ef',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  cardTitle: {
    ...Typography.labelSM,
    color: '#7f7367',
    marginBottom: Spacing.md,
    letterSpacing: 1.1,
  },
  infoSection: {
    backgroundColor: '#fff8ef',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2d5c2',
  },
  infoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoSectionTitle: {
    ...Typography.labelLG,
    color: '#221c17',
  },
  infoText: {
    ...Typography.bodyMD,
    color: '#4d453d',
    lineHeight: 22,
  },
  metaCard: {
    backgroundColor: '#fff8ef',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2d5c2',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metaLabel: {
    ...Typography.bodySM,
    color: '#7f7367',
    flex: 1,
    marginLeft: Spacing.sm,
  },
  metaValue: {
    ...Typography.bodySM,
    color: '#221c17',
    fontFamily: Typography.monoMD.fontFamily,
  },
  notesCard: {
    backgroundColor: '#fff8ef',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2d5c2',
  },
  notesTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  saveNotesText: {
    ...Typography.labelMD,
    color: '#de3341',
  },
  notesInput: {
    ...Typography.bodyMD,
    color: '#221c17',
    backgroundColor: '#f3ede2',
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  notesText: {
    ...Typography.bodyMD,
    color: '#4d453d',
    lineHeight: 22,
  },
  notesPlaceholder: {
    color: '#9a8f83',
    fontStyle: 'italic',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  deleteText: {
    ...Typography.labelLG,
    color: Colors.error,
  },
});
