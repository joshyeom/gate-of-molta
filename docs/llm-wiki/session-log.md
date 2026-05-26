# Session Log

## 2026-05-22

### Context

First session for the repository. The repository started empty except for `.git`.

The user clarified that Gate of Molta is a solo-play web adaptation of the board game "몰타의 관문". The initial version should run fully in the frontend with no backend or database. Game algorithms, rules, card image assets, and logic should be stored in the frontend. The target feel is immersive and visually rich, with animation and presentation inspired by Hearthstone.

### Work

- Established the initial README.
- Added `CLAUDE.md` and `AGENTS.md` for future LLM sessions.
- Created the initial `docs/llm-wiki/` project memory structure.
- Added a `rules.md` template to prevent future sessions from inventing game rules.
- Added `prompt-context.md` to preserve user prompts, intent, outcomes, and bottlenecks for retrospectives.
- Preserved the user-provided LLM Wiki pattern as a raw source in `docs/llm-sources/`.
- Added `schema.md` and `log.md` to align the project with the raw-source/wiki/schema operating model.
- Defined the first architecture direction:
  - pure TypeScript rules engine
  - React UI
  - local static content and assets
  - event-driven animation layer
  - browser-only persistence
  - future online compatibility through deterministic state/action design

### Known Gaps

- Exact board-game rules are not captured yet.
- Card list and card effects are not captured yet.
- Board layout and solo algorithm are not captured yet.
- No frontend scaffold exists yet.

### Next Likely Task

Capture the actual "몰타의 관문" rules and then scaffold a Vite React TypeScript app around the documented architecture.

## 2026-05-23

### Context

The user asked to find the existing Claude `/commit` workflow and register it equivalently as a skill.

### Work

