# LLM Wiki Index

Content-oriented catalog for the Gate of Molta LLM Wiki.

## Core Docs

| Page | Purpose | Status |
| --- | --- | --- |
| [README](../../README.md) | Human-facing project overview and proposed app structure | Initial |
| [CLAUDE](../../CLAUDE.md) | LLM agent operating rules for Claude-style sessions | Initial |
| [AGENTS](../../AGENTS.md) | LLM agent operating rules for Codex and other agents | Initial |

## Wiki Operations

| Page | Purpose | Status |
| --- | --- | --- |
| [schema](schema.md) | Project-specific LLM Wiki schema, layers, and operations | Active |
| [workflows](workflows.md) | Startup, rule capture, implementation, and documentation workflows | Active |
| [log](log.md) | Parseable chronological operation log | Active |
| [index](index.md) | Catalog of wiki pages and important raw sources | Active |

## Product And Architecture

| Page | Purpose | Status |
| --- | --- | --- |
| [architecture](architecture.md) | Technical architecture for frontend-only solo play | Initial |
| [assets](assets.md) | Original replacement-asset direction and card-art pipeline | Active |
| [roadmap](roadmap.md) | Staged work plan from project memory through online readiness | Active |
| [mvp](mvp.md) | First playable version scope, non-scope, and acceptance criteria | Active |
| [implementation-plan](implementation-plan.md) | Workstream-based execution plan for the first runnable app and engine | Active |
| [solo-mode](solo-mode.md) | Player-count setup and AI difficulty design for solo play | Draft |
| [strategy-guide](strategy-guide.md) | Current prototype strategy guide for play and AI heuristics | Draft |
| [engine-model](engine-model.md) | Draft TypeScript-facing setup, state, action, event, and selector contracts | Draft |
| [decisions](decisions.md) | Durable decisions and consequences | Active |

## Rules And Content

| Page | Purpose | Status |
| --- | --- | --- |
| [rules](rules.md) | Captured implementation-oriented rules for "몰타의 관문" | Partial; card list and solo rules missing |

## Retrospective Logs

| Page | Purpose | Status |
| --- | --- | --- |
| [session-log](session-log.md) | Human-readable session journey notes | Active |
| [prompt-context](prompt-context.md) | User prompt archive with intent, outcomes, and bottlenecks | Active |

## Raw Sources

| Source | Purpose | Ingested |
| --- | --- | --- |
| [LLM Wiki pattern](../llm-sources/2026-05-22-llm-wiki-pattern.md) | User-provided source describing persistent LLM-maintained wikis | 2026-05-22 |
| [Gate of Molta rule links](../llm-sources/2026-05-23-gate-of-molta-rule-links.md) | Source metadata for user-provided rule explanation links | 2026-05-23 |
| [TTS character verification source](../llm-sources/2026-05-23-tts-character-verification-source.md) | Source metadata and policy for TTS-derived character-card verification checklist | 2026-05-23 |
| [TTS character verification JSON](../llm-sources/2026-05-23-tts-character-verification.json) | Sanitized candidate activation/effect metadata for 54 character entries; verification-only | 2026-05-23 |
| [TTS reference assets](../llm-sources/2026-05-23-tts-reference-assets/README.md) | Downloaded TTS image references for visual/card-layout study; not app assets | 2026-05-23 |
| [TTS card crops](../llm-sources/2026-05-23-tts-card-crops/README.md) | Individual card crops split from TTS face sheets; reference-only | 2026-05-23 |
| [Generated ImageGen card restorations](../llm-sources/2026-05-23-tts-card-crops/generated-imagegen/README.md) | AI image-to-image restoration derivatives for all 67 cropped references, including named review copies; reference-only | 2026-05-24 |
| [TTS pearl card crops](../llm-sources/2026-05-23-tts-pearl-card-crops/README.md) | Pearl-card subset with value-based filenames, sharpened readability derivatives, and image-generation restoration prompts; reference-only | 2026-05-23 |
| [Full game history report](../llm-sources/2026-05-26-full-game-history.json) / [readable Markdown](../llm-sources/2026-05-26-full-game-history.md) / [HTML viewer](../llm-sources/2026-05-26-full-game-history.html) | Deterministic auto-play history for seed `full-game-history`, from setup through game over under current prototype effect and strategy-AI rules | 2026-05-26 |
| [Expert 10-game round-end verification](../llm-sources/2026-05-27-expert-10-games-round-end.json) | Batch report for 10 expert-difficulty automated games after correcting the 12-point current-round ending rule | 2026-05-27 |
| [Change visual report](../llm-sources/2026-05-28-change-visual-report.html) | Static HTML visualization of the current rule, UI, AI, and verification changes | 2026-05-28 |
| [UX/rule 10-game audit](../llm-sources/2026-05-28-ux-rule-audit-10-games.json) | Expert AI batch report for 10 games used to check rule invariants and long-play effect coverage during UX review | 2026-05-28 |
| [UX browser audit screenshots](../llm-sources/2026-05-28-ux-browser-audit/README.md) | Playwright screenshot set and notes for desktop 3-player, desktop 5-player, and landscape-mobile 5-player layout review | 2026-05-28 |

## Current Design Pillars

- Browser-only first release
- No backend and no external database
- Pure TypeScript game engine
- Static card/content manifest
- Card definitions separated from physical card instances
- Event-driven animation layer
- Local save support through browser storage
- Future online support through deterministic state/action design
- Prompt context logging for retrospectives
- LLM-maintained persistent wiki with raw sources, schema, index, and log
- Rule capture before gameplay implementation
- MVP loop before production-level animation polish
- Workstream-based implementation plan before app scaffolding
- Configurable 2-5 participant setup with one human plus AI seats for the first solo release
- Draft engine model for setup options, state zones, actions, events, and selectors
- Current prototype deals 5 starting pearl cards and uses manual discard-to-5 for the human player
- Card-table UI anchors the human player at the bottom and distributes AI seats around the table
- Newly created original replacement art for final card assets
- Fixture-rule solo play can now auto-run from setup to game over with deterministic history output
- Current prototype strategy separates early engine-building, midgame tempo, and endgame scoring/tiebreaker priorities
- Current prototype pearl deck uses 8 cards per value and refresh pearl variants for values 3, 4, and 5.
- Current prototype character deck uses every fixture character entry as exactly one physical card.
- Character discards do not reshuffle into the character deck in the current prototype.

## Known Gaps

- The core "몰타의 관문" turn loop has been partially captured from WING Board Game.
- Character-card activation/effect candidates now execute as prototype behavior, but official names, power values, diamond rewards, and final card data remain unverified.
- The exact official character-card list still needs confirmation; the prototype currently treats each captured fixture entry as one physical card.
- The expert solo policy now has difficulty-aware heuristic tuning and batch verification, but it is still heuristic rather than rollout/expectimax AI.
- The fixture-only automated game can complete, but official full gameplay remains incomplete until final card data and effect wording are verified.
- The 5-card starting hand is a user-directed prototype rule and must be reconciled with any later official setup source.
- Visual identity, asset dimensions, and animation timing standards are not defined yet.
- Original card-art style guide and first pilot card are not defined yet.
- Prompt timestamps are approximate unless a future tool or workflow records exact message times.
