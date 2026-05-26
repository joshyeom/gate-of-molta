# LLM Wiki Log

Chronological operation log for the Gate of Molta LLM Wiki.

Use headings in this format:

```md
## [YYYY-MM-DD] type | Title
```

## [2026-05-22] session | Repository initialized as LLM-maintained project

The repository started empty except for `.git`. The user established that future LLM sessions should record the project journey and maintain durable docs such as `README.md`, `CLAUDE.md`, and an LLM wiki.

Files touched:

- `README.md`
- `CLAUDE.md`
- `AGENTS.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/session-log.md`

Follow-up:

- Keep project memory updated as the frontend app is scaffolded.

## [2026-05-22] decision | Gate of Molta product direction captured

The user defined the project as a frontend-only solo web adaptation of the board game "몰타의 관문", with no backend or database in the first version and a high-polish animated presentation inspired by Hearthstone.

Files touched:

- `README.md`
- `CLAUDE.md`
- `docs/llm-wiki/architecture.md`
- `docs/llm-wiki/decisions.md`
- `docs/llm-wiki/rules.md`

Follow-up:

- Capture the exact rulebook, card list, board layout, and solo rules before implementing gameplay.

## [2026-05-22] ingest | LLM Wiki pattern source

The user provided an LLM Wiki idea file. It was preserved as a raw source and adapted into the project schema.

Files touched:

- `docs/llm-sources/2026-05-22-llm-wiki-pattern.md`
- `docs/llm-wiki/schema.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/workflows.md`
- `docs/llm-wiki/prompt-context.md`
- `docs/llm-wiki/log.md`

Follow-up:

- Use `index.md` as the content catalog and `log.md` as the parseable chronological operation log.

## [2026-05-23] implementation | Register Claude /commit as global Codex skill

The existing Claude slash command at `/Users/yeomjeongho/.claude/commands/commit.md` was adapted into a Codex-compatible global skill named `commit`.

Files touched:

- `/Users/yeomjeongho/.agents/skills/commit/SKILL.md`
- `/Users/yeomjeongho/.agents/skills/commit/skill.yaml`
- `docs/llm-wiki/prompt-context.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`

Follow-up:

- In a new Codex session, confirm that `commit` appears in the available skills list.

## [2026-05-23] decision | Commit baseline and start roadmap/MVP planning

The user asked to commit all current work and continue to the next task. The initial documentation baseline was committed, then roadmap and MVP planning documents were added.

Files touched:

- `docs/llm-wiki/roadmap.md`
- `docs/llm-wiki/mvp.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/decisions.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/prompt-context.md`
- `docs/llm-wiki/session-log.md`

Follow-up:

- Capture the actual board-game rules before scaffolding gameplay.

## [2026-05-23] ingest | Gate of Molta rule explanation links

The user provided two rule explanation links. The WING Board Game article was accessible and used to partially capture implementation-oriented rules. The BoardLife link was blocked by a Cloudflare challenge and could not be used yet.

Files touched:

- `docs/llm-sources/2026-05-23-gate-of-molta-rule-links.md`
- `docs/llm-wiki/rules.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/decisions.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/prompt-context.md`
- `docs/llm-wiki/session-log.md`

Follow-up:

- Capture card-level data and solo/automa rules before implementing gameplay.

## [2026-05-23] ingest | Korea Boardgames YouTube rule confirmation

The user provided a Korea Boardgames YouTube introduction video. Metadata, auto-captions, and selected frame review were used to confirm the existing rule capture and add pearl-card distribution.

Files touched:

- `docs/llm-sources/2026-05-23-gate-of-molta-rule-links.md`
- `docs/llm-wiki/rules.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/prompt-context.md`
- `docs/llm-wiki/session-log.md`

Follow-up:

- Obtain card-level source material for character requirements and abilities.

## [2026-05-23] ingest | TTS character metadata verification checklist

The user approved using online TTS data only for rule/effect verification. A sanitizer script extracts 54 character-card text metadata entries from the Korean TTS workshop save without storing card images, image URLs, or the raw save binary.

Files touched:

