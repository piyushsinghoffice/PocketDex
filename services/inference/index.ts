/**
 * Active inference service.
 *
 * Uses on-device llama.rn GGUF inference.
 * If inference fails or returns unusable output, fall back to a conservative
 * "Unknown Animal" payload instead of inventing a random species.
 */
import { LlamaInferenceService } from './LlamaInferenceService';
import { AnimalScanResult } from '@/types';

class HybridInferenceService {
  private readonly llama = new LlamaInferenceService();

  async analyzeAnimalImage(
    imageUri: string,
  ): Promise<Omit<AnimalScanResult, 'id' | 'imageUri' | 'detectedAt' | 'latitude' | 'longitude' | 'favorite' | 'notes'>> {
    try {
      const result = await this.llama.analyzeAnimalImage(imageUri);
      const looksBroken =
        !result.animalName ||
        result.animalName === 'Unknown Animal' ||
        !result.stats;

      if (!looksBroken) {
        return result;
      }
    } catch (error) {
      console.warn('[Inference] llama.rn inference failed, using conservative fallback:', error);
    }

    return {
      animalName: 'Unknown Animal',
      scientificName: 'Species indeterminate',
      description: 'The on-device model could not confidently identify this animal yet.',
      habitat: 'Unknown',
      diet: 'Unknown',
      behavior: 'Unknown',
      rarity: 'Common',
      confidence: 0.1,
      biome: 'Unknown',
      stats: {
        power: 10,
        agility: 10,
        intelligence: 10,
        camouflage: 10,
        friendliness: 10,
        rarityScore: 5,
      },
    };
  }
}

export const inferenceService = new HybridInferenceService();
export type { IInferenceService } from './InferenceService';
