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

### Follow-up Work

The user asked what diamond rules were currently documented, then approved implementing the base rule only: diamonds can increase a paid pearl value by +1, while lowering values remains a separate card-effect candidate.

- Implemented base-rule diamond payment plans in selectors.
- Updated activation validation so the reducer applies diamond modifiers itself instead of trusting UI/AI-selected plans.
- Enforced one diamond per pearl, no diamond boost above 8, owned-diamond validation, and base-rule `+1` only.
- Moved used diamonds from the player's diamond area to the character discard pile.
- Added a `diamondsDiscarded` event label.
- Updated AI activation, quick activation, and card-detail activation to pass full `PaymentPlan` objects.
- Added a regression test for paying `12` using `1` plus `1+다이아`.
- Verified with `npm test`, `npm run build`, and a Playwright smoke run of the game screen.

Known gap:

- The candidate ability that lets a specific card use diamonds to lower pearl values is still intentionally unimplemented until that card effect is verified or explicitly accepted as prototype behavior.

### Cycle History Pass

The user asked to play one cycle, fix unimplemented or incomplete parts encountered, replay, and report the game history.

- Added `scripts/simulate-cycle.mjs`, a deterministic one-cycle reporter that bundles the TypeScript engine with esbuild and prints action/event history.
- Ran seed `cycle-history` for 3 players and found that full-gate replacement discarded the old gate character in zone state but did not clear card owner metadata or emit a history event.
- Added `characterDiscarded` to engine events and UI event labels.
- Updated market/deck character placement so replacing a full gate emits a discard event and clears ownership for the discarded character.
- Added a regression test for gate-character replacement ownership and event history.
- Replayed seed `cycle-history`; the second run completed round 1 and returned to the human player at round 2 with 3 actions, 4 open pearls, 2 open characters, and all players at hand limit.
- Cross-checked the same seed through Playwright in the browser with no severe console/page errors.

Known gap:

- `useAbility` still throws if called directly because card abilities are not exposed in legal actions and remain unverified candidate effects.

### Solo AI Improvement

After reviewing the cycle history, the user asked to improve the behavior. The main issue was that the solo policy treated full-gate replacement as an early fallback, so the human autopilot filled both gate slots and then replaced a gate character instead of collecting a useful pearl.

- Changed solo action priority to activate payable characters first, fill empty gate slots, collect useful pearls, refresh the pearl market when no gain improves the hand, and only then consider replacing a full gate.
- Added a shared `choosePearlsToDiscardToLimit` helper so UI auto-turn cleanup, tests, and the cycle reporter discard low-value or currently unneeded pearls first.
- Replayed seed `cycle-history`: the human autopilot now places two characters, takes `진주 5`, and discards `진주 2` while keeping the `진주 7` needed by a gate character.
- The same replay shows `AI 1` placing a `2` requirement character, activating it, gaining a diamond reward, and placing another character in the same turn.
- `AI 2` now refreshes the pearl market instead of gaining a pearl that would immediately be discarded.
- Added regression tests for preferring useful pearl gain over blind replacement and for smart hand-limit discard.
- Verified with `npm test`, `npm run build`, `node scripts/simulate-cycle.mjs --seed=cycle-history --players=3`, and Playwright at `http://127.0.0.1:5173/`.

Known gap:

- The AI remains a deterministic heuristic policy and does not evaluate future ability effects while card abilities are still unverified.

### Full Game To Game Over

The active goal was extended to run the game until it fully ends, fix anything wrong during the run, and report the result/history.

- Replaced the old tracked `scripts/simulate-game.ts` with `scripts/simulate-game.mjs`, an executable self-bundling reporter similar to the cycle reporter.
- The reporter records full turn/action/event history, round summaries, final market/deck state, player gate cards, and activated cards.
- Generated the full report at `docs/llm-sources/2026-05-26-full-game-history.json`.
- Found a reproducibility mismatch: the first full-game probe fixed the start player to seat 0, while the browser uses the default seeded-random start player. Updated the reporter and test to match the UI default unless `--start-seat` is explicitly provided.
- Added an engine regression test that auto-plays seed `full-game-history` to game over.
- Verified in Playwright with accelerated timers that the browser reaches the game-over overlay for the same seed with no severe console/page errors.

Result under fixture rules before prototype effect implementation:

- Seed: `full-game-history`
- Players: 3
- Completed: 364 recorded steps, 84 turns, game-over state at round 29
- Winner: `나`
- Final scores: `나` 14 points / 1 diamond, `AI 2` 9 points / 0 diamonds, `AI 1` 2 points / 0 diamonds
- End-game trigger: in round 27, `나` activated `인물(7788, 점수 3, 다이아 1)` by paying `진주 7, 진주 7, 진주 8, 진주 8`, reaching 14 points and triggering end-game resolution.

Known gap:

- This proved that the then-current prototype loop could complete. It did not prove final official gameplay because candidate character effects had not yet been implemented at that point.

### Prototype Character Effects