- `scripts/extract-tts-character-verification.mjs`
- `docs/llm-sources/2026-05-23-tts-character-verification-source.md`
- `docs/llm-sources/2026-05-23-tts-character-verification.json`
- `docs/llm-wiki/rules.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/decisions.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Follow-up:

- Verify each candidate entry against official card photos, a rulebook, or user-provided scans before implementation.

## [2026-05-23] ingest | TTS reference image assets

The user asked to bring in image assets as reference material for creating new assets. A downloader script fetched unique image references from the same Korean TTS workshop save into `docs/llm-sources/`, with a manifest and README marking them as source/reference material only.

Files touched:

- `scripts/download-tts-reference-assets.mjs`
- `docs/llm-sources/2026-05-23-tts-reference-assets/`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/decisions.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Follow-up:

- Use these images for layout/iconography study and create new original app assets separately.

## [2026-05-23] ingest | Split TTS card sheets into individual references

The user asked to split the face sheets into individual card files. A script split 8 face sheets into 67 individual card crops: seven 3x3 sheets and one 2x2 sheet.

Files touched:

- `scripts/split-tts-card-sheets.mjs`
- `docs/llm-sources/2026-05-23-tts-card-crops/`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Follow-up:

- Use the individual crops for visual analysis and replacement-asset planning only.

## [2026-05-23] implementation | Add rewards and grouping to card review HTML

The review HTML now displays candidate point and diamond rewards and sorts cards so matching cost/effect/reward candidates appear next to each other. The candidate reward values remain image-derived and verification-only.

Files touched:

- `scripts/extract-tts-character-verification.mjs`
- `scripts/build-character-review-html.mjs`
- `docs/llm-sources/2026-05-23-tts-character-verification.json`
- `docs/llm-sources/2026-05-23-tts-card-crops/review.html`
- `docs/llm-sources/2026-05-23-tts-card-crops/README.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Follow-up:

- Let the user verify grouped duplicates and reward values in the browser review page.

## [2026-05-23] decision | Original replacement card-art direction

The user paused animation planning and clarified that each card image should be newly generated or drawn in a renewed medieval style, using reference images only for study and copyright-safe replacement planning.

Files touched:

- `docs/llm-wiki/assets.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/decisions.md`
- `docs/llm-wiki/architecture.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Follow-up:

- Define a one-card visual pilot before producing the full card set.

## [2026-05-23] implementation | Generate separated original WebP card replacements

The user clarified that the separated card crops should be replaced with newly created assets, not upscaled. A deterministic generator produced 67 original symbolic WebP card images at 1024x1592 while preserving crop-based filenames and source mapping.

Files touched:

- `scripts/generate-original-card-webp.mjs`
- `assets/cards/original-webp/`
- `docs/llm-wiki/assets.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Follow-up:

- Review the batch visually and decide whether to keep this symbolic style or replace it with richer illustrated card art.

## [2026-05-23] ingest | Extract TTS pearl card reference subset

The user asked to bring in the pearl cards from the Steam/TTS source material. A reproducible extractor cropped the 11 visible pearl-card variants directly from the Steam/TTS source card sheets into a dedicated reference-only source folder with value-based filenames, metadata, a review page, and a contact sheet.

Files touched:

- `scripts/extract-tts-pearl-card-crops.mjs`
- `docs/llm-sources/2026-05-23-tts-pearl-card-crops/`
- `docs/llm-wiki/assets.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Follow-up:

- Use the pearl crops only for verification and replacement-asset planning unless rights are confirmed.

## [2026-05-23] implementation | Enhance pearl reference crop readability

The user asked to keep the same pearl-card images but improve the blurry quality. A reproducible enhancement script created 2x sharpened JPEG derivatives of the 11 pearl-card crops while preserving the original raw crops unchanged.

Files touched:

- `scripts/enhance-tts-pearl-card-crops.mjs`
- `scripts/extract-tts-pearl-card-crops.mjs`
- `docs/llm-sources/2026-05-23-tts-pearl-card-crops/enhanced/`
- `docs/llm-wiki/assets.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Follow-up:

- Treat enhanced files as readability/reference derivatives, not final runtime art unless rights are confirmed.

## [2026-05-23] implementation | Add pearl image-generation restoration prompts

