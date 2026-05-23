# AGENTS.md

This repository is shared across LLM coding sessions.

Read these files before making substantial changes:

1. `README.md`
2. `CLAUDE.md`
3. `docs/llm-wiki/schema.md`
4. `docs/llm-wiki/index.md`
5. `docs/llm-wiki/log.md`
6. `docs/llm-wiki/session-log.md`

## Working Rules

- Do not assume the exact rules of "몰타의 관문" unless they are documented in this repository.
- Keep game logic deterministic and isolated from UI code.
- Do not add a backend or database for the initial version.
- Prefer static, local assets and local browser persistence.
- Update the LLM wiki when introducing architecture, conventions, or major decisions.
- Keep implementation changes small enough to test.
- Preserve raw source material in `docs/llm-sources/` when the user asks to ingest or remember a source.
- Keep `docs/llm-wiki/index.md` and `docs/llm-wiki/log.md` current when maintaining the wiki.

## Source Of Truth

- Code is the source of truth for behavior.
- `docs/llm-wiki/decisions.md` is the source of truth for major technical decisions.
- `docs/llm-wiki/session-log.md` is the source of truth for work history.
