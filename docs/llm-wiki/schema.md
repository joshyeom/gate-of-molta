# LLM Wiki Schema

This file adapts the LLM Wiki pattern to Gate of Molta.

The source idea is preserved at `../llm-sources/2026-05-22-llm-wiki-pattern.md`.

## Layers

### Raw Sources

Raw sources live in `docs/llm-sources/`.

Rules:

- Treat raw sources as immutable source material.
- Do not rewrite raw sources during wiki maintenance.
- If a source needs correction, add a new source or a note in the wiki rather than editing the original.
- Sources may include rulebook notes, copied references, prompt documents, research, visual references, and user-provided design material.

### Wiki

The generated wiki lives in `docs/llm-wiki/`.

Rules:

- The LLM owns this layer and may update it as project understanding changes.
- Keep pages short, linked, and purpose-specific.
- Prefer synthesis over raw copying.
- Update related pages when new information changes the project model.
- Flag contradictions instead of silently overwriting older claims.

### Schema

The schema is maintained through:

- `CLAUDE.md`
- `AGENTS.md`
- `docs/llm-wiki/schema.md`
- `docs/llm-wiki/workflows.md`

These files define how future agents should operate.

## Canonical Files

| File | Role |
| --- | --- |
| `docs/llm-wiki/index.md` | Content-oriented catalog of wiki pages and important raw sources |
| `docs/llm-wiki/log.md` | Chronological append-only operation log |
| `docs/llm-wiki/session-log.md` | Human-readable session journey notes |
| `docs/llm-wiki/prompt-context.md` | Prompt archive for retrospectives |
| `docs/llm-wiki/decisions.md` | Durable decisions and consequences |
| `docs/llm-wiki/rules.md` | Captured board-game rules before implementation |
| `docs/llm-wiki/architecture.md` | Technical architecture synthesis |

## Operations

### Ingest

Use when the user provides a source or asks to add source material.

Process:

1. Save the source in `docs/llm-sources/` when it should be preserved verbatim.
2. Read the source and extract durable claims.
3. Update relevant wiki pages.
4. Add or update cross-references in `index.md`.
5. Append an entry to `log.md`.
6. If the source came from a user prompt, update `prompt-context.md`.

### Query

Use when the user asks a question about project knowledge.

Process:

1. Read `index.md`.
2. Read the relevant wiki pages.
3. Read raw sources only when exact wording or verification matters.
4. Answer with citations to local files when useful.
5. If the answer creates reusable synthesis, file it back into the wiki and update `log.md`.

### Lint

Use periodically or when the user asks for a health check.

Check for:

- Contradictions between pages
- Stale claims superseded by newer decisions
- Orphan wiki pages not listed in `index.md`
- Important concepts without their own page
- Missing cross-references
- Rule gaps blocking implementation
- Prompt patterns that repeatedly create confusion

## Index Rules

`index.md` is a catalog, not a narrative essay.

Every listed page should have:

- Link
- One-line purpose
- Status when useful

Organize by category:

- Core docs
- Wiki operations
- Product and architecture
- Rules and content
- Retrospective logs
- Raw sources

## Log Rules

`log.md` is chronological and append-only.

Use this heading format:

```md
## [YYYY-MM-DD] type | Title
```

Recommended `type` values:

- `ingest`
- `query`
- `lint`
- `decision`
- `session`
- `implementation`

Keep entries short:

- What happened
- Files touched
- Follow-up

## Obsidian Compatibility

Use normal Markdown links where possible.

Optional future additions:

- YAML frontmatter for Dataview
- Graph-friendly wiki links
- Local image references for visual research
- Generated slide decks through Marp

Do not add tooling until the wiki is large enough to need it.
