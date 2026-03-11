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
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { StatBar } from '@/components/ui/StatBar';
import { RarityBadge } from '@/components/ui/RarityBadge';
import { useDiscoveryById } from '@/hooks/useDiscoveries';
import { useDiscoveryStore } from '@/store';
import { rarityColor, rarityGlow } from '@/utils/rarityUtils';
import { formatDiscoveryDate, formatDiscoveryTime } from '@/utils/dateUtils';
import { STAT_KEYS } from '@/utils/statGenerator';
import { BIOMES } from '@/constants';
import type { RootStackParamList } from '@/navigation/types';

type RouteProps = RouteProp<RootStackParamList, 'AnimalDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function InfoSection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.infoSection}>
      <View style={styles.infoSectionHeader}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color={Colors.primary} />
        <Text style={styles.infoSectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function MetaRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={14} color={Colors.textMuted} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

export default function AnimalDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const discovery = useDiscoveryById(route.params?.id ?? '');
  const { toggleFavorite, saveNotes, removeDiscovery } = useDiscoveryStore();
  const [notes, setNotes] = useState(discovery?.notes ?? '');
  const [editingNotes, setEditingNotes] = useState(false);

  if (!discovery) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Discovery not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const borderColor = rarityColor(discovery.rarity);
  const biomeInfo = BIOMES.find((b) => b.id === discovery.biome);

  async function handleFavorite() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleFavorite(discovery!.id);
  }

  async function handleSaveNotes() {
    await saveNotes(discovery!.id, notes);
    setEditingNotes(false);
  }

  function handleDelete() {
    Alert.alert(
      'Remove Discovery',
      `Remove ${discovery!.animalName} from your PocketDex?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeDiscovery(discovery!.id);
            navigation.goBack();
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: discovery.imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', Colors.background]}
            style={styles.imageGradient}
          />

          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + Spacing.sm }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.favoriteButton, { top: insets.top + Spacing.sm }]}
            onPress={handleFavorite}
          >
            <Ionicons
              name={discovery.favorite ? 'heart' : 'heart-outline'}
              size={22}
              color={discovery.favorite ? Colors.error : '#fff'}
            />
          </TouchableOpacity>

          <View style={styles.rarityOverlay}>
            <RarityBadge rarity={discovery.rarity} size="lg" />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.nameBlock}>
            <Text style={styles.animalName}>{discovery.animalName}</Text>
            <Text style={styles.scientificName}>{discovery.scientificName}</Text>
          </View>

          <View style={styles.confidenceRow}>
            <View style={[styles.confidencePill, { borderColor }]}>
              <Ionicons name="analytics-outline" size={12} color={borderColor} />
              <Text style={[styles.confidenceText, { color: borderColor }]}>
                {Math.round(discovery.confidence * 100)}% confidence
              </Text>
            </View>
            <View style={styles.biomePill}>
              {biomeInfo && (
                <Ionicons
                  name={biomeInfo.icon as keyof typeof Ionicons.glyphMap}
                  size={12}
                  color={biomeInfo.color}
                />
              )}
              <Text style={[styles.biomePillText, biomeInfo && { color: biomeInfo.color }]}>
                {discovery.biome}
              </Text>
            </View>
          </View>

          <View style={[styles.card, { borderColor: borderColor + '44' }]}>
            <View style={[styles.cardGlow, { backgroundColor: rarityGlow(discovery.rarity) }]} />
            <Text style={styles.cardTitle}>CREATURE STATS</Text>
            {STAT_KEYS.map((key, i) => (
              <StatBar key={key} statKey={key} value={discovery.stats[key]} delay={i * 80} />
            ))}
          </View>

          <InfoSection icon="information-circle-outline" title="About">
            <Text style={styles.infoText}>{discovery.description}</Text>
          </InfoSection>
          <InfoSection icon="home-outline" title="Habitat">
            <Text style={styles.infoText}>{discovery.habitat}</Text>
          </InfoSection>
          <InfoSection icon="restaurant-outline" title="Diet">
            <Text style={styles.infoText}>{discovery.diet}</Text>
          </InfoSection>
          <InfoSection icon="footsteps-outline" title="Behaviour">
            <Text style={styles.infoText}>{discovery.behavior}</Text>
          </InfoSection>

          <View style={styles.metaCard}>
            <Text style={styles.cardTitle}>DISCOVERY LOG</Text>
            <MetaRow icon="calendar-outline" label="Date" value={formatDiscoveryDate(discovery.detectedAt)} />
            <MetaRow icon="time-outline" label="Time" value={formatDiscoveryTime(discovery.detectedAt)} />
            {discovery.latitude !== undefined && discovery.longitude !== undefined && (
              <MetaRow
                icon="location-outline"
                label="Location"
                value={`${discovery.latitude.toFixed(4)}°, ${discovery.longitude.toFixed(4)}°`}
              />
            )}
          </View>

          <View style={styles.notesCard}>
            <View style={styles.notesTitleRow}>
              <Text style={styles.cardTitle}>FIELD NOTES</Text>
              {!editingNotes ? (
                <TouchableOpacity onPress={() => setEditingNotes(true)}>
                  <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
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
                placeholder="Add notes about this sighting…"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
            ) : (
              <Text style={[styles.notesText, !notes && styles.notesPlaceholder]}>
                {notes || 'Tap the pencil to add field notes…'}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  notFound: { ...Typography.h3, color: Colors.textSecondary },
  back: { ...Typography.bodyMD, color: Colors.primary, marginTop: Spacing.md },
  imageContainer: { height: 320, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160 },
  backButton: {
    position: 'absolute', left: Spacing.lg,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute', right: Spacing.lg,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  rarityOverlay: { position: 'absolute', bottom: Spacing.md, left: Spacing.lg },
  content: { padding: Spacing.lg },
  nameBlock: { marginBottom: Spacing.sm },
  animalName: { ...Typography.displayLG, color: Colors.textPrimary },
  scientificName: { ...Typography.bodyLG, color: Colors.textMuted, fontStyle: 'italic', marginTop: 4 },
  confidenceRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  confidencePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, borderWidth: 1,
  },
  confidenceText: { ...Typography.labelMD },
  biomePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  biomePillText: { ...Typography.labelMD, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.lg, overflow: 'hidden',
  },
  cardGlow: { ...StyleSheet.absoluteFillObject },
  cardTitle: { ...Typography.labelSM, color: Colors.textMuted, marginBottom: Spacing.md },
  infoSection: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  infoSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  infoSectionTitle: {
    ...Typography.labelMD, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  infoText: { ...Typography.bodyMD, color: Colors.textSecondary, lineHeight: 22 },
  metaCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md,
    marginTop: Spacing.sm, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  metaLabel: { ...Typography.labelMD, color: Colors.textMuted, flex: 1 },
  metaValue: { ...Typography.bodyMD, color: Colors.textPrimary },
  notesCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md,
    marginVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  notesTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  notesText: { ...Typography.bodyMD, color: Colors.textSecondary, lineHeight: 22 },
  notesPlaceholder: { color: Colors.textMuted, fontStyle: 'italic' },
  notesInput: { ...Typography.bodyMD, color: Colors.textPrimary, minHeight: 80, textAlignVertical: 'top', lineHeight: 22 },
  saveNotesText: { ...Typography.labelMD, color: Colors.primary },
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginTop: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.error + '44', backgroundColor: Colors.error + '10',
  },
  deleteText: { ...Typography.labelMD, color: Colors.error },
});