The user asked why documented official/candidate effects were not implemented. The repository documentation showed that TTS-derived card metadata had been preserved as verification-only candidate text, so the engine intentionally did not execute it yet. The user then approved implementing all documented effects as prototype behavior.

- Added `src/game/engine/abilities.ts` to centralize effect classification by character definition.
- Implemented all currently documented custom requirements, including exact digit strings, sum/sequence/same/parity Korean labels, `333/666`, `444/555`, `222+다이아몬드 1장`, two-pair forms, and same-pair-plus-66 forms.
- Extended `PaymentPlan` for spent diamonds, pearl value overrides, and virtual pearl uses.
- Implemented base diamond +1 plus the candidate activated-card diamond -1 effect.
- Implemented virtual reusable pearl values from activated characters and the activated effects that let hand `3` act as any value or hand `1` act as `8`.
- Implemented `useAbility` for after-actions redraw, start-turn deck peek, start-turn gate/market swap, and discarding pearl `2` for a diamond.
- Implemented on-activate effects for action bonuses, next-player action bonus, opponent hand steal, opponent gate discard, and reclaiming one just-used pearl.
- Implemented adjacent activation of wisp cards from another player's gate.
- Updated AI selection and auto-turn cleanup so free ability actions can run without consuming normal actions.
- Added manual activated-card detail support for usable abilities.
- Updated full-game report artifacts after the new effects changed deterministic play.
- Updated `docs/llm-wiki/rules.md` so the documented prototype effect and diamond behavior matches the engine.

Result immediately after prototype effect implementation, before later strategy-AI tuning:

- Seed: `full-game-history`
- Players: 3
- Completed: 318 recorded steps, 66 turns, game-over state at round 23
- Winner: `AI 2`
- Final scores: `나` 15 points / 0 diamonds, `AI 2` 15 points / 2 diamonds, `AI 1` 2 points / 0 diamonds

Verification:

- `npm test -- --run`
- `npm run build`
- `node scripts/simulate-cycle.mjs --seed=cycle-report --players=3`
- `node scripts/simulate-game.mjs --seed=full-game-history --players=3 --output=docs/llm-sources/2026-05-26-full-game-history.json`

Known gap:

- These effects are implemented as deterministic prototype interpretations of candidate text, not as final official rules.
- Ambiguous target-choice effects currently use deterministic defaults instead of interactive choice prompts.

### Strategy Guide And Strategy-Weighted AI

The user asked to rewrite the strategy after the prototype character effects were implemented.

- Added `docs/llm-wiki/strategy-guide.md` with the current play guide: early activation density, midgame engine/tempo cards, endgame 12-point timing, diamond tiebreakers, strong card groups, and cards to avoid or treat conditionally.
- Updated the normal solo AI policy to value payable engine cards, effect utility, requirement progress, payment cost, and endgame timing instead of mostly chasing raw printed score.
- Added custom requirement contribution scoring so the AI can recognize useful pearls for exact digit strings, same-value, sequence, parity, sum, two-pair, `333/666`, `444/555`, and diamond-linked requirements.
- Reduced wasteful `18` hand redraw use by only firing it when the current hand is poor and no gate character is payable.
- Regenerated the full-game JSON/Markdown/HTML history with the updated strategy policy.

Result under current prototype effect and strategy-AI rules:

- Seed: `full-game-history`
- Players: 3
- Completed: 241 recorded steps, 51 turns, game-over state at round 18
- Winner: `AI 2`
- Final scores: `나` 10 points / 1 diamond, `AI 1` 10 points / 0 diamonds, `AI 2` 14 points / 0 diamonds

Verification:

- `npm test -- --run`
- `npm run build`
- `node scripts/simulate-game.mjs --seed=full-game-history --players=3 --output=docs/llm-sources/2026-05-26-full-game-history.json`

Known gap:

- The strategy guide and AI weights are still based on prototype/candidate effect text.
- Hard and Expert AI remain future work.

### Deck Composition And Interaction Corrections

The user identified several rule/interaction errors in the current design.

- Changed pearl deck composition to 8 cards for each value 1-8.
- Added refresh pearl definitions for values 3, 4, and 5 and wired their art assets.
- Changed character deck creation so every fixture entry is exactly one physical card rather than multiplying definitions.
- Implemented refresh-pearl behavior: when a refresh pearl enters the open pearl row during play, all open character cards are discarded and replaced from the character deck.
- Changed character discards so they do not reshuffle into the character deck.
- Removed visible deck-count labels from the main deck action buttons.
- Changed player field status from gate/active counts to score and diamond totals.
- Added visible diamond chips for the human player and activation labels that surface diamond-backed payments.
- Added a start-of-turn character-deck peek modal for the consecutive-3-card ability, with close preserving the top card and an optional place action.
- Made opponent gate identity cards genuinely clickable and fixed the z-index issue that was blocking pointer events.

Verification:

- `npm test -- --run`
- `npm run build`
- Playwright browser smoke check at `http://127.0.0.1:5174/`

Known gaps:

- The user corrected the earlier duplicate assumption: every current fixture character card is one physical card.
