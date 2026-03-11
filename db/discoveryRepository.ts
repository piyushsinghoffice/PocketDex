import { getDatabase } from './database';
import { AnimalScanResult, AnimalStats } from '@/types';

// ─── Row → Domain ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToDiscovery(row: any): AnimalScanResult {
  return {
    id: row.id,
    animalName: row.animal_name,
    scientificName: row.scientific_name,
    description: row.description,
    habitat: row.habitat,
    diet: row.diet,
    behavior: row.behavior,
    rarity: row.rarity,
    confidence: row.confidence,
    biome: row.biome,
    imageUri: row.image_uri,
    detectedAt: row.detected_at,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    favorite: row.favorite === 1,
    notes: row.notes ?? '',
    stats: JSON.parse(row.stats_json) as AnimalStats,
  };
}

// ─── Repository ───────────────────────────────────────────────────────────────

export async function insertDiscovery(discovery: AnimalScanResult): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO discoveries (
      id, animal_name, scientific_name, description, habitat, diet, behavior,
      rarity, confidence, biome, image_uri, detected_at,
      latitude, longitude, favorite, notes, stats_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      discovery.id,
      discovery.animalName,
      discovery.scientificName,
      discovery.description,
      discovery.habitat,
      discovery.diet,
      discovery.behavior,
      discovery.rarity,
      discovery.confidence,
      discovery.biome,
      discovery.imageUri,
      discovery.detectedAt,
      discovery.latitude ?? null,
      discovery.longitude ?? null,
      discovery.favorite ? 1 : 0,
      discovery.notes,
      JSON.stringify(discovery.stats),
    ]
  );
}

export async function getAllDiscoveries(): Promise<AnimalScanResult[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM discoveries ORDER BY detected_at DESC'
  );
  return rows.map(rowToDiscovery);
}

export async function getDiscoveryById(id: string): Promise<AnimalScanResult | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM discoveries WHERE id = ?',
    [id]
  );
  return row ? rowToDiscovery(row) : null;
}

export async function updateFavorite(id: string, favorite: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE discoveries SET favorite = ? WHERE id = ?',
    [favorite ? 1 : 0, id]
  );
}

export async function updateNotes(id: string, notes: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE discoveries SET notes = ? WHERE id = ?',
    [notes, id]
  );
}

export async function deleteDiscovery(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM discoveries WHERE id = ?', [id]);
}

export async function getDiscoveryCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM discoveries'
  );
  return row?.count ?? 0;
}
