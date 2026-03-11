# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Start Expo dev server (choose platform in terminal)
npx expo start

# Run on specific platform
npx expo start --ios
npx expo start --android

# Run lint
npx expo lint

# Clear Metro cache if you hit weird bundler issues
npx expo start --clear
```

## Architecture

**PocketDex AI** — a React Native / Expo app where users point their camera at animals, an on-device VLM identifies them, and the results are saved as collectible game entries.

### Navigation

Expo Router with two route groups:

- `app/(tabs)/` — five tab screens: `index` (home), `scan` (camera), `pokedex` (collection), `explore` (biomes), `profile`
- `app/animal/[id].tsx` — full detail page, pushed as a stack screen
- `app/discovery/[id].tsx` — post-scan result modal (slide-from-bottom)

### State

- **Zustand** (`store/discoveryStore.ts`, `store/profileStore.ts`) — primary in-memory state
- **SQLite** (`db/`) — persistent discovery storage via `expo-sqlite` async API
- **AsyncStorage** — profile / achievement persistence
- Discoveries are loaded from SQLite into Zustand on app launch

### Inference abstraction

`services/inference/InferenceService.ts` defines `IInferenceService` with a single method:

```ts
analyzeAnimalImage(imageUri: string): Promise<Omit<AnimalScanResult, ...>>
```

`MockInferenceService` implements it with randomised animal templates and simulated latency. The active instance is exported from `services/inference/index.ts`. The app currently uses `LlamaInferenceService` for real on-device inference.

### Key data flow

1. `scan.tsx` → captures photo via `CameraView`
2. `useScan` hook → calls `inferenceService.analyzeAnimalImage()`, fetches GPS, assembles `AnimalScanResult`
3. `useScan.saveDiscovery()` → writes to SQLite + Zustand, checks achievements
4. Navigation pushes to `animal/[id]`

### Folder reference

| Path | Purpose |
| --- | --- |
| `types/` | Domain types (`AnimalScanResult`, `Achievement`, `RarityTier`, `Biome`) |
| `theme/` | `Colors`, `Typography`, `Spacing`, `Radius`, `Shadow` |
| `constants/animals.ts` | 20 animal templates with base stats |
| `constants/achievements.ts` | 12 achievement definitions |
| `constants/biomes.ts` | 6 biome configs with color, icon, tip |
| `utils/statGenerator.ts` | `generateStats()`, `generateConfidence()`, `statColor()`, `statLabel()` |
| `utils/achievementEngine.ts` | `checkForNewAchievements()`, `rarestDiscovery()`, `completionPercentage()` |
| `utils/seedData.ts` | Seeds 6 demo discoveries on first launch |
| `db/database.ts` | Opens SQLite and runs migrations |
| `db/discoveryRepository.ts` | CRUD for discoveries table |
| `hooks/useDiscoveries.ts` | `useDiscoveries`, `useFilteredDiscoveries`, `useBiomeCounts`, `useDiscoveryById`, `useProfile` |
| `hooks/useScan.ts` | Full scan lifecycle hook |
| `components/ui/` | `StatBar`, `AnimalCard`, `RarityBadge`, `AchievementBadge`, `ScanOverlay`, `EmptyState`, `SectionHeader` |
| `components/common/` | `GradientCard`, `LoadingSpinner`, `ScreenHeader` |

### Rarity tiers

`Common` → `Uncommon` → `Rare` → `Epic` → `Legendary`

Colors are defined in `theme/colors.ts` under `Colors.rarity` and `Colors.rarityGlow`.

## Running the app

This is now a **bare React Native** project (generated via `expo prebuild`).

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

On first launch the app shows a model setup screen that downloads the configured GGUF files for `LiquidAI/LFM2-VL-450M-GGUF` (~483 MB total) from HuggingFace to the device's document directory. After that the app works fully offline.

## On-device inference stack

- `llama.rn` — React Native wrapper for llama.cpp
- Model: **LiquidAI/LFM2-VL-450M-GGUF**
- Files: `LFM2-VL-450M-Q8_0.gguf` + `mmproj-LFM2-VL-450M-Q8_0.gguf` stored in `FileSystem.documentDirectory`
- Metal GPU acceleration available on iOS (set `N_GPU_LAYERS > 0` in `constants/models.ts`)

## Notes for LFM2-VL

1. The mobile app now points at `LiquidAI/LFM2-VL-450M-GGUF` in `constants/models.ts`
2. If the model prefers a different prompt format, adjust the system prompt in `services/inference/LlamaInferenceService.ts`
3. For better iOS performance, increase `N_GPU_LAYERS` after device testing

## Assets

Place `icon.png`, `splash-icon.png`, `adaptive-icon.png`, and `favicon.png` in `assets/`. Expo requires these for builds. A 1024×1024 PNG works for all sizes.
