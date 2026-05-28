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

## [2026-05-26] implementation | Implement base diamond payment

The documented base diamond rule is now implemented in the engine: a diamond can increase one paid pearl card by exactly +1, cannot be used on an 8, and only one diamond can target each pearl. Used diamonds are removed from the player's diamond area, moved to the character discard pile, and emitted as a discard event. Payment-plan selection, AI activation, quick activation, and the card-detail activation modal now use the same `PaymentPlan` object, so UI and solo logic can activate characters with diamond-assisted payments.

Files touched:

- `src/game/engine/types.ts`
- `src/game/engine/selectors.ts`
- `src/game/engine/reducer.ts`
- `src/game/solo/chooseAiAction.ts`
- `src/app/App.tsx`
- `src/game/engine/engine.test.ts`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`

Verification:

- `npm test`
- `npm run build`
- Playwright smoke run at 1440x900: game screen loaded, 4 open pearls, 2 open characters, 5-card hand, and no severe console/page errors.

Follow-up:

- The special candidate ability that lowers pearl values with diamonds is still not implemented because it is card-effect-specific and not part of the base diamond rule.

## [2026-05-26] implementation | Add cycle history report and gate-replacement discard event

The game was run through a full one-round cycle with the deterministic engine. During the cycle, full-gate replacement exposed a state-history gap: discarded gate characters moved into the character discard pile but did not clear owner metadata or emit a discard event. The reducer now clears ownership for replaced gate characters and emits `characterDiscarded`. A reusable cycle simulation script records turn-by-turn action/event history for future verification and reporting.

Files touched:

- `scripts/simulate-cycle.mjs`
- `src/game/engine/types.ts`
- `src/game/engine/reducer.ts`
- `src/game/engine/engine.test.ts`
- `src/app/App.tsx`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`

Verification:

- `node scripts/simulate-cycle.mjs --seed=cycle-history --players=3`
- Playwright browser run at 1440x900 with seed `cycle-history`: auto-play advanced from round 1 to round 2, returned to the human player with 3 actions, kept 4 open pearl cards and 2 open character cards, and produced no console/page errors.
- `npm test`
- `npm run build`

Follow-up:

- Character ability execution remains intentionally unavailable until individual card effects are verified or accepted as prototype rules.

## [2026-05-26] implementation | Improve solo AI pearl and discard choices

The deterministic solo policy was refined after the `cycle-history` replay showed a weak fallback: once a player filled both gate slots, the policy replaced a gate character even when collecting a useful pearl was available. The AI now activates payable characters first, fills open gate slots, collects useful pearls even at hand limit if they improve the hand, refreshes the pearl market when gaining would only force a worse discard, and only then considers full-gate replacement. Automatic hand-limit cleanup now discards the least useful pearls by comparing current gate requirements instead of taking the oldest cards.

Files touched:

- `src/game/solo/chooseAiAction.ts`
- `src/app/App.tsx`
- `scripts/simulate-cycle.mjs`
- `src/game/engine/engine.test.ts`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`

Verification:

- `npm test`
- `npm run build`
- `node scripts/simulate-cycle.mjs --seed=cycle-history --players=3`
- Playwright browser run at 1440x900 with seed `cycle-history`: auto-play advanced from round 1 to round 2, returned to the human player with 3 actions, showed 4 open pearls, 2 open characters, 5 cards in hand, 2 human gate characters, and no console/page errors.

Follow-up:

- The policy is still heuristic; it does not simulate future turn value or unverified character abilities.

## [2026-05-26] implementation | Run full game to game over

The auto-play goal was extended from one cycle to a full game. The old `scripts/simulate-game.ts` was replaced with an executable self-bundling full-game reporter that records turn/action/event history and can write the full report to JSON. A mismatch between fixed-seat simulation and the browser's seeded-random start-player setup was found and corrected so the generated report matches the UI default flow.

Files touched:

- `scripts/simulate-game.mjs`
- `scripts/simulate-game.ts`
- `src/game/engine/engine.test.ts`
- `docs/llm-sources/2026-05-26-full-game-history.json`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`

Verification:

- `node scripts/simulate-game.mjs --seed=full-game-history --players=3 --output=docs/llm-sources/2026-05-26-full-game-history.json`
- `npm test`
- `npm run build`
- Playwright browser run at 1440x900 with seed `full-game-history`, accelerated timers, and auto-play enabled: game-over overlay appeared at round 29, scoreboard showed `나` winning with 14 points and 1 diamond, and no console/page errors were emitted.

Follow-up:

- The completed run is for the current fixture/candidate rule model. Official card effects are still not executed unless separately implemented and verified.

## [2026-05-26] implementation | Render full game history as Markdown

The full game JSON report was converted into a readable Markdown transcript so the then-current 84-turn, 364-action history could be inspected without manually parsing JSON.