The user clarified that the quality-improved pearl cards should be produced with an image generation model, using careful prompts to keep the original image identity while improving quality. A script now generates per-card image-to-image restoration prompts that lock the card value, corner numerals, inverted bottom numerals, medallion color, frame, and refresh icons.

Files touched:

- `scripts/build-pearl-imagegen-prompts.mjs`
- `docs/llm-sources/2026-05-23-tts-pearl-card-crops/imagegen-prompts/`
- `docs/llm-sources/2026-05-23-tts-pearl-card-crops/README.md`
- `docs/llm-wiki/assets.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Follow-up:

- Use the generated prompts with an image-to-image model, one source crop at a time, and verify numerals/icons manually after generation.

## [2026-05-23] implementation | Generate pearl 1 restoration trial

The user asked to try only pearl card 1 first. A single generated image-to-image restoration trial was produced from `pearl-1.jpg` and saved under the pearl-card source folder with a manifest.

Files touched:

- `docs/llm-sources/2026-05-23-tts-pearl-card-crops/generated-imagegen/`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Follow-up:

- Review the generated card manually before applying the same approach to the remaining pearl cards.

## [2026-05-23] decision | Workstream implementation plan

The user asked to proceed with game implementation planning after roles were set. A dedicated implementation plan now maps the MVP and roadmap into workstreams, milestones, guardrails, first sprint tasks, and rule blockers.

Files touched:

- `docs/llm-wiki/implementation-plan.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/roadmap.md`
- `docs/llm-wiki/mvp.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Follow-up:

- Start the Vite/React/TypeScript scaffold with fixture-only gameplay data, or first resolve the solo model/card verification blockers.

## [2026-05-23] decision | Solo AI difficulty model

The user asked to support 2-5 total participants and configurable AI difficulty. A new solo-mode plan defines one human plus AI seats for the first release and separates Easy, Normal, Hard, and Expert by planning depth, heuristics, blocking behavior, and probabilistic evaluation.

Files touched:

- `docs/llm-wiki/solo-mode.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/rules.md`
- `docs/llm-wiki/implementation-plan.md`
- `docs/llm-wiki/decisions.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Follow-up:

- Implement Easy and Normal first, then tune Hard/Expert after verified card effects and performance fixtures exist.

## [2026-05-23] decision | Engine model draft

The user approved continuing to the next planning step. A new engine model draft defines setup options, content status, card definitions versus instances, player state, shared zones, turn/endgame state, public actions, payment plans, events, selectors, validation rules, and the first implementation slice.

Files touched:

- `docs/llm-wiki/engine-model.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/implementation-plan.md`
- `docs/llm-wiki/architecture.md`
- `docs/llm-wiki/decisions.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Follow-up:

- Scaffold the frontend project and implement the engine type shells against the draft model.

## [2026-05-23] implementation | Vite app and first engine slice

The user approved moving from planning into implementation. A Vite React TypeScript app now exists with a fixture-only deterministic engine slice, setup options for 2-5 total participants, placeholder content, basic reducer actions, selectors, tests, and a minimal board UI.

Files touched:

- `package.json`
- `package-lock.json`
- `index.html`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `.gitignore`
- `src/`
- `docs/llm-wiki/roadmap.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Verification:

- `npm test`
- `npm run build`
- `npm run dev -- --host 127.0.0.1`
- `curl -I http://127.0.0.1:5173/`

Follow-up:

- Implement activation/payment rules once card requirements are verified enough for focused tests.

## [2026-05-23] implementation | Card-table UI and automatic AI turns

The user requested a more urgent UI shift toward a card-game board: opening/settings screens, Korean text, visible own cards only, hidden opponent cards, gate fields with framed cards, direct card clicking, automatic turn progression, and AI turns with a 5-second delay.

Files touched:

- `index.html`
- `src/app/App.tsx`
- `src/app/App.css`
- `src/game/content/characters.fixture.ts`
- `src/game/engine/selectors.ts`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Verification:

- `npm test`
- `npm run build`
- `curl -I http://127.0.0.1:5173/`

Follow-up:

