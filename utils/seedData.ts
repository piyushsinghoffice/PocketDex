/**
 * Seeds the local SQLite database with sample discoveries for testing/demo.
 * Call this once from the root layout when the DB is first initialised
 * and the collection is empty.
 *
 * Uses placeholder image URIs — replace with real local asset paths
 * or Expo asset references in production.
 */
import { AnimalScanResult } from '@/types';
import { ANIMAL_TEMPLATES } from '@/constants';
import { generateStats, generateConfidence } from './statGenerator';
import { getAllDiscoveries, insertDiscovery } from '@/db/discoveryRepository';

function fakeId(i: number): string {
  return `seed-${i}-${Math.random().toString(36).slice(2, 7)}`;
}

function fakeDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

// Using a royalty-free placeholder — swap with real images or Expo bundled assets
const PLACEHOLDER_IMAGE = 'https://placehold.co/400x400/16213e/4f9cf9?text=Animal';

export async function seedSampleDiscoveries(): Promise<void> {
  const existing = await getAllDiscoveries();
  if (existing.length > 0) return; // Already seeded

  const seeds: AnimalScanResult[] = [
    buildSeed(0, 'Red Fox', 0),
    buildSeed(1, 'Tawny Owl', 2),
    buildSeed(2, 'European Otter', 5),
    buildSeed(3, 'Mallard Duck', 7),
    buildSeed(4, 'Eastern Grey Squirrel', 10),
    buildSeed(5, 'European Robin', 12),
  ];

  for (const seed of seeds) {
    await insertDiscovery(seed);
  }
}

function buildSeed(i: number, name: string, daysAgo: number): AnimalScanResult {
  const template = ANIMAL_TEMPLATES.find((t) => t.animalName === name) ?? ANIMAL_TEMPLATES[0];
  return {
    id: fakeId(i),
    animalName: template.animalName,
    scientificName: template.scientificName,
    description: template.description,
    habitat: template.habitat,
    diet: template.diet,
    behavior: template.behavior,
    rarity: template.rarity,
    confidence: generateConfidence(template.rarity),
    stats: generateStats(template),
    biome: template.biome,
    imageUri: PLACEHOLDER_IMAGE,
    detectedAt: fakeDate(daysAgo),
    favorite: i === 2, // Seed one favourite
    notes: i === 0 ? 'Spotted at the forest edge near the old oak. Very bold individual.' : '',
  };
}