Files touched:

- `docs/llm-sources/2026-05-26-full-game-history.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/log.md`

Verification:

- Markdown generated from `docs/llm-sources/2026-05-26-full-game-history.json`
- The history report was later regenerated after strategy-AI tuning; the current Markdown output contains 1,321 lines, 51 turns, and 241 recorded actions.

## [2026-05-26] implementation | Implement prototype character effects

After reviewing why documented effects were not executing, the user explicitly approved implementing all TTS-derived/candidate character effects as prototype behavior. The engine now handles custom candidate requirements, virtual pearl-value sources, pearl value overrides, diamond lowering from the matching activated card, immediate and next-turn action bonuses, after-actions redraw, start-turn peek/swap abilities, pearl-2-to-diamond conversion, opponent hand/gate interaction effects, reclaiming one just-used pearl, and adjacent wisp activation.

Files touched:

- `src/game/engine/abilities.ts`
- `src/game/engine/types.ts`
- `src/game/engine/state.ts`
- `src/game/engine/selectors.ts`
- `src/game/engine/reducer.ts`
- `src/game/solo/chooseAiAction.ts`
- `src/app/App.tsx`
- `src/game/engine/engine.test.ts`
- `scripts/simulate-cycle.mjs`
- `scripts/simulate-game.mjs`
- `docs/llm-sources/2026-05-26-full-game-history.json`
- `docs/llm-sources/2026-05-26-full-game-history.md`
- `docs/llm-sources/2026-05-26-full-game-history.html`
- `docs/llm-wiki/decisions.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/rules.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`

Verification:

- `npm test -- --run`
- `npm run build`
- `node scripts/simulate-cycle.mjs --seed=cycle-report --players=3`
- `node scripts/simulate-game.mjs --seed=full-game-history --players=3 --output=docs/llm-sources/2026-05-26-full-game-history.json`

Result:

- At this step, the updated full-game report ended in 66 turns / 318 recorded steps at round 23.
- `나` and `AI 2` both finish with 15 points, and `AI 2` wins the tie on diamonds, 2 to 0.

Follow-up:

- The implemented effects are still prototype interpretations of candidate text. Explicit UI target-selection prompts are still a future improvement; current ambiguous effects use deterministic defaults.

## [2026-05-26] implementation | Strategy-weighted solo AI and current guide

The user asked to rewrite the strategy after prototype effects were implemented. The strategy now treats the game as an activation-density and engine-building race rather than a raw printed-score race. The solo AI was tuned to follow that principle with staged heuristics for early engine-building, midgame tempo, and endgame 12-point/tiebreaker evaluation.

Files touched:

- `src/game/solo/chooseAiAction.ts`
- `src/game/engine/engine.test.ts`
- `docs/llm-wiki/strategy-guide.md`
- `docs/llm-wiki/decisions.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`
- `docs/llm-wiki/prompt-context.md`
- `docs/llm-sources/2026-05-26-full-game-history.json`
- `docs/llm-sources/2026-05-26-full-game-history.md`
- `docs/llm-sources/2026-05-26-full-game-history.html`

Verification:

- `npm test -- --run`
- `npm run build`
- `node scripts/simulate-game.mjs --seed=full-game-history --players=3 --output=docs/llm-sources/2026-05-26-full-game-history.json`

Result:

- The latest `full-game-history` report ends in 51 turns / 241 recorded steps at round 18.
- `AI 2` wins with 14 points; `나` and `AI 1` each finish with 10 points.
- `AI 1` no longer stalls at the earlier 2-point result under the previous effect-naive policy.

Follow-up:

- The current guide and AI policy are still tied to prototype candidate effect text. They should be retuned after official card text and explicit target-choice UI are finalized.

## [2026-05-26] implementation | Correct deck composition and card interactions

The user corrected several prototype design assumptions. Pearl values now have 8 cards each, refresh pearl variants can refresh the open character market when revealed into the open pearl row, character discards no longer reshuffle into the character deck, deck-count labels were removed from the main UI, player field status now shows score and diamonds, diamond chips are visible/selectable, the character-deck peek ability opens a modal, and opponent gate identity cards are clickable.

Files touched:

- `src/game/content/pearls.ts`
- `src/game/content/characters.fixture.ts`
- `src/game/engine/state.ts`
- `src/game/engine/reducer.ts`
- `src/game/engine/selectors.ts`
- `src/game/engine/types.ts`
- `src/game/engine/engine.test.ts`
- `src/app/App.tsx`
- `src/app/App.css`
- `docs/llm-wiki/rules.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`

Verification:

- `npm test -- --run`
- `npm run build`
- Playwright browser smoke check at `http://127.0.0.1:5174/`

Follow-up:

- Confirm the exact official character-card list. The current prototype treats every captured fixture entry as one physical card.