- Add payment/activation UI and card-detail overlays after the card data and requirements are stable enough to model.

## [2026-05-23] implementation | Starting hand, discard flow, and table seating UI

The user reviewed the card-table screen and requested immediate gameplay/UI corrections: start with 5 cards, require discarding down to 5 at turn end, keep gate cards visible, remove the bottom turn/settings bar, strengthen card pick/replacement interactions, use `점수` instead of `힘`, keep 2 open character cards available, and arrange AI seats around the table.

Files touched:

- `src/app/App.tsx`
- `src/app/App.css`
- `src/game/engine/state.ts`
- `src/game/engine/selectors.ts`
- `src/game/engine/engine.test.ts`
- `docs/llm-wiki/decisions.md`
- `docs/llm-wiki/rules.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Verification:

- `npm test`
- `npm run build`
- `curl -I http://127.0.0.1:5173/`

Follow-up:

- Add activation/payment flow and real card-detail overlays once character requirements/effects are stable enough to model.

## [2026-05-23] implementation | Opponent gate visibility and compact table header

The user reviewed the table layout and requested clearer opponent gate cards plus removal of the oversized central turn banner. The game screen now removes the large `AI/나의 차례` header and shows opponent gate cards as larger face-down gate frames inside each opponent seat.

Files touched:

- `src/app/App.tsx`
- `src/app/App.css`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Verification:

- `npm test`
- `npm run build`
- `curl -I http://127.0.0.1:5173/`

Follow-up:

- Add a smaller active-turn indicator if future playtesting needs it, preferably on the active seat rather than as a large central banner.

## [2026-05-24] implementation | Card-game UI readability pass

The user asked to fix the implemented UI after a comparison against other online card games. The game screen now has a compact state HUD, score comparison strip, latest-message panel, clearer active-seat badges, explicit market action labels, rectangular deck/action controls, stronger card action chips, and less prominent empty/opponent slots.

Files touched:

- `src/app/App.tsx`
- `src/app/App.css`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Verification:

- `npm test`
- `npm run build`
- `npm run dev -- --host 127.0.0.1`
- `curl -I http://127.0.0.1:5174/`

Follow-up:

- Add card-detail overlays and activation/payment UI once verified card requirements are available.

## [2026-05-24] implementation | Arena-style card game presentation

The user clarified that the desired feel is closer to a Hearthstone-style arena board. The game screen was reorganized around an illustrated arena shell with opponent command at the top, shared battlefield in the center, local hero and fanned hand at the bottom, a right-side action/resource rail, stronger green card selection glow, and reduced dashboard-panel styling.

Files touched:

- `src/app/App.tsx`
- `src/app/App.css`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Verification:

- `npm test`
- `npm run build`
- `curl -I http://127.0.0.1:5174/`

Follow-up:

- Continue replacing placeholder CSS card art with original illustrated assets and add card-detail/payment overlays.

## [2026-05-24] implementation | Fix arena breakpoint overlap

The first arena pass stacked the action rail at desktop-like sizes because the responsive breakpoint was too broad. The arena now keeps the two-column battlefield/action-rail layout until narrow mobile widths, clamps card and hero sizes, and keeps the desktop arena inside the viewport.

Files touched:

- `src/app/App.css`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Verification:

- `npm test`
- `npm run build`
- `curl -I http://127.0.0.1:5174/`

Follow-up:

- Verify with a browser screenshot when a screenshot tool is available in the environment.

## [2026-05-24] implementation | Convert arena to fixed stage layout

The breakpoint fix still produced overlap in the user's viewport. The arena CSS now uses a fixed-fit 16:9 stage with absolute positioning for opponent command, battlefield, player command, action rail, and message panel. This removes the prior stacking layout from desktop/tablet widths and keeps major zones from overlapping.

Files touched:

- `src/app/App.css`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Verification:

- `npm test`
- `npm run build`
- `curl -I http://127.0.0.1:5174/`

Follow-up:

- Add browser screenshot verification tooling before future large visual layout changes.

## [2026-05-24] implementation | Browser-verified arena and runtime card art

