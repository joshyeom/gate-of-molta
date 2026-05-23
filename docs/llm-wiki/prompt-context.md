# Prompt Context Log

This file records user prompts and session context for later reflection.

Purpose:

- Review what the user asked at each step.
- Identify where progress slowed down.
- Track which prompts produced useful direction.
- Preserve project-shaping decisions from the earliest sessions.

Guidelines:

- Preserve the user's prompt in the original language.
- Add concise notes about intent, outcome, and bottlenecks.
- Do not rewrite prompts to make them cleaner.
- If a prompt contains a long source document, preserve the source as a raw file and link to it instead of duplicating the full text here.
- If sensitive information appears later, summarize it instead of copying it verbatim.

## Entry Template

```md
### YYYY-MM-DD HH:mm KST - Short Title

**User Prompt**

> Original prompt here.

**Intent**

- What the user was trying to accomplish.

**Outcome**

- What changed in the project.

**Bottleneck / Reflection**

- What was unclear, slow, risky, or worth improving in future prompts.
```

## 2026-05-22 Session 1

### 2026-05-22 20:00 KST - Project Memory Direction

**User Prompt**

> 안녕 반가워 해당 프로젝트의 첫 세션이야 너는 이제부터 다른 세션들을 위해 여정을 기록하면서 진행할거야 CLAUDE.md, Readme.md 등을 잘 작성해야해 이걸 하기 위해서 LLM wiki를 도입해볼까 하는데 어때?

**Intent**

- Start the first project session.
- Establish that future LLM sessions need durable project memory.
- Consider introducing an LLM wiki alongside `CLAUDE.md` and `README.md`.

**Outcome**

- Decided to use a lightweight project memory structure instead of an overly large wiki.
- Proposed separating human-facing docs, agent-facing docs, and long-term LLM wiki notes.

**Bottleneck / Reflection**

- The project identity was not known yet, so only documentation structure could be discussed.
- Future prompts should include the project purpose earlier when asking for documentation design.

### 2026-05-22 20:00 KST - Repository Identity Check

**User Prompt**

> 그래 좋아 근데 이 프로젝트가 어떤 프로젝트인지 알겠어 혹시?

**Intent**

- Check whether the agent can infer the project from the repository.
- Force a local repository inspection before documentation assumptions are made.

**Outcome**

- Confirmed that the repository was empty except for `.git`.
- Found no commits, source files, README, or existing project metadata.
- Identified the GitHub remote URL.

**Bottleneck / Reflection**

- The repository did not contain enough information to infer the product.
- This prompt usefully prevented the agent from inventing project context.

### 2026-05-22 20:00 KST - Product Definition And Architecture Request

**User Prompt**

> 이 프로젝트는 내가 좋아하는 보드게임인 몰타의 관문을 혼자서 플레이 할 수 있는 프로젝트야 추후에는 온라인도 가능하겠지만, 지금은 DB 없이 오로지 프론트엔드에서 알고리즘, 카드 이미지 에셋, 로직 모두 저장해서 진행할거야
>
> 이 프로젝트에 쟁점은 혼자 하면서도 몰입감 있게 할 수 있게 화려한 애니메이션 효과와 현실감 있는 이미지 등으로 하스스톤과 같게 만드는것이 목표야
>
> 웹페이지로 제작해서 간단하게 만들거야
>
> 설계해줘

**Intent**

- Define the product as a solo web adaptation of "몰타의 관문".
- Set key constraints: frontend-only, no database, local algorithms/assets/logic.
- Set experience target: immersive, animated, Hearthstone-like presentation.
- Ask for technical and project design.

**Outcome**

- Created initial project documentation:
  - `README.md`
  - `CLAUDE.md`
  - `AGENTS.md`
  - `docs/llm-wiki/index.md`
  - `docs/llm-wiki/architecture.md`
  - `docs/llm-wiki/decisions.md`
  - `docs/llm-wiki/workflows.md`
  - `docs/llm-wiki/rules.md`
  - `docs/llm-wiki/session-log.md`
- Established the initial architecture:
  - Vite + React + TypeScript
  - pure TypeScript game engine
  - local static content and assets
  - event-driven animation layer
  - browser-only persistence
  - future online compatibility through deterministic state/action design

**Bottleneck / Reflection**

- The exact board-game rules were not provided, so gameplay implementation could not safely begin.
- The phrase "하스스톤과 같게" sets a strong experience goal, but future prompts should define which parts matter most: card motion, board effects, audio, deck interaction, combat feedback, or reward ceremony.
- A rulebook/card list prompt is the next major unlock.

### 2026-05-22 20:00 KST - Prompt Context Archive

**User Prompt**

> 그리고 이 프로젝트에서 사용된 프롬프트 컨텍스트를 모두 md파일로 저장할거야 내가 어떤 프롬프트를 입력했는지를 추후에 회고하면서 어느 부분에서 병목을 느꼈는지 등을 확인할거야 이것도 작성해줘

**Intent**

- Add a durable prompt archive for retrospective analysis.
- Track user prompts, intent, outcomes, and bottlenecks across sessions.

**Outcome**

- Created this `prompt-context.md` file.
- Added current session prompts and reflections.

**Bottleneck / Reflection**

- The first version uses approximate times because the exact message timestamps are not available from the local repository.
- Future sessions should update this file as prompts arrive, especially after major direction changes or moments of confusion.

### 2026-05-22 20:00 KST - LLM Wiki Pattern Source

**User Prompt**

> The user provided a full "LLM Wiki" idea file and said: "LLM wiki는 이걸 넣으면서 시작할거야"

Full source preserved at `../llm-sources/2026-05-22-llm-wiki-pattern.md`.

**Intent**

- Use the provided LLM Wiki pattern as the starting philosophy and operating model for this project's wiki.
- Move from a simple documentation folder toward a persistent, compounding knowledge base with raw sources, generated wiki pages, schema, index, and log.

**Outcome**

- Preserved the LLM Wiki idea file as an immutable raw source.
- Added `schema.md` to adapt the pattern to Gate of Molta.
- Added `log.md` as a parseable chronological operation log.
- Reworked `index.md` into a content-oriented catalog.
- Updated workflows to include source ingest, wiki updates, and prompt-context maintenance.

**Bottleneck / Reflection**

- The source is abstract by design, so the project needed a concrete local schema.
- The main workflow choice is now explicit: raw sources remain stable, while the LLM-maintained wiki evolves.

### 2026-05-23 14:26 KST - Register Claude /commit As Codex Skill

**User Prompt**

> .claude에 skill에서 /commit 스킬을 찾아서 동일하게 등록해줘

**Intent**

- Reuse the existing Claude `/commit` workflow from the local `.claude` configuration.
- Make an equivalent commit workflow available as an agent skill for Codex/future sessions.

**Outcome**

- Found the source command at `/Users/yeomjeongho/.claude/commands/commit.md`.
- Registered a new global skill at `/Users/yeomjeongho/.agents/skills/commit`.
- Verified that `npx skills list -g --json` lists the new `commit` skill.

**Bottleneck / Reflection**

- The original Claude command is a slash command, not a Codex skill, so it needed skill frontmatter and a `skill.yaml`.
- The existing `ask-commit-assistance` skill is intentionally safer and does not commit; the new `commit` skill preserves the broader issue/branch/PR/squash-merge workflow.
- Home-directory writes required elevated permission.