## [2026-05-27] implementation | Add activation choice modals and immediate 12-point ending

The user requested fixes for activation ambiguity, `1111`, `345`, opponent-gate discard targeting, hand-limit cleanup, and turn/status UI. Payment selection now exposes multiple valid plans, prefers activated virtual pearls over spending hand pearls, and treats `1111` as one reusable virtual pearl of any value. Human activations can now carry explicit choices for `345` reclaimed pearl and opponent-gate discard targets. The UI adds modals for payment-plan selection, reclaim selection, target selection, and over-limit hand discard confirmation. Games now end immediately when an activation reaches 12 points.
AI evaluation now also gives more weight to opponent-gate discard effects when opponents have strong, payable, or endgame-threatening gate cards.
Market card rendering now stages changed slots through a short empty placeholder before revealing the new card, which avoids overlapping removal/reveal visuals.

Files touched:

- `src/game/engine/selectors.ts`
- `src/game/engine/reducer.ts`
- `src/game/engine/types.ts`
- `src/game/engine/engine.test.ts`
- `src/game/solo/chooseAiAction.ts`
- `src/app/App.tsx`
- `src/app/App.css`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`

Verification:

- `npm test`
- `npm run build`

Follow-up:

- The market reveal staging is presentation-only; reducer state still changes atomically.

## [2026-05-27] implementation | Compact opponent HUD and responsive table layout

The user requested a cleaner top HUD, smaller AI identity containers, larger opponent card fields, and a responsive pass for mobile. The visible turn/status message was removed from the top bar, opponent identity badges were compressed, opponent gate/active-card areas were widened, and opponent active cards now wrap instead of requiring horizontal scrolling. Landscape mobile now switches to a vertical flow for opponent rows, market, and the human area to avoid overlap; portrait mobile continues to show the orientation guard.

Files touched:

- `src/app/App.tsx`
- `src/app/App.css`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`

Verification:

- `npm test`
- `npm run build`
- Playwright layout checks at desktop, mobile landscape, and mobile portrait viewports.

## [2026-05-27] implementation | Prompt human passive abilities before continuing

The user requested that passive/activated effects requiring human input open their modal first instead of requiring card inspection or being skipped by automatic turn flow. Human turn finishing no longer auto-resolves usable ability cards. The UI now automatically opens the relevant card detail prompt for the character-deck peek effect and the `18` discard/redraw effect, while allowing the player to dismiss the prompt for that timing window. Activation choice rows now show whether each payment source comes from hand pearls, activated-card virtual/transform sources, or diamonds. Market replacement staging now keeps previous cards visible during the delay instead of rendering an empty placeholder first. Score/diamond text was enlarged, and opponent gate/activated card slots were normalized to the same visual size.

Files touched:

- `src/app/App.tsx`
- `src/app/App.css`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`

Verification:

- `npm test`
- `npm run build`
- Playwright layout smoke check for desktop and mobile landscape.

## [2026-05-27] implementation | Add remaining human ability choice modals

The previous human ability prompt flow still let some effects fall through to reducer defaults. The UI now routes `useAbility` through a request layer before dispatch. The start-of-turn gate/market swap effect opens a modal where the player chooses both cards to exchange, and the pearl-`2`-to-diamond effect opens a modal where the player chooses the `2` pearl to discard. Closing either modal dismisses that prompt for the current timing window.

Files touched:

- `src/app/App.tsx`
- `src/app/App.css`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`

Verification:

- `npm test`
- `npm run build`
- Playwright layout smoke check for desktop and mobile landscape.

## [2026-05-27] implementation | Correct 12-point current-round ending and verify expert games

The user corrected the end-game rule: reaching 12 points should not end immediately and should not open an additional final round. The engine now marks the game as `finishCurrentRound` when an activation first reaches 12+ points, lets the current round finish, and then ranks winners by score with diamonds as the existing tiebreaker. Expert AI now uses the selected difficulty in action scoring, adds public-information denial choices, and still prioritizes filling an empty gate before pearl denial so games continue to progress. A batch simulator was added for deterministic multi-game verification.

Files touched:

- `src/game/engine/reducer.ts`
- `src/game/engine/engine.test.ts`
- `src/game/solo/chooseAiAction.ts`
- `scripts/simulate-game.mjs`
- `scripts/simulate-batch.mjs`
- `docs/llm-sources/2026-05-27-expert-10-games-round-end.json`
- `docs/llm-wiki/rules.md`
- `docs/llm-wiki/strategy-guide.md`
- `docs/llm-wiki/engine-model.md`
- `docs/llm-wiki/solo-mode.md`
- `docs/llm-wiki/index.md`

Verification:

- `npm test`
- `npm run build`
- `node scripts/simulate-batch.mjs --games=10 --seed-prefix=expert-verify-round-end --players=3 --difficulty=expert --output=docs/llm-sources/2026-05-27-expert-10-games-round-end.json`