The user asked to stop guessing and verify in-browser while using the available image assets. Playwright was added for local browser screenshots, the leftover `game-screen` grid template causing left-shift was identified from computed bounding boxes and reset, generated pearl/card images were copied into `src/assets/cards/`, and card rendering now uses Vite-resolved image URLs. The final checked 1440x900 screenshot has the arena, action rail, battlefield, message, and hand inside the viewport.

Files touched:

- `package.json`
- `package-lock.json`
- `src/app/App.tsx`
- `src/app/App.css`
- `src/assets/cards/`
- `docs/llm-wiki/assets.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Verification:

- Playwright screenshot at 1440x900
- Playwright screenshot/bounding checks at 2048x1152 and 1280x720
- `npm test`
- `npm run build`

Follow-up:

- Optimize large temporary PNG runtime assets before production.

## [2026-05-24] ingest | Name ImageGen card restoration outputs

The generated ImageGen restoration outputs now have a review-friendly named copy set. Source-position filenames remain in `cards/` for traceability, and `named-cards/` contains 67 named copies: 56 character outputs and 11 pearl outputs. The manifest now records `assetName`, `displayName`, `namedFileName`, hashes, source crop mapping, pearl values, character candidate metadata, and duplicate relationships. The pearl-specific generated manifest was also corrected from the single-card trial state to all 11 pearl outputs.

Files touched:

- `scripts/build-imagegen-card-named-copies.mjs`
- `docs/llm-sources/2026-05-23-tts-card-crops/generated-imagegen/`
- `docs/llm-sources/2026-05-23-tts-pearl-card-crops/generated-imagegen/`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/assets.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`

Verification:

- `node scripts/build-imagegen-card-named-copies.mjs`
- `find docs/llm-sources/2026-05-23-tts-card-crops/generated-imagegen/named-cards -maxdepth 1 -type f -name '*.png' | wc -l`
- `jq empty docs/llm-sources/2026-05-23-tts-card-crops/generated-imagegen/manifest.json`
- `jq empty docs/llm-sources/2026-05-23-tts-pearl-card-crops/generated-imagegen/manifest.json`

Follow-up:

- Official character card names are still unverified, so the generated names use candidate IDs, activation requirements, power, and diamond counts instead of canonical card names.

## [2026-05-24] implementation | Image-only cards and character fields

The user asked for card faces to render as the image itself, for character cards to expose detailed descriptions, and then clarified that the right rail should be removed in favor of direct gate and activated-character fields. The arena now hides card name/meta overlays on card faces, shows a small inspect affordance on character cards, opens a character detail overlay with condition/score/reward/effect/status, removes the right rail, and shows each player field with separate `관문` and `활성 인물` areas. Runtime character fixtures now cover the 54 TTS-derived candidate metadata entries and generated named-card assets.

Files touched:

- `src/app/App.tsx`
- `src/app/App.css`
- `src/game/content/characters.fixture.ts`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`
- `docs/llm-wiki/assets.md`

Verification:

- Playwright screenshot at 1440x900 for the main arena
- Playwright screenshot at 1440x900 for the character detail overlay
- Playwright check that no right rail remains, three player fields render, active-character labels are present, and card images load
- `npm test`
- `npm run build`

Follow-up:

- Replace the temporary source-derived runtime images with cleared production assets before release.

## [2026-05-26] implementation | Verify solo round cycle and activation legal actions

The prototype was played through an automated solo round in the browser. A selector gap was found: payable gate-character activations were available through the UI shortcut and AI policy, but not exposed by `getLegalActions`, while `canPayRequirement` and `getPaymentPlans` still returned placeholder results. The selectors now expose base pearl-only activation plans, and the engine test suite includes a full automated round cycle invariant check.

Files touched:

- `src/game/engine/selectors.ts`
- `src/game/engine/engine.test.ts`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`

Verification:

- `npm test`
- `npm run build`
- Playwright browser run at 1440x900 with seed `cycle-test`: auto-play advanced from round 1 to round 2, returned to the human player with 3 actions, kept 4 open pearl cards and 2 open character cards, and produced no console/page errors.

Follow-up:

- Diamond-assisted payments and unresolved complex candidate requirements still need verified rule modeling before they should be treated as complete gameplay rules.
