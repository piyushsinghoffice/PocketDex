import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { AnimalCard } from '@/components/ui/AnimalCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFilteredDiscoveries } from '@/hooks/useDiscoveries';
import { useDiscoveryStore } from '@/store';
import { RarityTier, Biome } from '@/types';
import { ALL_RARITIES, rarityColor } from '@/utils/rarityUtils';
import { BIOMES } from '@/constants';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SORT_OPTIONS = ['Newest', 'Oldest', 'Rarity', 'A-Z'] as const;
type SortOption = typeof SORT_OPTIONS[number];

export default function PokedexScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { discoveries } = useDiscoveryStore();
  const [search, setSearch] = useState('');
  const [rarity, setRarity] = useState<RarityTier | null>(null);
  const [biome, setBiome] = useState<Biome | null>(null);
  const [sort, setSort] = useState<SortOption>('Newest');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useFilteredDiscoveries({ search, rarity, biome });

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'Newest': return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
      case 'Oldest': return new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime();
      case 'Rarity': {
        const order: Record<string, number> = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4 };
        return order[b.rarity] - order[a.rarity];
      }
      case 'A-Z': return a.animalName.localeCompare(b.animalName);
    }
  });

  const hasActiveFilters = rarity !== null || biome !== null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>PocketDex</Text>
          <Text style={styles.subtitle}>{discoveries.length} creatures discovered</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters((v) => !v)}
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={hasActiveFilters ? Colors.primary : Colors.textSecondary}
          />
          {hasActiveFilters && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search animals…"
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <Text style={styles.filterLabel}>Rarity</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {ALL_RARITIES.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.chip, rarity === r && { borderColor: rarityColor(r), backgroundColor: rarityColor(r) + '22' }]}
                onPress={() => setRarity(rarity === r ? null : r)}
              >
                <Text style={[styles.chipText, rarity === r && { color: rarityColor(r) }]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.filterLabel, { marginTop: Spacing.sm }]}>Biome</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {BIOMES.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[styles.chip, biome === b.id && { borderColor: b.color, backgroundColor: b.color + '22' }]}
                onPress={() => setBiome(biome === b.id ? null : b.id)}
              >
                <Text style={[styles.chipText, biome === b.id && { color: b.color }]}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.filterLabel, { marginTop: Spacing.sm }]}>Sort</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {SORT_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, sort === s && styles.chipActive]}
                onPress={() => setSort(s)}
              >
                <Text style={[styles.chipText, sort === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {hasActiveFilters && (
            <TouchableOpacity onPress={() => { setRarity(null); setBiome(null); }}>
              <Text style={styles.clearFilters}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* List */}
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <AnimalCard
            discovery={item}
            onPress={() => navigation.navigate('AnimalDetail', { id: item.id })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="paw-outline"
            title={discoveries.length === 0 ? 'No discoveries yet' : 'No matches found'}
            subtitle={
              discoveries.length === 0
                ? 'Go outside and scan your first animal to start your collection.'
                : 'Try adjusting your search or filters.'
            }
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '18',
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 44,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMD,
    color: Colors.textPrimary,
    height: '100%',
  },
  filtersPanel: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterLabel: {
    ...Typography.labelSM,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.xs,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '22',
  },
  chipText: {
    ...Typography.labelMD,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.primary,
  },
  clearFilters: {
    ...Typography.labelMD,
    color: Colors.error,
    marginTop: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
    flexGrow: 1,
  },
});
