/**
 * LlamaInferenceService
 *
 * On-device VLM inference using llama.rn (React Native llama.cpp wrapper).
 * Uses multiple small prompts instead of a single large JSON prompt because
 * smaller VLMs often truncate structured responses after the first field.
 */

import { IInferenceService } from './InferenceService';
import { AnimalScanResult, RarityTier, Biome } from '@/types';
import { loadModel } from '@/services/model/ModelManager';

const VALID_RARITIES = new Set<string>(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']);
const VALID_BIOMES   = new Set<string>(['Forest', 'Wetland', 'Urban', 'Grassland', 'Mountain', 'Coastal', 'Desert', 'Unknown']);
const UNKNOWN_NAMES  = new Set<string>(['unknown', 'unknown animal', 'animal', 'species indeterminate', 'species unknown']);

function safeStr(val: unknown, fallback: string): string {
  return typeof val === 'string' && val.trim().length > 0 ? val.trim() : fallback;
}

function safeFloat(val: unknown, fallback: number): number {
  const n = parseFloat(String(val));
  return isNaN(n) ? fallback : Math.max(0, Math.min(1, n));
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

function sanitizeText(text: string): string {
  return text
    .replace(/```json|```/gi, '')
    .replace(/^[{\s"]+/, '')
    .replace(/[}\s"]+$/, '')
    .replace(/\n+/g, ' ')
    .trim();
}

function cleanFieldValue(text: string): string {
  const cleaned = sanitizeText(text)
    .replace(/^animalname\s*:\s*/i, '')
    .replace(/^scientificname\s*:\s*/i, '')
    .replace(/^description\s*:\s*/i, '')
    .replace(/^habitat\s*:\s*/i, '')
    .replace(/^diet\s*:\s*/i, '')
    .replace(/^behavior\s*:\s*/i, '')
    .replace(/^rarity\s*:\s*/i, '')
    .replace(/^biome\s*:\s*/i, '')
    .replace(/^confidence\s*:\s*/i, '')
    .replace(/^"+|"+$/g, '')
    .replace(/,$/, '')
    .trim();
  return cleaned;
}

function extractScientificName(text: string): string {
  const cleaned = cleanFieldValue(text);
  const match = cleaned.match(/\b([A-Z][a-z]+ [a-z][a-z-]+)\b/);
  return match?.[1] ?? cleaned;
}

function extractSingleSentence(text: string): string {
  const cleaned = cleanFieldValue(text);
  const match = cleaned.match(/^[^.?!]+[.?!]?/);
  return match?.[0]?.trim() || cleaned;
}

function extractHabitat(text: string, animalName: string): string {
  const cleaned = cleanFieldValue(text);
  const lower = normalizeName(cleaned);
  if (!cleaned || lower === normalizeName(animalName)) return 'Unknown';
  if (cleaned.split(' ').length < 2) return 'Unknown';
  return cleaned;
}

function extractDiet(text: string): string {
  return cleanFieldValue(text).replace(/^the diet is\s*/i, '');
}

function normalizeConfidence(value: string): number {
  return safeFloat(cleanFieldValue(value), 0.5);
}

function normalizeRarity(value: string): RarityTier {
  const cleaned = cleanFieldValue(value);
  return VALID_RARITIES.has(cleaned) ? (cleaned as RarityTier) : 'Common';
}

// Animals that are clearly NOT Urban — override if the model returns Urban for them
const NEVER_URBAN: Record<string, Biome> = {
  tiger: 'Forest', lion: 'Grassland', bear: 'Forest', wolf: 'Forest',
  leopard: 'Forest', cheetah: 'Grassland', jaguar: 'Forest', panther: 'Forest',
  elephant: 'Grassland', rhino: 'Grassland', hippo: 'Wetland', giraffe: 'Grassland',
  zebra: 'Grassland', bison: 'Grassland', buffalo: 'Grassland', moose: 'Forest',
  deer: 'Forest', elk: 'Forest', reindeer: 'Forest', caribou: 'Forest',
  eagle: 'Mountain', hawk: 'Forest', owl: 'Forest', falcon: 'Mountain',
  dolphin: 'Coastal', whale: 'Coastal', seal: 'Coastal', otter: 'Wetland',
  crocodile: 'Wetland', alligator: 'Wetland', frog: 'Wetland',
  camel: 'Desert', scorpion: 'Desert', rattlesnake: 'Desert',
  gorilla: 'Forest', orangutan: 'Forest', chimpanzee: 'Forest',
  'snow leopard': 'Mountain', 'mountain goat': 'Mountain', ibex: 'Mountain',
  'polar bear': 'Mountain', penguin: 'Coastal', flamingo: 'Wetland',
};

function normalizeBiome(value: string, animalName = ''): Biome {
  const cleaned = cleanFieldValue(value);
  const biome = VALID_BIOMES.has(cleaned) ? (cleaned as Biome) : 'Unknown';

  // Override clearly wrong Urban assignments for wild animals
  if (biome === 'Urban' && animalName) {
    const lower = animalName.toLowerCase();
    for (const [key, override] of Object.entries(NEVER_URBAN)) {
      if (lower.includes(key)) return override;
    }
  }

  return biome;
}

function isUnknownAnimalName(value: string): boolean {
  return UNKNOWN_NAMES.has(normalizeName(value));
}

function buildMessages(imageUri: string, instruction: string) {
  return [
    {
      role: 'user' as const,
      content: [
        {
          type: 'image_url' as const,
          image_url: { url: imageUri },
        },
        {
          type: 'text' as const,
          text: instruction,
        },
      ],
    },
  ];
}

async function askField(
  context: Awaited<ReturnType<typeof loadModel>>,
  label: string,
  instruction: string,
  nPredict = 96,
  imageUri?: string,
): Promise<string> {
  const { text } = await context.completion({
    messages: imageUri
      ? buildMessages(imageUri, instruction)
      : [{ role: 'user' as const, content: [{ type: 'text' as const, text: instruction }] }],
    enable_thinking: false,
    temperature: 0.1,
    n_predict: nPredict,
  });

  console.log(`[LlamaInference] ${label} raw output:`, text);
  return cleanFieldValue(text);
}

async function askValidatedField(
  context: Awaited<ReturnType<typeof loadModel>>,
  label: string,
  instruction: string,
  validate: (value: string) => boolean,
  fallback: string,
  nPredict = 32,
  imageUri?: string,
): Promise<string> {
  const first = await askField(context, label, instruction, nPredict, imageUri);
  if (validate(first)) return first;

  const retry = await askField(
    context,
    `${label}:retry`,
    `${instruction} Return only the answer value, with no explanation and no extra words.`,
    nPredict,
    imageUri,
  );
  return validate(retry) ? retry : fallback;
}

function buildFallback(): Omit<AnimalScanResult, 'id' | 'imageUri' | 'detectedAt' | 'latitude' | 'longitude' | 'favorite' | 'notes'> {
  return {
    animalName: 'Unknown Animal',
    scientificName: 'Species indeterminate',
    description: 'The on-device model could not confidently identify an animal in this image. Try again with better lighting or a closer shot.',
    habitat: 'Unknown',
    diet: 'Unknown',
    behavior: 'Unknown',
    rarity: 'Common',
    confidence: 0.1,
    biome: 'Unknown',
    stats: { power: 10, agility: 10, intelligence: 10, camouflage: 10, friendliness: 10, rarityScore: 5 },
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class LlamaInferenceService implements IInferenceService {
  async analyzeAnimalImage(
    imageUri: string,
  ): Promise<Omit<AnimalScanResult, 'id' | 'imageUri' | 'detectedAt' | 'latitude' | 'longitude' | 'favorite' | 'notes'>> {
    const context = await loadModel();
    const localUri = imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`;
    const animalName = await askField(
      context,
      'animalName',
      'Identify the animal in this image. Return only the common English animal name. If uncertain, return exactly Unknown Animal.',
      32,
      localUri,
    );

    if (!animalName || isUnknownAnimalName(animalName)) {
      console.warn('[LlamaInference] Could not identify animal name.');
      return buildFallback();
    }

    const scientificName = await askField(
      context,
      'scientificName',
      `Return only the scientific binomial name for "${animalName}". Example format: Felis catus. No explanation.`,
      24,
    );

    const description = await askField(
      context,
      'description',
      `Return one short factual sentence describing "${animalName}" as an animal species. No preamble.`,
      48,
    );

    const habitat = await askField(
      context,
      'habitat',
      `Return only the primary habitat of "${animalName}" as a short phrase. Example: Human homes, farms, and urban areas. Do not repeat the animal name. If it is a domestic pet, give the environment where it commonly lives.`,
      32,
    );

    const diet = await askField(
      context,
      'diet',
      `Return only the diet of "${animalName}" as a short phrase beginning with the feeding type. Example: Carnivorous - rodents, birds, insects.`,
      32,
    );

    const behavior = await askField(
      context,
      'behavior',
      `Return one short sentence describing the typical behavior of "${animalName}". No preamble.`,
      40,
    );

    const rarityText = await askValidatedField(
      context,
      'rarity',
      `How rare is "${animalName}" for an average person to encounter?
Common = see daily: dogs, cats, pigeons, sparrows, squirrels, ducks
Uncommon = see occasionally: foxes, deer, rabbits, herons
Rare = requires a specific trip: wolves, eagles, otters, seals
Epic = very few ever see: snow leopard, lynx, wolverine, whale
Legendary = critically rare or endangered: Amur tiger, mountain gorilla
Return exactly one word from: Common, Uncommon, Rare, Epic, Legendary.`,
      (value) => VALID_RARITIES.has(cleanFieldValue(value)),
      'Common',
      12,
    );

    const biomeText = await askValidatedField(
      context,
      'biome',
      `Pick the single best natural habitat for "${animalName}". Match it to one of these:
Forest = tigers, bears, wolves, deer, foxes, owls, boars, badgers
Mountain = mountain goats, snow leopards, eagles, ibex, condors
Grassland = lions, cheetahs, zebras, elephants, bison, meerkats, rhinos
Wetland = ducks, frogs, herons, otters, crocodiles, hippos, beavers
Coastal = seagulls, seals, crabs, penguins, dolphins, sea turtles
Desert = camels, scorpions, rattlesnakes, fennec foxes, meerkats
Urban = pigeons, rats, domestic cats, domestic dogs, raccoons
Unknown = if none of the above fit
Return exactly one word from: Forest, Wetland, Urban, Grassland, Mountain, Coastal, Desert, Unknown.`,
      (value) => VALID_BIOMES.has(cleanFieldValue(value)),
      'Unknown',
      16,
    );

    const confidenceText = await askField(
      context,
      'confidence',
      `How confident are you that the animal identified is "${animalName}"? Return only a single decimal number between 0.10 and 0.99. No explanation.`,
      12,
      localUri,
    );

    const rarity = normalizeRarity(rarityText);
    const biome = normalizeBiome(biomeText, animalName);
    const confidence = normalizeConfidence(confidenceText);

    const result = {
      animalName: safeStr(animalName, 'Unknown Animal'),
      scientificName: safeStr(extractScientificName(scientificName), 'Species unknown'),
      description: safeStr(extractSingleSentence(description), 'No description available.'),
      habitat: safeStr(extractHabitat(habitat, animalName), 'Unknown'),
      diet: safeStr(extractDiet(diet), 'Unknown'),
      behavior: safeStr(extractSingleSentence(behavior), 'Unknown'),
      rarity,
      confidence,
      biome,
      stats: generateStatsFromRarity(rarity),
    };

    console.log('[LlamaInference] Final result payload:', result);
    return result;
  }
}

// ─── Inline stat generator (mirrors utils/statGenerator.ts) ──────────────────

import { AnimalStats } from '@/types';

const RARITY_BASE: Record<RarityTier, AnimalStats> = {
  Common:    { power: 28, agility: 45, intelligence: 40, camouflage: 35, friendliness: 58, rarityScore: 12 },
  Uncommon:  { power: 45, agility: 58, intelligence: 55, camouflage: 52, friendliness: 48, rarityScore: 38 },
  Rare:      { power: 60, agility: 65, intelligence: 65, camouflage: 65, friendliness: 40, rarityScore: 62 },
  Epic:      { power: 76, agility: 80, intelligence: 76, camouflage: 72, friendliness: 28, rarityScore: 80 },
  Legendary: { power: 92, agility: 88, intelligence: 85, camouflage: 80, friendliness: 12, rarityScore: 96 },
};

const RARITY_VAR: Record<RarityTier, number> = {
  Common: 15, Uncommon: 12, Rare: 9, Epic: 6, Legendary: 4,
};

function jitter(base: number, variance: number): number {
  const delta = (Math.random() * 2 - 1) * variance;
  return Math.max(1, Math.min(100, Math.round(base + delta)));
}

function generateStatsFromRarity(rarity: RarityTier): AnimalStats {
  const base = RARITY_BASE[rarity];
  const v    = RARITY_VAR[rarity];
  return {
    power:        jitter(base.power, v),
    agility:      jitter(base.agility, v),
    intelligence: jitter(base.intelligence, v),
    camouflage:   jitter(base.camouflage, v),
    friendliness: jitter(base.friendliness, v),
    rarityScore:  jitter(base.rarityScore, v),
  };
}
