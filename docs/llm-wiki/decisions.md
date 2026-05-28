# Decisions

## 2026-05-22: Frontend-only first version

The first version will run fully in the browser without a backend or external database.

Reason:

- The user wants a simple web page.
- The first target is solo play.
- All game rules, card data, assets, and logic can be packaged as static frontend resources.

Consequences:

- Local persistence uses browser storage.
- Assets must be optimized for web delivery.
- No multiplayer assumptions should leak into the first implementation.

## 2026-05-22: Separate rules engine from animation/UI

Game logic will be implemented as pure TypeScript modules separate from React and animation libraries.

Reason:

- Rules need deterministic tests.
- Animation-heavy UI should not make the engine fragile.
- Future online support will be easier if gameplay is represented as actions over state.

Consequences:

- UI components render state and dispatch actions.
- Engine emits events and animation intents.
- Animation libraries stay in the presentation/effects layer.

## 2026-05-22: Do not invent board-game rules

The exact rules of "몰타의 관문" must be captured before implementing gameplay.

Reason:

- The repository currently does not contain a rulebook, card list, or formal game model.
- Incorrect assumptions would corrupt the core engine design.

Consequences:

- Early work should focus on structure, rule capture, and prototypes.
- Any temporary mock rules must be clearly labeled as placeholders.

## 2026-05-22: Track prompt context for retrospectives

The project will keep a prompt context log in `docs/llm-wiki/prompt-context.md`.

Reason:

- The user wants to review which prompts were used during development.
- Prompt history can reveal where work slowed down, where context was missing, and which instructions produced useful outcomes.
- Future LLM sessions need not rely only on chat history.

Consequences:

- Major user prompts should be preserved in their original language.
- Each prompt entry should include intent, outcome, and bottleneck/reflection notes.
- Sensitive information should be summarized rather than copied verbatim if it appears later.

## 2026-05-22: Adopt the LLM Wiki raw-source/schema/log pattern

The project will instantiate the user-provided LLM Wiki pattern.

Reason:

- The user explicitly provided the pattern as the starting point.
- The project needs durable memory across LLM sessions.
- Raw sources, generated synthesis, and operating rules should be separated.

Consequences:

- Verbatim source material lives in `docs/llm-sources/`.
- LLM-maintained synthesis lives in `docs/llm-wiki/`.
- `docs/llm-wiki/schema.md` defines wiki operations.
- `docs/llm-wiki/index.md` is the content catalog.
- `docs/llm-wiki/log.md` is the chronological operation log.

## 2026-05-23: Define MVP before scaffolding gameplay

The project will define a small playable MVP before implementing the frontend app.

Reason:

- The desired presentation quality is high, so scope can expand quickly.
- The rules are not captured yet.
- A playable rules loop should be proven before deep animation polish.

Consequences:

- `docs/llm-wiki/mvp.md` defines what counts as the first playable version.
- Advanced animation, sound, replay, online play, and multiple saves are excluded from MVP.
- Gameplay code should wait until `rules.md` has enough real rule data.

## 2026-05-23: Treat solo mode as a custom adaptation until proven official

The provided accessible rule source describes the original game as a 2-5 player game, and no official solo mode has been captured yet.

Reason:

- The product goal is solo play, but the source material currently supports multiplayer rules.
- Implementing solo play by assumption would risk creating an unstable or unfun core loop.

Consequences:

- The base rules engine should model the original multiplayer game structure first.
- Solo behavior should be added as a separate automa/system layer.
- Any official solo rules found later should be ingested and reconciled with the custom automa plan.

## 2026-05-23: Treat TTS card metadata as verification-only

Tabletop Simulator workshop data may be used to build a checklist for character-card rule/effect verification and to preserve visual reference material, but it is not canonical game content and must not be treated as final app assets.

Reason:

- The user needs the full character list and effects to check edge cases.
- Public rule summaries do not expose the full 54-card list as clean text.
- TTS saves can contain copyrighted card images and community-added notes.