Result:

- 10/10 expert games ended.
- 0 invariant violations.
- Winner split: AI 2 won 6, AI 1 won 2, human autoplay won 2.
- Effect coverage included virtual pearl payments, pearl overrides, diamond modifier payments, wisp activations, opponent gate discards, reclaimed pearls, action bonuses, and character-market refreshes.

## [2026-05-28] implementation | Add visual change report HTML

The user asked for the changed work to be reported as an HTML visualization. A static report was added under `docs/llm-sources/` summarizing the current rule, card-effect, interaction, UI, AI, and verification changes with file links and bar-chart metrics from the expert 10-game verification report.

Files touched:

- `docs/llm-sources/2026-05-28-change-visual-report.html`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`

Follow-up:

- Keep this report as a point-in-time artifact; update with a new dated file if the next implementation pass changes the summarized behavior.

## [2026-05-28] implementation | Preload optimized runtime images and improve 5-player layout

The user reported slow first-load image rendering and cramped opponent fields in 5-player games. Runtime card rendering now imports optimized WebP card assets instead of the multi-megabyte PNGs, and the opening screen blocks on a card/board image preload pass with progress feedback before showing the home screen. Five-player games now use a 2x2 opponent layout on normal desktop heights, while short landscape screens switch to a scrollable vertical flow to avoid overlapping the battlefield and player area.

Files touched:

- `src/app/App.tsx`
- `src/app/App.css`
- `src/assets/cards/pearls/*.webp`
- `src/assets/cards/characters/*.webp`
- `docs/llm-wiki/assets.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`

Verification:

- `npm test -- --run`
- `npm run build`
- Playwright checks at 1440x900 and 1280x720 for loading screen presence, 5-player layout, WebP-only card requests, and zero broken images.

## [2026-05-28] implementation | Group payment choices and delay new passive effects

The user reported duplicated activation-combination rows, market replacement cards appearing from shifted positions, same-turn blue passive effects, and an end-game timing edge case. The payment-choice modal now groups visually identical payment plans into one recommended row plus distinct alternatives. Market rows now use fixed card slots; changed slots clear first and reveal the new card in the same position without shared-layout motion. The engine tracks characters activated during the current turn so blue/passive effects cannot be used for payment, abilities, hand limit, or persistent action bonuses until the owner's next turn, while red/on-activation effects still resolve immediately. The 12-point current-round end now stops at the last player before advancing to the start player.

Files touched:

- `src/app/App.tsx`
- `src/app/App.css`
- `src/game/engine/types.ts`
- `src/game/engine/state.ts`
- `src/game/engine/selectors.ts`
- `src/game/engine/reducer.ts`
- `src/game/engine/engine.test.ts`
- `docs/llm-wiki/rules.md`
- `docs/llm-wiki/engine-model.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`

Verification:

- `npm test -- --run`
- `npm run build`
- Playwright market-replacement check at 1440x900 confirmed unchanged slot coordinates, 4 temporary placeholders for the refreshed pearl row, and 6 restored market cards after reveal.

## [2026-05-28] implementation | Run 10-game UX/rule audit and fix restart/layout regressions

The user asked to play 10 games while reviewing the card-game UX/UI from a senior perspective and to correct any rule issues found. A 10-game expert batch completed with 10/10 ended games and 0 invariant violations, covering virtual pearl payments, pearl overrides, diamond modifiers, wisp activations, opponent gate discards, reclaimed pearls, action bonuses, and character-market refreshes. Browser review then found two UX/runtime issues: 5-player desktop controls and market rows could overlap opponent/player regions, and the browser `새 게임` action could reuse the previous setup seed because it started from a stale React state closure. The 5-player desktop layout now reserves top HUD space and compacts the market band so opponent, market, and player regions no longer intersect at 1440x900. Restart now passes the generated setup directly into `startGame`, so repeated browser games use distinct seeds.

Files touched:

- `src/app/App.tsx`
- `src/app/App.css`
- `docs/llm-sources/2026-05-28-ux-rule-audit-10-games.json`
- `docs/llm-sources/2026-05-28-ux-browser-audit/`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/log.md`
- `docs/llm-wiki/session-log.md`

Verification:

- `node scripts/simulate-batch.mjs --games=10 --seed-prefix=ux-rule-audit-2026-05-28 --players=3 --difficulty=expert --output=docs/llm-sources/2026-05-28-ux-rule-audit-10-games.json`
- Playwright desktop 5-player bounding check: no status/opponent, market/opponent, or market/player intersections after the layout fix.
- Playwright accelerated browser run: 10 consecutive React games ended, 10 unique scoreboards, 0 console/page errors, and no game-over text overflow.
- `npm test -- --run`
- `npm run build`
