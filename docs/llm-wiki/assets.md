# Asset Direction

This page records the working direction for visual assets in Gate of Molta.

## Current Principle

Final app assets should be newly created original replacement assets.

The TTS images and card crops under `docs/llm-sources/` are reference/source material only. They may be studied for composition, readable information hierarchy, card proportions, icon placement, and general medieval-fantasy mood, but they should not be copied, traced, recolored, or shipped as final game assets unless rights are confirmed.

## Reference Subsets

The TTS pearl-card subset lives in `docs/llm-sources/2026-05-23-tts-pearl-card-crops/`.

- It contains 11 visible pearl-card crop variants from the Steam/TTS source: values 1-8 plus character-refresh variants for 3, 4, and 5.
- Filenames are value-based for inspection, but the manifest keeps the original sheet and row/column source mapping.
- A sharpened 2x derivative set lives in `docs/llm-sources/2026-05-23-tts-pearl-card-crops/enhanced/` for readability checks.
- Image-to-image restoration prompts live in `docs/llm-sources/2026-05-23-tts-pearl-card-crops/imagegen-prompts/`; they emphasize high input fidelity, low creativity, exact numeral preservation, and restoration instead of redesign.
- These remain reference-only source crops and should not be used as final runtime art without rights confirmation.

## Card Art Direction

The refreshed card images should feel medieval and ceremonial without matching the source art too closely.

Useful cues:

- illuminated manuscript framing
- carved stone, brass, pearl, glass, and parchment materials
- symbolic character or object illustrations rather than exact redraws
- clear top number/cost area
- stable lower reward/effect area
- strong silhouettes that remain readable at small card size

Avoid:

- copying card-specific compositions from reference crops
- reusing source borders, ornaments, icons, or illustration shapes directly
- making every card visually busy at the expense of gameplay readability
- producing all cards before one pilot card is tested in the UI

## Recommended Pipeline

1. Define one card template with stable zones for cost, illustration, effect, reward, and frame.
2. Create a small style pilot: one character card, one card back, one pearl/reward icon, and one board-adjacent element.
3. Test the pilot in a browser card component at normal, hovered, and enlarged sizes.
4. Lock the card dimensions, safe text areas, and naming conventions.
5. Generate or draw the remaining card illustrations using the same prompt and layout grammar.
6. Optimize runtime assets separately from source-quality working files.

## Runtime Asset Shape

Runtime images should be local, optimized, and referenced through manifests.

## Current Prototype Runtime Wiring

The current browser prototype uses local image files under `src/assets/cards/`:

- `src/assets/cards/pearls/` contains temporary pearl-card PNGs copied from the generated ImageGen pearl restoration batch so the UI can render value-specific pearl art immediately.
- `src/assets/cards/characters/` contains temporary character-card PNGs copied from generated named-card outputs for the 54 current candidate fixture definitions, plus `placeholder-character.webp` as fallback.
- `src/app/App.tsx` imports these through Vite URL handling and maps pearl definitions by value.
- The active fixture character definitions reference candidate metadata from `docs/llm-sources/2026-05-23-tts-character-verification.json` for condition, power, diamond reward, and effect notes.

This is a prototype wiring step requested during UI iteration. The pearl and character files still inherit the source-status cautions from the generated reference derivatives and should be replaced or re-approved before production release.

## Generated ImageGen Reference Restorations

The generated ImageGen restoration batch lives in `docs/llm-sources/2026-05-23-tts-card-crops/generated-imagegen/`.

- `cards/` preserves source-position filenames for traceability back to the crop manifest.
- `named-cards/` contains human-readable copies for review and asset planning.
- Character named files use candidate metadata: `character-<candidate-id>-<condition>-p<power>-d<diamonds>.png`.
- Pearl named files use value names: `pearl-<value>.png` and `pearl-<value>-refresh.png`.
- `named-review.html` lists every named output with source crop and candidate metadata.
- `manifest.json` records source filenames, generated filenames, named filenames, hashes, pearl values, candidate character metadata, and duplicate relationships.

These are still generated derivatives of TTS source crops. They are useful for readability review and prompt iteration, but they are not cleared runtime assets.

## Generated Replacement Batch

The first separated replacement batch lives in `assets/cards/original-webp/`.

- `scripts/generate-original-card-webp.mjs` generates the batch from crop positions and verification-only metadata.
- The batch contains 67 individual WebP card images at 1024x1592.
- The output filenames preserve the separated crop basenames so each replacement can be mapped back to the reference crop.
- `assets/cards/original-webp/manifest.json` records source crop mapping, candidate card IDs, candidate activation requirements, power, and diamond values when available.
- `assets/cards/original-webp/review.html` is a local browser review page for scanning the generated assets.
- `assets/cards/original-webp/contact-sheet.webp` is an overview image for quick visual inspection.

The generated cards are original symbolic replacements, not upscaled source crops. Candidate card metadata remains unverified, so these assets should be treated as a first visual batch rather than final canonical card data.

Recommended card asset fields:

```ts
type CardAsset = {
  cardId: string;
  front: string;
  back?: string;
  illustration?: string;
  thumbnail?: string;
  frameVariant?: string;
  sourceStatus: "original" | "placeholder" | "reference-only";
};
```

Recommended folders after the frontend app exists:

```text
src/assets/cards/
src/assets/card-backs/
src/assets/icons/
src/assets/boards/
src/assets/fx/
```

Large working files, prompt notes, and non-runtime drafts should stay outside optimized runtime folders.

## Animation Boundary

Animation production is paused for now.

When animation resumes, prefer code-based motion for cards moving, flipping, lifting, and shaking. Use sprite sheets or animated WebP only for short visual effects such as glow, reward shine, water shimmer, or impact bursts.
