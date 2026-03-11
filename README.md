# PocketDex AI

A Pokédex for the real world. Point your camera at any animal and the app identifies it on-device using a small vision-language model — no internet required after first setup.

Built by **Piyush Singh**.

---

## Features

- **On-device AI** — Moondream2 (1.86B VLM) runs entirely on the device via `llama.rn`. Your images never leave your phone.
- **Animal identification** — common name, scientific name, habitat, diet, behaviour, rarity tier, and biome.
- **Collectible Pokédex** — every scan is saved as a card with RPG-style stats that scale with rarity.
- **7 biomes** — Forest, Grassland, Wetland, Coastal, Mountain, Desert, Urban — browse your collection by habitat.
- **Achievements** — 12 unlockable badges for milestones like first scan, filling a biome, and finding Legendary animals.
- **Pinch-to-zoom & tap-to-focus** — full camera controls on the scan screen.
- **Fully offline** — SQLite for persistence, AsyncStorage for profile data, no backend.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | React Native 0.81 + Expo SDK 54 (bare workflow) |
| Navigation | Expo Router (file-based) |
| Inference | `llama.rn` (llama.cpp React Native wrapper) |
| Model | Moondream2 Q4 GGUF (~1.4 GB, downloaded on first launch) |
| State | Zustand |
| Persistence | expo-sqlite (discoveries), AsyncStorage (profile) |
| UI | expo-linear-gradient, react-native-reanimated, react-native-gesture-handler |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Android Studio with Android SDK (for Android builds)
- Xcode 15+ (for iOS builds, macOS only)

### Install

```bash
git clone https://github.com/your-username/pocketdex-ai.git
cd pocketdex-ai
npm install
```

### Run (dev)

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

On first launch the app downloads the Moondream2 GGUF weights (~1.4 GB) from HuggingFace. After that it works fully offline.

### Lint

```bash
npx expo lint
```

---

## Building a Release APK

### Local

```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Via GitHub Actions

Push a release tag to trigger the automated build:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Then go to **GitHub → Releases → Draft a new release**, select the tag, and publish it. The workflow builds the APK and attaches it to the release automatically.

> For Play Store distribution, generate a proper release keystore and add the secrets described in `.github/workflows/release.yml`.

---

## Project Structure

```text
app/
  (tabs)/         # Tab screens: home, scan, pokedex, explore, profile
  animal/[id].tsx # Full detail page
  discovery/[id]  # Post-scan result modal
services/
  inference/      # IInferenceService + LlamaInferenceService
  model/          # Model download + llama.rn context management
store/            # Zustand stores (discoveries, profile, model)
db/               # SQLite schema + CRUD
constants/        # Animal templates, achievements, biomes, model config
utils/            # Stat generator, achievement engine, rarity helpers
theme/            # Colors, Typography, Spacing, Radius, Shadow
```

---

## Architecture Notes

- **Inference is behind an interface** (`IInferenceService`) — swap the model by changing `services/inference/index.ts`.
- **Field-by-field prompting** — the VLM is called once per field (name, description, habitat, etc.) rather than asking for a JSON blob. Small models truncate long structured outputs.
- **Post-processing safety net** — a `NEVER_URBAN` lookup table overrides clearly wrong biome classifications from the model.

---

## License

MIT © Piyush Singh
