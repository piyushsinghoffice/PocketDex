import { AnimalScanResult } from '@/types';

/**
 * Contract for the animal identification inference layer.
 *
 * Current implementation: LlamaInferenceService (on-device GGUF via llama.rn).
 * Wrapped by HybridInferenceService which handles fallback on parse failure.
 */
export interface IInferenceService {
  /**
   * Analyse an image URI and return a structured animal identification result.
   *
   * @param imageUri - Local file URI from Expo Camera capture
   * @returns Partial result without id, imageUri, detectedAt, location, favorite, notes
   */
  analyzeAnimalImage(imageUri: string): Promise<Omit<AnimalScanResult, 'id' | 'imageUri' | 'detectedAt' | 'latitude' | 'longitude' | 'favorite' | 'notes'>>;
}