Consequences:

- The metadata extraction stores only text needed for rule/effect verification.
- Reference images may live under `docs/llm-sources/` only as raw source material.
- Raw TTS save binaries are not stored in the repository.
- Reference images must stay out of `src/assets` until rights or a new original asset pipeline is decided.
- Official card photos, a rulebook, or user-provided scans/photos are still required before final card data is implemented.

## 2026-05-23: Create original replacement card images

Final card images will be newly created original assets with a renewed medieval-fantasy direction, using existing reference images only for layout and style study.

Reason:

- The user wants to avoid copyright risk and treat the digital version as a visual renewal.
- The TTS image crops are useful for understanding card composition but are not final app assets.
- A consistent new art direction will make the app feel intentional rather than like a direct digital copy.

Consequences:

- Source/reference images remain under `docs/llm-sources/` and do not move into `src/assets`.
- A card-art style pilot should be created before generating all card images.
- The final app needs an explicit asset manifest that distinguishes original, placeholder, and reference-only assets.
- Animation work is paused while the base card-art pipeline is decided.

## 2026-05-23: Use configurable AI seats for solo play

The first solo version will allow a total table size from 2 to 5 participants. The local human is one seat, and every other seat is controlled by deterministic AI.

Reason:

- The source rules describe a 2-5 player game, not a separate solo ruleset.
- Simulated player seats preserve normal turn order, shared-market pressure, and end-game timing better than a score-only clock.
- The same engine model can later support hotseat or online humans.

Consequences:

- Setup needs `totalPlayers` from 2 to 5 and an AI difficulty setting.
- AI must dispatch normal legal game actions through the reducer.
- Difficulty changes AI quality and planning depth, not the core game rules.
- AI must use visible information and public memory rather than peeking at hidden deck order.

## 2026-05-23: Separate card definitions from card instances

The engine model will represent shared card data as definitions and physical copies as card instances.

Reason:

- Pearl cards have repeated values and need distinct physical copies in decks, hands, markets, and discards.
- Character cards can move between deck, market, gate, activated area, discard, and diamond-resource zones.
- Deterministic replay and animation need stable instance IDs for each physical card movement.

Consequences:

- Content files define card definitions.
- `GameState` stores card instances and zone membership by instance ID.
- UI and animation can track individual cards even when multiple cards share the same definition.
- Tests should assert both definition counts and instance-zone movement.

## 2026-05-23: Use a 5-card starting hand in the current digital prototype

The current playable prototype deals 5 pearl cards to each player at setup, even though the captured public rule summary did not identify a starting hand.

Reason:

- The user requested playable starting cards for the UI prototype.
- The current app needs meaningful card choices immediately after game start.
- This is a user-directed digital prototype rule, not a verified correction to the captured board-game setup.

Consequences:

- The engine exports `STARTING_PEARL_HAND_SIZE = 5`.
- End-of-turn hand limit remains 5, and human players manually choose excess cards to discard.
- If an official/user-provided rulebook later confirms a different setup, this prototype rule must be reconciled explicitly.

## 2026-05-23: Present character power as score in the UI

The engine may continue using the internal `power` field from earlier rules capture, but the visible Korean UI labels it as `점수`.

Reason:

- The user found `힘` unclear.
- The game outcome is easier to understand as score in the current prototype UI.

Consequences:

- UI text should say `점수`.
- Internal schema names can remain stable until a broader data-model rename is worth the migration.

## 2026-05-26: Execute TTS-derived character effects as prototype rules

The TTS-derived character effect text remains non-canonical source material, but the current playable prototype now executes those documented candidate effects deterministically after explicit user approval.

Reason:

- The user asked why documented effects were not implemented and then requested that all of them be implemented.
- The prototype needs playable coverage for activation effects, reusable pearl-value effects, custom requirements, and AI evaluation before final official verification is available.
- Keeping the effects isolated in engine selectors/reducer logic lets future official corrections replace these interpretations without UI rewrites.