- Located the source command at `/Users/yeomjeongho/.claude/commands/commit.md`.
- Created a global agent skill at `/Users/yeomjeongho/.agents/skills/commit`.
- Added Codex-compatible `SKILL.md` metadata and `skill.yaml`.
- Verified the skill appears in `npx skills list -g --json`.
- Recorded the prompt and operation in the LLM wiki.
- Committed the initial documentation baseline as `3782e70 docs(project): initialize LLM wiki and architecture`.
- Added roadmap and MVP planning documents.
- Ingested user-provided rule explanation links.
- Captured the core multiplayer rule loop from WING Board Game into `rules.md`.
- Recorded that the BoardLife source is currently blocked by Cloudflare in the agent environment.
- Cross-checked the rule capture with the Korea Boardgames YouTube introduction video.
- Added pearl-card distribution: 1-8, 7 copies each.
- Located online card-data candidates in BoardLife attachments and Tabletop Simulator workshop metadata.
- Added a sanitizer script that extracts only verification text from the Korean TTS save and excludes card images, image URLs, and raw save binaries.
- Generated a 54-entry character-card verification checklist in `docs/llm-sources/`.
- Added a separate TTS reference-asset downloader and saved 21 source images under `docs/llm-sources/2026-05-23-tts-reference-assets/`.
- Split the TTS card face sheets into 67 individual reference card crops under `docs/llm-sources/2026-05-23-tts-card-crops/`.
- Added a browser review page that shows cropped card images with candidate costs, effects, point rewards, diamond rewards, and duplicate grouping.
- Recorded the asset direction that final card images should be newly created original replacement art in a renewed medieval style, with TTS crops kept as reference-only material.
- Generated 67 separated original WebP replacement card assets at 1024x1592 under `assets/cards/original-webp/`, plus a manifest, review page, and contact sheet.
- Cropped the 11 visible Steam/TTS pearl-card variants directly from the source card sheets into `docs/llm-sources/2026-05-23-tts-pearl-card-crops/` with value-based filenames, metadata, a review page, and a contact sheet.
- Added sharpened 2x readability derivatives for those 11 pearl-card crops under `docs/llm-sources/2026-05-23-tts-pearl-card-crops/enhanced/`.
- Added per-card image-to-image restoration prompts under `docs/llm-sources/2026-05-23-tts-pearl-card-crops/imagegen-prompts/` so a generation model can produce clearer versions while preserving card values, numerals, layout, and refresh icons.
- Generated one image-to-image restoration trial for `pearl-1.jpg` under `docs/llm-sources/2026-05-23-tts-pearl-card-crops/generated-imagegen/`.
- Added `docs/llm-wiki/implementation-plan.md` to turn the MVP and roadmap into workstreams, milestones, guardrails, first sprint tasks, and rule blockers.
- Clarified in `mvp.md` and `roadmap.md` that app scaffolding and fixture-driven type/interface work can begin before full card verification, while final gameplay behavior must still wait for verified rules or explicit custom solo design.
- Added `docs/llm-wiki/solo-mode.md` for 2-5 total participant setup and Easy/Normal/Hard/Expert AI difficulty design.
- Recorded the decision that first-release solo play uses one human seat plus AI-controlled simulated player seats, with difficulty changing AI planning quality rather than base rules.
- Added `docs/llm-wiki/engine-model.md` to define the draft setup options, game state, card instance model, actions, events, selectors, validation rules, and first implementation slice.
- Recorded the decision to separate card definitions from physical card instances.
- Scaffolded a Vite React TypeScript app with package scripts, TypeScript configs, Vitest, and a minimal board UI.
- Implemented the first fixture-only engine slice under `src/game/engine/`: setup, seeded shuffle, markets, basic actions, selectors, reducer events, and tests.
- Added placeholder pearl/character content under `src/game/content/`.
- Added a minimal deterministic AI policy shell under `src/game/solo/`.
- Started a local dev server at `http://127.0.0.1:5173/`.
- Reworked the app UI into Korean opening/settings/game screens.
- Changed the game screen to show opponent hands and gate cards as hidden backs/counts while showing only the local player's hand and gate card faces.
- Added framed card buttons, per-player gate fields, direct card selection, automatic human turn ending after 3 actions, and automatic AI turns after a 5-second delay.
- Updated the prototype setup to deal 5 pearl cards to every player at game start.
- Added a human discard-to-5 flow after the final action; AI seats discard automatically before their turn advances.
- Kept gate cards visible as explicit framed gate cards while leaving opponent pearl hands hidden.
- Removed the bottom turn/settings status bar from the game screen and moved status text into the central turn header.
- Changed visible `힘` labels to `점수`.
- Expanded fixture character instances to 54 cards so the open character market can stay at 2 cards during early prototype play.
- Changed opponent layout from a top-only row to table seating around the center, with the human area anchored across the bottom.
- Removed the oversized central turn banner from the game screen.
- Enlarged opponent gate-card display and rendered it as a visible face-down gate frame inside each opponent seat.

### Known Gaps

- The current session's available-skill list may not refresh until a new session starts.
- The new skill should be checked in the next Codex session startup.
- Character-card requirements/effect notes have candidate TTS metadata, but official card names, power values, diamond rewards, and final effects still need verification.
- Downloaded TTS images are reference/source material only and should not be moved into app assets without a new original asset plan or rights confirmation.
- The individual card crops remain reference-only; they are easier to inspect but inherit the same source-material restrictions as the full sheets.
- The pearl-card crop subset is also reference-only and should not be treated as final runtime art without rights confirmation or replacement art.
- The enhanced pearl-card files are improved derivatives of the same source material, so they inherit the same reference-only restriction.
- The image-generation prompts still target reference derivatives, not final cleared app assets, unless rights are confirmed.
- The generated pearl-1 trial needs manual review before the approach is applied to the remaining pearl cards.
- The original card-art style guide and first pilot card still need to be defined before bulk asset production.
- The generated WebP batch is a first symbolic replacement batch and still needs user review before being treated as the final card-art style.
- Candidate point and diamond rewards are image-derived and still need user/official verification.
- Full gameplay implementation remains blocked until card data is verified and solo/automa behavior is implemented and tuned.
- App scaffolding, deterministic engine interfaces, tests, and non-canonical fixtures can start without violating the rule-capture constraint.
- Solo-mode difficulty design is drafted, but implementation and tuning have not started yet.
- Hard and Expert AI should wait until verified card effects and performance fixtures exist.
- Engine model has a first fixture-only implementation, but activation/payment/card effects are not implemented yet.
- The current UI now follows the intended card-table direction, but it still uses fixture cards and placeholder visuals.
- The current 5-card starting hand is a user-directed prototype rule and must be reconciled if an official setup source contradicts it.
- Card-detail overlays, activation/payment UI, real card art, and full animation are still pending.

