/**
 * MockInferenceService
 *
 * Simulates the output of an on-device VLM (LFM2-VL / llama.cpp) for development and demo.
 *
 * INTEGRATION POINT — llama.cpp / LFM2-VL:
 *   When the native module is ready, replace this class with NativeLlamaInferenceService
 *   which will:
 *     1. Load the LFM2-VL GGUF model from the app bundle or on-device storage.
 *     2. Encode the imageUri to base64 and pass it to the llama_eval() native bridge.
 *     3. Parse the structured JSON output from the model's chat completion response.
 *     4. Return a typed AnimalScanResult payload.
 *
 *   Native bridge stub (future):
 *     import { NativeModules } from 'react-native';
 *     const { LlamaModule } = NativeModules;
 *     const result = await LlamaModule.runVLMInference(imageBase64, systemPrompt);
 */

import { IInferenceService } from './InferenceService';
import { AnimalScanResult } from '@/types';
import { ANIMAL_TEMPLATES } from '@/constants';
import { generateStats, generateConfidence } from '@/utils/statGenerator';

const SIMULATED_LATENCY_MS = { min: 1800, max: 3200 };

function simulateDelay(): Promise<void> {
  const ms =
    SIMULATED_LATENCY_MS.min +
    Math.random() * (SIMULATED_LATENCY_MS.max - SIMULATED_LATENCY_MS.min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockInferenceService implements IInferenceService {
  async analyzeAnimalImage(
    _imageUri: string
  ): Promise<Omit<AnimalScanResult, 'id' | 'imageUri' | 'detectedAt' | 'latitude' | 'longitude' | 'favorite' | 'notes'>> {
    // Simulate on-device inference latency
    await simulateDelay();

    // Pick a random animal template
    const template = ANIMAL_TEMPLATES[Math.floor(Math.random() * ANIMAL_TEMPLATES.length)];

    return {
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
    };
  }
}