Consequences:

- Candidate effect text is accepted as prototype behavior, not as final official rules.
- Payment planning supports virtual pearl values, pearl value overrides, diamond +1 and candidate diamond -1, and custom TTS requirements.
- `useAbility` is now part of the engine action surface for start-of-turn, during-turn, and after-actions effects.
- Ambiguous target choices use deterministic defaults until the UI adds explicit choice prompts.
- Future official rule ingestion must reconcile these prototype interpretations instead of assuming they are authoritative.

## 2026-05-26: Use staged strategy heuristics for the current normal AI

The current normal solo policy uses deterministic staged heuristics rather than a full search. It separates early engine-building, midgame tempo, and endgame scoring/tiebreaker priorities.

Reason:

- Full card effects now change the value of low-point engine cards, so raw point-first activation and placement made weak choices.
- The strategy guide identifies activation density, reusable pearl values, extra actions, hand repair, and diamond timing as stronger predictors than printed score alone.
- A deterministic heuristic remains easier to test and debug than a rollout AI while the card text is still prototype/candidate data.

Consequences:

- The AI values payable engine cards over hard unpayable high-score cards in the opening.
- Activation scoring accounts for effect value, payment cost, extra actions, current stage, 12-point trigger timing, and diamond tiebreakers.
- Pearl collection and discard choices are tied to visible gate requirements instead of generic high/low pearl values.
- The policy remains a normal-difficulty heuristic; hard/expert AI should be separate future work with bounded lookahead or rollouts.

## 2026-05-26: Correct prototype deck composition and discard behavior

The current prototype treats pearl values 1-8 as 8 physical cards each, models refresh pearl variants for values 3, 4, and 5, and keeps discarded character cards out of the character draw pile.

Reason:

- The user corrected the previous 7-copy pearl assumption.
- The user clarified that refresh pearl cards should immediately replace open character cards when they enter the open pearl row.
- The user clarified that discarded character cards should not return to the character deck.
- The previous fixture multiplied every character definition by 9, which created far too many character cards for play.

Consequences:

- `src/game/content/pearls.ts` defines 8 cards per pearl value and separate refresh definitions.
- `src/game/engine/reducer.ts` refreshes the character market when refresh pearls are revealed during play.
- Character discards are terminal for the character draw pile under the current prototype.
- The fixture character deck uses every captured character entry as exactly one physical card unless a later official source proves otherwise.

## 2026-05-27: End the game after the current 12-point round

When a player first reaches at least 12 score, the game does not end immediately and does not create an extra full final round. The current round finishes, then the player with the highest score wins; diamonds remain the current tiebreaker.

Reason:

- The user clarified that the winner is determined from the round in which 12 points appears.
- Immediate ending incorrectly prevented later players in the same round from overtaking the first 12-point player.
- An extra final round also exceeds the corrected timing.

Consequences:

- The reducer enters `finishCurrentRound` on the first 12+ activation.
- When turn order advances into the next round, the reducer immediately sets `gameOver` and ranks winners.
- Strategy and AI should evaluate whether triggering 12 now is safe against the remaining players in the current round.

## 2026-05-27: Tune Expert as deterministic heuristic AI with denial

Expert difficulty now uses the same deterministic reducer actions as other AI seats, but applies stronger heuristic weights for public-information denial, endgame pressure, opponent-gate discard effects, and contested market cards. It remains a deterministic heuristic policy, not a rollout/expectimax implementation.

Reason:

- The user requested hardest-difficulty playthrough verification now, before a full rollout AI exists.
- The current prototype needs challenging play while card data is still candidate/prototype data.
- Batch simulation showed that over-denial can stall games, so Expert must still prioritize building its own gate and activation path.

Consequences:

- `chooseAiAction` now reads the configured difficulty.
- Hard/Expert can take denial pearls or characters when opponent value is high.
- Expert fills empty gate slots before denial to preserve game progress.
- Future rollout/expectimax AI can replace this policy later without changing engine rules.