### Next Likely Task

Implement activation/payment validation, card-detail overlays, and richer card-frame assets once card requirement data is verified enough to model.

## 2026-05-24

### Context

The user reviewed the current game UI screenshot and asked to fix the UI/UX problems compared with other online card games.

### Work

- Added a compact top HUD for active turn, remaining actions, and the latest status message.
- Added a score strip so all player score/diamond states can be compared without scanning separate seats.
- Added clear active-seat badges for AI/player turn recognition.
- Changed central deck controls from card-shaped objects into rectangular action buttons with counts.
- Added market action labels and card action chips for `획득`, `배치`, `교체`, `버리기`, and `상세`.
- Adjusted market alignment, card sizing, hand prominence, opponent slot opacity, and empty-slot copy.
- Kept changes in the React UI layer and did not add gameplay rules.
- Verified `npm test`, `npm run build`, dev-server startup, and local HTTP response at `http://127.0.0.1:5174/`.

### Known Gaps

- The UI still uses fixture cards and CSS placeholder art.
- Card-detail overlays, activation/payment flows, final card art, and real animation choreography remain pending.
- The local dev server used port `5174` because `5173` was already occupied.

### Next Likely Task

Implement card-detail overlays and activation/payment UI once character requirements and effects are stable enough to model.

### Follow-up Work

The user clarified the desired game feel with a Hearthstone screenshot reference. The implementation shifted away from a dashboard/card-table hybrid and toward an arena presentation:

- Replaced the panel-first game screen with an arena shell.
- Put the primary opponent command area and hidden hand at the top.
- Put shared markets and gate slots into a central battlefield area.
- Put the human hero and fanned hand at the bottom.
- Moved action controls into a right-side resource/action rail.
- Added stronger green selectable-card glow and fan transforms for the local hand.
- Kept the implementation copyright-safe by using original CSS styling rather than copying the referenced game's art assets.

Verification remained green with `npm test`, `npm run build`, and local HTTP response at `http://127.0.0.1:5174/`.

### Correction

The first arena pass still broke at the user's viewport because the mobile stacking breakpoint was too broad. The follow-up CSS narrowed the stacked layout to small mobile widths, clamped the action rail, card fan, hero badge, and market card dimensions, and kept the desktop arena inside the viewport. Verification remained green with `npm test`, `npm run build`, and local HTTP response.

### Second Correction

The breakpoint correction still produced an unacceptable overlap in the user's viewport. The arena CSS was changed to a fixed-fit 16:9 stage with absolute positioning for major regions: opponent command, battlefield, player command, action rail, and message panel. This removes the desktop/tablet stacking behavior that caused the rail and cards to pile up on the left. Verification remained green with `npm test`, `npm run build`, and local HTTP response.

### Browser-Verified Correction

The user explicitly required direct browser verification and use of the available image assets. Playwright was added as a dev dependency and used with a cached Chromium binary to capture the game screen. The captured bounding boxes showed that the arena had the correct width but was centered inside a stale first grid column from the earlier `.game-screen` layout. Resetting the old grid template fixed the left shift. The UI now uses copied runtime assets under `src/assets/cards/` for pearl art and a temporary character placeholder. Final checks included browser screenshots at 1440x900, wider/narrower viewport bounding checks, `npm test`, and `npm run build`.

### ImageGen Output Naming

