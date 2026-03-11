/**
 * ModelManager
 *
 * Responsible for:
 *  1. Downloading the GGUF model files to the device's document directory
 *  2. Verifying they exist on subsequent launches
 *  3. Initialising the llama.rn context (loads model into memory)
 *  4. Providing the ready context to the inference service
 */
import * as FileSystem from 'expo-file-system/legacy';
import { NativeModules, TurboModuleRegistry } from 'react-native';
import { initLlama, type LlamaContext } from 'llama.rn';
import { MODEL_CONFIG } from '@/constants/models';

const DOCS_DIR = FileSystem.documentDirectory ?? '';

export const MODEL_PATH   = `${DOCS_DIR}${MODEL_CONFIG.MODEL_FILENAME}`;
export const MMPROJ_PATH  = `${DOCS_DIR}${MODEL_CONFIG.MMPROJ_FILENAME}`;

export type DownloadProgressCallback = (
  file: 'model' | 'mmproj',
  progress: number   // 0–1
) => void;

// Singleton llama context — loaded once, reused across scans
let _context: LlamaContext | null = null;

function ensureLlamaNativeModule(): void {
  const turboModule = TurboModuleRegistry.get?.('RNLlama');
  const legacyModule = (NativeModules as Record<string, unknown>).RNLlama;

  if (turboModule || legacyModule) return;

  throw new Error(
    'llama.rn native module is not available in this app binary. Rebuild the iOS/Android app with native dependencies included; Expo Go will not load llama.rn.',
  );
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Download a file with per-chunk progress reporting.
 * Skips download if the file already exists at the destination path.
 */
async function downloadFile(
  url: string,
  destination: string,
  onProgress: (progress: number) => void,
): Promise<void> {
  if (await fileExists(destination)) {
    onProgress(1);
    return;
  }

  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    destination,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      if (totalBytesExpectedToWrite > 0) {
        onProgress(totalBytesWritten / totalBytesExpectedToWrite);
      }
    },
  );

  const result = await downloadResumable.downloadAsync();
  if (!result || result.status !== 200) {
    // Clean up partial file on failure
    await FileSystem.deleteAsync(destination, { idempotent: true });
    throw new Error(`Download failed with status ${result?.status}`);
  }
  onProgress(1);
}

/**
 * Ensures both GGUF files are present on device.
 * Downloads them if not.
 */
export async function ensureModelDownloaded(
  onProgress?: DownloadProgressCallback,
): Promise<void> {
  await downloadFile(
    MODEL_CONFIG.MODEL_URL,
    MODEL_PATH,
    (p) => onProgress?.('model', p),
  );
  await downloadFile(
    MODEL_CONFIG.MMPROJ_URL,
    MMPROJ_PATH,
    (p) => onProgress?.('mmproj', p),
  );
}

/** Returns true if both GGUF files are already on-device. */
export async function isModelDownloaded(): Promise<boolean> {
  return (await fileExists(MODEL_PATH)) && (await fileExists(MMPROJ_PATH));
}

/**
 * Load the model into memory via llama.rn.
 * Safe to call multiple times — returns the cached context if already loaded.
 */
export async function loadModel(): Promise<LlamaContext> {
  if (_context) return _context;

  ensureLlamaNativeModule();

  const context = await initLlama({
    model: MODEL_PATH,
    use_mlock: false,
    n_ctx: MODEL_CONFIG.N_CTX,
    ctx_shift: false,
    n_gpu_layers: MODEL_CONFIG.N_GPU_LAYERS, // Metal on iOS
  });

  const multimodalReady = await context.initMultimodal({
    path: MMPROJ_PATH,
    use_gpu: MODEL_CONFIG.N_GPU_LAYERS > 0,
  });
  if (!multimodalReady) {
    await context.release();
    throw new Error('Failed to initialize multimodal projector');
  }

  _context = context;

  return _context;
}

/** Release model from memory (call when app goes to background). */
export async function releaseModel(): Promise<void> {
  if (_context) {
    await _context.release();
    _context = null;
  }
}

export function getLoadedContext(): LlamaContext | null {
  return _context;
}
