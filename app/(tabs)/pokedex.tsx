import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { AnimalCard } from '@/components/ui/AnimalCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFilteredDiscoveries } from '@/hooks/useDiscoveries';
import { useDiscoveryStore } from '@/store';
import { RarityTier, Biome } from '@/types';
import { ALL_RARITIES, rarityColor } from '@/utils/rarityUtils';
import { BIOMES } from '@/constants';

const SORT_OPTIONS = ['Newest', 'Oldest', 'Rarity', 'A-Z'] as const;
type SortOption = typeof SORT_OPTIONS[number];

export default function PokedexScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ biomeFilter?: string }>();
  const { discoveries } = useDiscoveryStore();
  const [search, setSearch] = useState('');
  const [rarity, setRarity] = useState<RarityTier | null>(null);
  const [biome, setBiome] = useState<Biome | null>(null);
  const [sort, setSort] = useState<SortOption>('Newest');
  const [showFilters, setShowFilters] = useState(false);

  // Apply biome filter passed from the Explore tab
  useEffect(() => {
    if (params.biomeFilter) {
      setBiome(params.biomeFilter as Biome);
      setShowFilters(true);
    }
  }, [params.biomeFilter]);

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
      <LinearGradient colors={['#de3341', '#ad2032']} style={styles.headerShell}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>PocketDex</Text>
            <Text style={styles.subtitle}>{discoveries.length} creatures catalogued</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowFilters((v) => !v)}
            style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={hasActiveFilters ? '#de3341' : Colors.textPrimary}
            />
            {hasActiveFilters && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search the dex..."
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
      </LinearGradient>

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
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <AnimalCard
            discovery={item}
            onPress={() => router.push({ pathname: '/animal/[id]', params: { id: item.id } })}
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
    backgroundColor: '#f4efe7',
  },
  headerShell: {
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
    color: '#fff9f2',
  },
  subtitle: {
    ...Typography.bodySM,
    color: 'rgba(255,249,242,0.82)',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    borderColor: '#fff',
    backgroundColor: '#fff9f2',
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
    backgroundColor: '#fff9f2',
    borderRadius: Radius.md,
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.md,
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: '#f4efe7',
  },
  filterLabel: {
    ...Typography.labelSM,
    color: '#6f665c',
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
    borderColor: '#d8cfbf',
    marginRight: Spacing.xs,
    backgroundColor: '#fff9f2',
  },
  chipActive: {
    borderColor: '#de3341',
    backgroundColor: 'rgba(222,51,65,0.12)',
  },
  chipText: {
    ...Typography.labelMD,
    color: '#483f36',
  },
  chipTextActive: {
    color: '#de3341',
  },
  clearFilters: {
    ...Typography.labelMD,
    color: Colors.error,
    marginTop: Spacing.sm,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    flexGrow: 1,
  },
});