The user pointed out that the generated card images still had source sheet-position filenames. I kept those source-position files in `cards/` for traceability and added a named copy set in `docs/llm-sources/2026-05-23-tts-card-crops/generated-imagegen/named-cards/`.

- Pearl outputs now use `pearl-<value>.png` and `pearl-<value>-refresh.png`.
- Character outputs now use candidate metadata names like `character-505-8888-p5-d0.png`.
- Two extra duplicate crops from sheet 21 were identified as duplicate character outputs and named as `character-extra-*`.
- `manifest.json` now records both source-position and named filenames, plus display names and hashes.
- `named-review.html` gives a browser review page for the named files.

Official character card names remain unverified, so the filenames intentionally use candidate IDs and activation requirements rather than invented card names.

### Character Detail And Image-Fill Pass

The user asked for cards to use the image face itself instead of added name labels, for each character card to expose detailed descriptions, and for the right-side rail to show opponent gate cards instead of deck/action counts.

- Removed visible card-name/meta overlays from rendered card faces.
- Replaced large action chips on cards with a small inspect marker for character cards.
- Added a character detail overlay with the card image, condition, score, diamond reward, effect text, and verification status.
- Moved deck and refresh actions into compact central arena action buttons.
- Removed the right rail after the user clarified that gate/activated-character fields should be the focus.
- Added a direct player field for every seat with separate `관문` and `활성 인물` areas.
- Expanded runtime character fixtures to the 54 candidate metadata entries from `docs/llm-sources/2026-05-23-tts-character-verification.json`.
- Copied the matching generated named-card images into `src/assets/cards/characters/` and removed stale fixture-name PNGs.
- Adjusted the UI card aspect ratio to the generated asset ratio so card images fill their frames cleanly.
- Verified with Playwright screenshots of the main arena and character detail overlay, a no-right-rail/image-load check, plus `npm test` and `npm run build`.

### Modal Refinement

The user disliked the character detail modal because the `배치` action sat at the lower-right and the modal still presented candidate IDs as if they were names.

- Removed generated character IDs from the visible modal title.
- Changed fixture character names to the generic `인물 카드` label.
- Made the effect text the primary content block.
- Moved `배치` and `닫기` below the card preview on the left side, reducing pointer travel from the card image to the action.
- Rechecked the local verification JSON; the visible effect text is still pulled from `docs/llm-sources/2026-05-23-tts-character-verification.json`.
- Verified with Playwright that the modal no longer contains visible `인물 <number>` text, has an effect block, and puts the primary action beside the card column. Tests and build remain green.

## 2026-05-26

### Context

The user asked to continue playing the solo game, fix anything wrong, and repeat until one cycle ran cleanly.

### Work

- Re-read the project operating docs and current rule capture before changing code.
- Ran the current unit tests and production build.
- Started the local Vite app at `http://127.0.0.1:5173/`.
- Used Playwright to run the game in-browser with automated play enabled.
- Verified a browser round transition from round 1 to round 2 with no console/page errors.
- Found and fixed an engine selector gap where activation was possible through UI/AI code but missing from `getLegalActions`.
- Implemented base pearl-only `canPayRequirement` and `getPaymentPlans` behavior using the existing deterministic payment search.
- Added tests that payable gate characters appear as legal activation actions.
- Added an engine-level automated full-round cycle test that returns to the start player, preserves market sizes, and enforces hand limits at turn boundaries.
- Re-ran Playwright with fixed seed `cycle-test`, paused auto-play after round 2 began, and verified the stable screen state: human turn, 3 actions, 4 open pearls, 2 open characters, no severe logs.

### Known Gaps

- The verified cycle is for the current prototype/candidate-rule implementation, not the final official rule set.
- Diamond-assisted payments are still not modeled in payment plans.
- Complex unresolved candidate requirements remain custom until official card data or explicit prototype rules define them.

### Next Likely Task

Model diamond payment plans and the remaining complex character requirements once the card data is verified enough to avoid inventing rules.
