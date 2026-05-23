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
| [roadmap](roadmap.md) | Staged work plan from project memory through online readiness | Active |
| [mvp](mvp.md) | First playable version scope, non-scope, and acceptance criteria | Active |
| [decisions](decisions.md) | Durable decisions and consequences | Active |

## Rules And Content

| Page | Purpose | Status |
| --- | --- | --- |
| [rules](rules.md) | Capture template for the actual "몰타의 관문" rules | Needs source material |

## Retrospective Logs

| Page | Purpose | Status |
| --- | --- | --- |
| [session-log](session-log.md) | Human-readable session journey notes | Active |
| [prompt-context](prompt-context.md) | User prompt archive with intent, outcomes, and bottlenecks | Active |

## Raw Sources

| Source | Purpose | Ingested |
| --- | --- | --- |
| [LLM Wiki pattern](../llm-sources/2026-05-22-llm-wiki-pattern.md) | User-provided source describing persistent LLM-maintained wikis | 2026-05-22 |

## Current Design Pillars

- Browser-only first release
- No backend and no external database
- Pure TypeScript game engine
- Static card/content manifest
- Event-driven animation layer
- Local save support through browser storage
- Future online support through deterministic state/action design
- Prompt context logging for retrospectives
- LLM-maintained persistent wiki with raw sources, schema, index, and log
- Rule capture before gameplay implementation
- MVP loop before production-level animation polish

## Known Gaps

- The exact "몰타의 관문" rulebook has not been captured yet.
- Card list, card effects, board layout, and solo-mode algorithm are not defined yet.
- Visual identity, asset dimensions, and animation timing standards are not defined yet.
- Prompt timestamps are approximate unless a future tool or workflow records exact message times.
