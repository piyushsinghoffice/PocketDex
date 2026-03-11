/**
 * On-device VLM model configuration.
 *
 * Current model: LiquidAI LFM2-VL-450M
 *   — 450M parameter vision-language model with GGUF weights published for llama.cpp.
 *   — Using Q8_0 main weights + Q8_0 multimodal projector.
 *   — Approximate download: 379 MB model + 104 MB mmproj = ~483 MB total.
 */

export const MODEL_CONFIG = {
  /** Display name shown in the UI */
  name: 'LFM2-VL-450M',

  /** HuggingFace model card */
  homepage: 'https://huggingface.co/LiquidAI/LFM2-VL-450M-GGUF',

  /** Main language model — Q8_0 quantised, 379 MB */
  MODEL_URL:
    'https://huggingface.co/LiquidAI/LFM2-VL-450M-GGUF/resolve/main/LFM2-VL-450M-Q8_0.gguf',

  /** Multimodal projector — Q8_0, 104 MB */
  MMPROJ_URL:
    'https://huggingface.co/LiquidAI/LFM2-VL-450M-GGUF/resolve/main/mmproj-LFM2-VL-450M-Q8_0.gguf',

  /** Approximate download sizes shown to user */
  MODEL_SIZE_MB: 379,
  MMPROJ_SIZE_MB: 104,

  /** Local filenames used in device storage */
  MODEL_FILENAME: 'lfm2-vl-450m-q8_0.gguf',
  MMPROJ_FILENAME: 'mmproj-lfm2-vl-450m-q8_0.gguf',

  /** Context window (tokens) */
  N_CTX: 2048,

  /**
   * Metal GPU layers (iOS).
   * 0 = CPU only; increase for faster inference on iPhone 14+.
   */
  N_GPU_LAYERS: 0,

  /** Max tokens to generate per inference */
  MAX_NEW_TOKENS: 512,
} as const;
