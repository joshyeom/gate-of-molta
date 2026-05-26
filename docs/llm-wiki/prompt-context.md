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

### 2026-05-23 14:30 KST - Commit Baseline And Continue

**User Prompt**

> 모두 커밋 진행하고 그 다음 작업을 이어서하자

**Intent**

- Commit the current documentation baseline.
- Continue with the next planned project task instead of stopping at the commit.

**Outcome**

- Created the root commit `3782e70 docs(project): initialize LLM wiki and architecture`.
- Started the next planning step by adding roadmap and MVP documents.

**Bottleneck / Reflection**

- The next implementation blocker is still real rule capture.
- Planning can continue, but gameplay code should not begin until `rules.md` is filled with verified rules.

### 2026-05-23 14:55 KST - Rule Explanation Links

**User Prompt**

> https://www.wingboardgame.com/2022/08/blog-post_65.html https://boardlife.co.kr/bbs_detail.php?tb=info_movie&bbs_num=697
>
> 룰 설명문들을 2개 가져왔어 여기서 파악해줘

**Intent**

- Use two external rule explanation sources to understand "몰타의 관문".
- Start filling the rule knowledge needed before game-engine implementation.

**Outcome**

- Used the WING Board Game article to capture components, setup, turn flow, actions, diamonds, abilities, and end-game timing.
- Recorded the BoardLife source as inaccessible from the agent environment due to a Cloudflare challenge.
- Updated `rules.md` with implementation notes and open questions.

**Bottleneck / Reflection**

- The core loop is now visible, but card-level data is still missing.
- Solo play is not described by the accessible source, so the digital solo mode needs custom automa design unless an official solo source appears.
- Future prompts should provide card photos, rulebook scans, or a BoardLife transcript/screenshots for blocked content.

### 2026-05-23 15:10 KST - YouTube Rule Confirmation

**User Prompt**

> 마지막으로 https://youtu.be/W4Kvwuab_vY?si=Q0oPoBUT_q6AswUb 해당 유튜브를 분석해서 다시한번 확인해줘

**Intent**

- Use a Korea Boardgames YouTube introduction video as a final cross-check for the captured rules.
- Confirm whether the WING article extraction missed important implementation details.

**Outcome**

- Confirmed that the video largely matches the WING rule explanation.
- Added pearl-card distribution: numbers 1-8, 7 cards of each number.
- Confirmed that players start with only their gate card; no starting hand/resource distribution was identified.
- Kept card-level abilities and official solo rules as open gaps.

**Bottleneck / Reflection**

- YouTube auto-captions were imperfect, so only high-confidence points were added.
- The video is an overview, not a complete card database.
- The next source should be card photos, a rulebook PDF, or manual entry of card effects.

### 2026-05-23 15:40 KST - Character Metadata For Verification Only

**User Prompt**

> 전체 인물 카드 목록이 필요한데, fetch로 검색해서 등록되어있는지 확인해줘
>
> 그럼 룰 효과 검증용으로만 가져오게끔 해줘

**Intent**

- Find whether the full character-card list or effects are registered online.
- Use online data only as a rule/effect verification aid, not as final app assets or canonical card data.

**Outcome**

- Found BoardLife entries for card Koreanization/reference files, but their attachments require login.
- Found a Korean Tabletop Simulator workshop save with 54 character-card objects and text notes.
- Added a sanitizer script that extracts only card IDs, activation requirement text, and effect-note text.
- Generated `docs/llm-sources/2026-05-23-tts-character-verification.json` as a verification-only checklist.

**Bottleneck / Reflection**

- The TTS source can help identify edge cases, but it is not official.
- Power values, diamond rewards, card names, and final effects still need verification from official cards or user-provided photos/scans.

### 2026-05-23 16:05 KST - TTS Image Assets As References

**User Prompt**

> 이미지 에셋도 일단 가져와줘 왜냐하면 에셋을 토대로 새롭게 만드려고 하거든

**Intent**

- Preserve the TTS image assets locally so they can be studied while creating new original assets.
- Keep the source material separate from final app assets.

**Outcome**

- Added `scripts/download-tts-reference-assets.mjs`.
- Downloaded 21 unique reference images into `docs/llm-sources/2026-05-23-tts-reference-assets/`.
- Generated a manifest that records source URLs, source contexts, file sizes, and reference-only status.

**Bottleneck / Reflection**

- The downloaded images are large source references, about 126 MB total.
- They should be used for visual analysis and replacement-asset planning, not shipped as final app assets unless rights are confirmed.

### 2026-05-23 16:15 KST - Split Card Sheets Into Crops

**User Prompt**

> sheet face가 보면은 9장씩 그리드로 붙어있는데 모두 한 카드씩 떼어서 정리해줄래?

**Intent**

- Convert card-sheet reference images into individually inspectable card reference files.

**Outcome**

- Added `scripts/split-tts-card-sheets.mjs`.
- Split 8 face sheets into 67 card crops under `docs/llm-sources/2026-05-23-tts-card-crops/`.
- Generated a manifest with source sheet, grid, row/column, and crop geometry.

**Bottleneck / Reflection**

- Seven sheets were 3x3, but the final face sheet was 2x2, so the result is 67 crops rather than 72.
- The crops are still reference/source material only.

### 2026-05-23 16:35 KST - Review HTML Rewards And Duplicate Grouping

**User Prompt**

> 각 카드 점수도 함께 넣어줘
>
> 보상이 점수와 다이아일 수 있어 그것도 적어줘
>
> 동일한카드는 묶어서 옆에 놔줘

**Intent**

- Make the card review page useful for checking rewards, not only cost/effect/image matching.
- Place duplicate or matching candidate cards together so repeated cards can be reviewed quickly.

**Outcome**

- Added candidate `power` and `diamonds` values to the verification JSON.
- Updated `review.html` to show point and diamond rewards.
- Sorted cards by matching cost/effect/reward signatures and marked duplicate candidate groups.

**Bottleneck / Reflection**

- Reward values were read from reference images, so they remain verification candidates.
- The current duplicate grouping is based on normalized cost/effect/reward signatures, not official card names.

### 2026-05-23 16:50 KST - Original Card Images Direction

**User Prompt**

> 그럼 이건 잠깐 하지말고, 각 카드 이미지를 새로 뽑아야해 비슷한 중세 풍이지만, 저작권 및 새롭게 리뉴얼한다는 생각으로 추가해보려고 해

**Intent**

- Pause animation/frame planning for now.
- Establish that final card images should be newly created original assets.
- Keep the mood close to medieval fantasy while avoiding direct copying and reducing copyright risk.

**Outcome**

- Added `assets.md` to define the replacement-asset direction and card-art pipeline.
- Updated architecture and decisions so final card art is treated as original runtime material, not copied reference imagery.
- Kept TTS crops and downloaded images under `docs/llm-sources/` as reference-only material.

**Bottleneck / Reflection**

- A one-card style pilot is needed before generating all card images.
- The visual style guide, prompt grammar, and asset dimensions are still open.

### 2026-05-23 17:38 KST - Separated Original WebP Batch

**User Prompt**

> asset 이미지가 있는데 저화질이야, 고화질로 모두 변경해서 뽑아줘
>
> 아니야 전부 새롭게 만들어야 해 webp로 만들어줘 각각 구분된것들을 말하는거야

**Intent**

- Replace the separated card crops with newly created assets rather than upscaling them.
- Produce individual WebP files for each separated card reference.

**Outcome**

- Added `scripts/generate-original-card-webp.mjs`.
- Generated 67 individual original WebP replacement assets in `assets/cards/original-webp/`.
- Preserved source crop basenames and added `manifest.json` mapping each output to the reference crop and any available verification-only candidate metadata.
- Added `review.html` and `contact-sheet.webp` for local visual inspection.

**Bottleneck / Reflection**

- The generated batch is a deterministic symbolic art pass, not final rich illustration.
- Candidate card IDs, requirements, power, and diamond values are still verification-only and should not be treated as official card data.

### 2026-05-23 18:10 KST - Pearl Card Source Subset

**User Prompt**

> crop 이미지에서 진주 이미지들만 먼저 확인해줘
>
> 아하 진주카드가 없네, 진주 카드를 steam에서 source에서 뽑아온곳에서 가져와줘

**Intent**

- Identify the pearl cards within the existing cropped Steam/TTS source material.
- Make the pearl-card source crops easy to access with clear filenames instead of sheet row/column names.

**Outcome**

- Added `scripts/extract-tts-pearl-card-crops.mjs`.
- Cropped 11 visible pearl-card variants directly from the Steam/TTS source card sheets into `docs/llm-sources/2026-05-23-tts-pearl-card-crops/`.
- Named the outputs by value, including `pearl-1.jpg` through `pearl-8.jpg` and refresh variants for 3, 4, and 5.
- Added `manifest.json`, `review.html`, and `contact-sheet.jpg` for traceability and quick inspection.

**Bottleneck / Reflection**

- These files are still Steam/TTS-derived reference material, not final runtime assets.
- The source confirms visible variants, but final deck composition and icon semantics still need official/user verification before gameplay implementation.

### 2026-05-23 18:25 KST - Pearl Crop Readability Enhancement

**User Prompt**

> 현재 이미지를 그냥 원본 그대로인데 화질만 개선해줘 지금은 좀 뿌옇게 되어있어

**Intent**

- Keep the same pearl-card visual content, not newly generated replacement art.
- Improve readability by reducing the blurry feel of the cropped source images.

**Outcome**

- Added `scripts/enhance-tts-pearl-card-crops.mjs`.
- Generated 2x sharpened JPEG derivatives under `docs/llm-sources/2026-05-23-tts-pearl-card-crops/enhanced/`.
- Preserved the original crop files unchanged and kept the enhanced files as reference-only derivatives.
- Adjusted the crop script so regenerating base pearl crops does not delete the enhanced folder.

**Bottleneck / Reflection**

- The enhancement improves apparent sharpness and resolution but cannot recover detail absent from the source scan.
- The enhanced files still inherit the same Steam/TTS-derived reference-only status.

### 2026-05-23 18:35 KST - Pearl Restoration Prompt Correction

**User Prompt**

> 아 이미지를 새로 생성해야해 원본 그대로인데 화질을 개선된 버전으로
>
> 아니야 생성모델로 하는데, 프롬프트를 잘써서 되게끔 변경해줘=

**Intent**

- Use an image generation model, not only deterministic ImageMagick sharpening.
- Preserve the original pearl-card identity and layout while prompting the model to generate a cleaner, higher-quality restoration.

**Outcome**

- Added `scripts/build-pearl-imagegen-prompts.mjs`.
- Generated `imagegen-prompts/prompts.json` and `imagegen-prompts/prompts.md`.
- The generated prompts specify image-to-image restoration, high input fidelity, low creativity, exact card value, exact corner numerals, inverted bottom numerals, medallion appearance, border/frame invariants, and refresh icon constraints.

**Bottleneck / Reflection**

- Generative models can still distort small numerals and icons, so each generated output must be manually verified.
- Prompting should treat each pearl card as a separate edit target rather than asking one model call to redraw all cards at once.

### 2026-05-23 18:45 KST - Pearl 1 Generation Trial

**User Prompt**

> 아니 이미지 생성한겨?
>
> 펄 1만 해봐라 먼저

**Intent**

- Confirm that a real generated output is produced, not only a prompt.
- Limit the first generation attempt to `pearl-1.jpg`.

**Outcome**

- Used the visible `pearl-1.jpg` crop as the image-to-image edit target.
- Generated one restoration trial and saved it as `docs/llm-sources/2026-05-23-tts-pearl-card-crops/generated-imagegen/cards/pearl-1.png`.
- Added a generated-image manifest and README.

**Bottleneck / Reflection**

- The generation should be reviewed manually before batch-generating the remaining pearl cards.
- The generated trial remains reference-only unless rights are confirmed.

### 2026-05-23 18:43 KST - Implementation Planning After Roles

**User Prompt**

> 이제 role들이 설정되었기 때문에 게임 구현 기획을 진행해줘

**Intent**

- Move from source capture and asset preparation into concrete game implementation planning.
- Use the newly established roles/workstreams to define who owns rules, engine, UI, solo, effects, assets, and QA concerns.

**Outcome**

- Added `docs/llm-wiki/implementation-plan.md`.
- Connected the new plan from `index.md`, `roadmap.md`, and `mvp.md`.
- Clarified that scaffolding, type shells, tests, and fixture-driven UI may start before full card verification, but final gameplay behavior still requires verified card data or explicit custom solo rules.

**Bottleneck / Reflection**

- The first runnable app can start now, but full gameplay remains constrained by card verification, pearl refresh edge cases, draw pile exhaustion, and solo/automa design.
- The safest next prompt is to approve scaffolding with fixture-only content or to choose the solo model first.

### 2026-05-23 18:52 KST - Player Count And AI Difficulty Planning

**User Prompt**

> 인원은 2명부터 5명까지 설정할 수 있게 해주고, 난이도도 설정할 수 있게 하려고 해 각 난이도는 어떻게 나눌 수 있을지 기획하고 설명해줘 예를들어, 쉬움 난이도 AI는 그리디 알고리즘만 사용한다던가 고급은 다르게한다던가?

**Intent**

- Define configurable player count for the digital solo setup.
- Design AI difficulty levels by algorithmic behavior rather than arbitrary stat bonuses.

**Outcome**

- Added `docs/llm-wiki/solo-mode.md`.
- Defined first-release setup as 2-5 total participants, one human, and AI seats for the rest.
- Split AI difficulty into Easy, Normal, Hard, and Expert using planning depth, heuristic richness, blocking behavior, public-memory use, and probabilistic rollouts.
- Updated rules, implementation plan, decisions, index, and logs.

**Bottleneck / Reflection**

- Easy and Normal can be implemented early with fixture data.
- Hard and Expert should wait for verified card effects, public-memory fixtures, and performance budgets.

### 2026-05-23 18:58 KST - Engine Model Planning

**User Prompt**

> 진행해줘

**Intent**

- Continue from the proposed next step: planning `GameState`, `GameAction`, and `SetupOptions`.
- Produce implementation-ready contracts before writing TypeScript code.

**Outcome**

- Added `docs/llm-wiki/engine-model.md`.
- Defined setup options for 2-5 total participants, one human player, AI difficulty, seed, start-player mode, and content mode.
- Drafted card definition/instance separation, player zones, deck/market zones, turn/endgame state, public actions, payment plans, events, selectors, validation rules, and the first engine implementation slice.
- Updated index, architecture, implementation plan, decisions, logs, and session notes.

**Bottleneck / Reflection**

- This unlocks code scaffolding and engine type shells.
- Activation/card effects still need verified card data before final gameplay behavior can be implemented.

### 2026-05-23 19:24 KST - App Scaffold And Engine Slice

**User Prompt**

> ㄱㄱ

**Intent**

- Move from planning into code.
- Create the actual frontend scaffold and initial deterministic engine implementation.

**Outcome**

- Added Vite React TypeScript project files and npm scripts.
- Installed dependencies with approved network access after the sandboxed install failed.
- Implemented fixture content, deterministic seeded setup, basic reducer actions, selectors, a minimal AI action policy shell, and a basic board UI.
- Added Vitest coverage for setup, deterministic markets, basic actions, invalid inactive-player actions, legal actions, and turn rotation.
- Verified `npm test`, `npm run build`, dev server startup, and local HTTP response.

**Bottleneck / Reflection**

- Binding the local dev server required elevated execution permission.
- The current engine intentionally stops before activation/payment/card effects because final card data remains unverified.

### 2026-05-23 20:06 KST - Card Table UI Shift

**User Prompt**

> 일단 UI가 가장먼저 시급하게 변경되어야겠어
>
> 1. 처음에는 게임 시작하기, 설정하기 등으로 오프닝 페이지가 있어야겠어
> 2. 게임은 자기 카드만 보여야하고, 턴제 게임으로 자동으로 넘어갔으면 좋겠어
> 3. [Image #1] 이런식으로 내카드만 보이고 상대방 카드들은 안보이게 하고 카드를 직접 눌러서 선택할 수 있게 만들어줘
> 4. 카드들은 각 frame이 있어야해 지금은 gate에 그냥 뱃지 형태로 들어가는데 안돼 각 인원들 gate 필드도 필요해
> 5. 마지막으로 한국어로 모두 변경해줘
> 6. 또한, end turn, AI turn 같은 건 없고 알아서 진행되게끔 하되, AI는 행동을 한턴당 5초의 딜레이가 있게끔 진행해줘

**Intent**

- Prioritize the gameplay presentation and interaction model before deeper rules work.
- Move away from debug-dashboard UI toward a card-table game screen.

**Outcome**

- Added Korean opening, settings, and game screens.
- Hid opponent hands and gate card identities behind card backs/counts.
- Added framed cards, local hand, local gate slots, opponent gate fields, and direct card clicking.
- Removed visible end-turn and AI-turn controls from the UI.
- Added automatic human turn transition after 3 actions and automatic AI full-turn execution after a 5-second delay.
- Verified tests, production build, and local dev-server response.

**Bottleneck / Reflection**

- The UI now matches the intended direction better, but still uses fixture cards and CSS-only placeholder frames.
- Real card detail overlays, payment selection, activation flow, and animation choreography are the next UI blockers.

### 2026-05-23 23:49 KST - Starting Hand And Table Seating Corrections

**User Prompt**

> 1. 처음 시작도 카드가 필요한데?
> 2. 시작 시 카드가 5장이 필요하고 턴 종료시에 5장이 넘으면 버리게끔 해줘
> 3. 관문 카드는 항상 보여야해
> 4. 최하단 턴처리 및 설정 섹션은 삭제해줘
> 5. 카드를 픽하거나 교체할 때 인터렉션을 확실히 넣어줘
>
> 1. 힘이뭐야...? 점수 아니야? 힘이 뭔지 모르겠어
> 2. 열린 인물은 항상 2개야
> 3. AI 위치가 상위 2개에 있는데 테이블에 있는 것처럼 나는 하단 가로로 나머지는 테이블에 앉아있는 것처럼 각 변에 앉아있게끔 변경해줘

**Intent**

- Correct the first playable UI based on direct screen review.
- Make the screen feel like a card table rather than a debug layout.
- Clarify labels and make turn-end card management playable.

**Outcome**

- Dealt 5 starting pearl cards to every player in the engine setup.
- Added a discard-to-5 human interaction after the final action and kept AI discard automatic.
- Added always-visible gate-card frames.
- Removed the bottom status/settings bar from the game screen.
- Added clearer selected/discard/replacement visual states.
- Renamed visible `힘` labels to `점수`.
- Expanded fixture character instances to 54 cards so the open character market remains at 2 cards in prototype play.
- Repositioned opponent seats around the table with the human player anchored across the bottom.
- Verified `npm test`, `npm run build`, and the local dev server response.

**Bottleneck / Reflection**

- The 5-card starting hand is a user-directed prototype rule because the captured public rules did not identify a starting hand.
- The UI is still CSS-placeholder art; card-detail, activation/payment, and final animation flows remain the next blockers.

### 2026-05-23 23:56 KST - Opponent Gate Visibility And Turn Header Removal

**User Prompt**

> 상대방 관문카드가 제대로 보여야돼 너무 작아 뒤집어져있는걸 보이게해줘 그리고 나의 차례가 너무 커 해당 섹션을 삭제해줘

**Intent**

- Improve table readability after the first seating-layout pass.
- Make opponent gate cards visible as actual card objects, not tiny labels.
- Remove the large central turn banner that was taking too much table space.

**Outcome**

- Removed the central turn-status header from the game screen.
- Changed opponent gate display to a larger face-down gate-card frame inside each opponent seat.
- Adjusted the table grid so the market uses the freed space.
- Verified `npm test`, `npm run build`, and local dev-server response.

**Bottleneck / Reflection**

- Active-turn visibility now depends mostly on opponent-seat highlight and interaction state; a smaller active-seat badge can be added later if needed.

### 2026-05-24 00:06 KST - Online Card Game UI Readability Pass

**User Prompt**

> [Image #1] 이게 지금 구현된 UI인데 타 온라인 카드게임과 비교하여 잘못된 UI/UX를 모두 알려줘
>
> 고쳐봐

**Intent**

- Turn the critique into concrete UI implementation.
- Improve turn readability, action affordance, player comparison, and card-game presentation without inventing undocumented rules.

**Outcome**

- Added a compact turn HUD with active player, remaining actions, action pips, and latest message.
- Added a score strip for quick comparison across all seats.
- Added active-seat badges and clearer disabled/available action states.
- Replaced card-shaped deck controls with action buttons for pearl deck, character deck, and pearl-market refresh.
- Added market markers and per-card action chips so clickable cards show their immediate action.
- Tuned layout, card sizing, hand emphasis, and empty/opponent slot prominence.
- Verified tests, production build, dev-server startup, and local HTTP response.

**Bottleneck / Reflection**

- The screen is now better at showing state and available actions, but card-detail overlays and activation/payment UI remain the next major UX blockers.

### 2026-05-24 00:15 KST - Arena Feel Clarification

**User Prompt**

> [Image #1] 난 사실 이런느낌을 원했어

**Intent**

- Clarify that the desired UX reference is a dramatic online card-game arena rather than a clean board-game dashboard.
- Move closer to a Hearthstone-like composition while keeping the implementation original.

**Outcome**

- Reworked the game screen around an arena shell.
- Added top opponent command, hidden hand fan, central battlefield, bottom local hero, fanned local hand, and right-side action/resource rail.
- Strengthened card hover/selection with green glow and raised hand-card motion.
- Reduced framed-dashboard panels in favor of visual board surfaces.
- Verified tests, production build, and local dev-server response.

**Bottleneck / Reflection**

- The composition is closer to the target feel, but final quality still depends on original illustrated board/card assets, card-detail overlays, and animation.

### 2026-05-24 00:19 KST - Arena Layout Breakpoint Fix

**User Prompt**

> [Image #1] 이게뭐야... ㅠ

**Intent**

- Report that the arena pass rendered as a broken overlap, with rail/cards stacked on the left instead of a full battlefield.

**Outcome**

- Identified the broad responsive breakpoint as the likely cause.
- Narrowed the stacked mobile layout to small mobile widths.
- Clamped arena, action rail, market-card, hero, and hand-card dimensions so the desktop arena remains inside the viewport.
- Verified tests, production build, and local dev-server response.

**Bottleneck / Reflection**

- No local browser screenshot tool is installed, so final visual confirmation still depends on the user or a future browser automation setup.

### 2026-05-24 00:24 KST - Fixed Stage Arena Correction

**User Prompt**

> [Image #1] 진짜 장난하냐고

**Intent**

- Escalate that the prior layout fix was still broken and unacceptable.

**Outcome**

- Replaced the responsive/staking arena approach with a fixed-fit 16:9 stage.
- Major regions now use absolute positioning to avoid rail/card/panel overlap.
- Action rail is fixed to the right, player hand is fixed to the bottom, battlefield is fixed in the center, and opponent command is fixed to the top.
- Verified tests, production build, and local dev-server response.

**Bottleneck / Reflection**

- Future UI layout changes need screenshot verification before being presented as done.

### 2026-05-24 02:49 KST - Browser-Verified UI Repair And Asset Wiring

**User Prompt**

> 개쓰브랄 브라우저로 너가 직접확인하면서 개선해줘
>
> 그리고 여기에 각 이미지 에셋이 있으니 맞게 사용하도록 해
>
> 더 묻지말고 바로 진행해줘 계속해서

**Intent**

- Require direct browser verification instead of inferred CSS fixes.
- Use the available image assets in the actual game UI.

**Outcome**

- Added Playwright as a dev dependency for local browser screenshots.
- Used cached Chromium to capture the game screen and inspect computed layout boxes.
- Found that the arena width was correct but the old `.game-screen` grid template was still shifting it left.
- Reset the stale grid template and verified the arena, rail, battlefield, player command, and hand positions.
- Copied temporary pearl and character image assets into `src/assets/cards/`.
- Updated `GameCard` to resolve pearl art by card value and render character placeholder art.
- Verified with screenshots and bounding checks at 1440x900, 2048x1152, and 1280x720, plus tests and build.

**Bottleneck / Reflection**

- The temporary PNG assets are large and should be optimized before production.

### 2026-05-24 01:08 KST - ImageGen Output Names

**User Prompt**

> 근데 이거 문제가 이미지 이름이 제대로 안들어가 있어 이걸 확인해서 모두 이름을 제대로 넣어줘

**Intent**

- Replace source sheet-position output names with review-friendly names for the generated card images.
- Ensure both character cards and pearl cards can be identified from filenames and manifest metadata.

**Outcome**

- Added `scripts/build-imagegen-card-named-copies.mjs`.
- Created 67 named copies in `docs/llm-sources/2026-05-23-tts-card-crops/generated-imagegen/named-cards/`.
- Updated the generated card manifest with `assetName`, `displayName`, `namedFileName`, source mapping, candidate metadata, pearl values, hashes, and duplicate relationships.
- Added `named-review.html` for browser review.
- Corrected the pearl generated manifest so it records all 11 generated pearl outputs instead of only the first trial.

**Bottleneck / Reflection**

- Official character card names are not verified in the repository, so filenames use candidate IDs, activation requirements, power, and diamond counts rather than canonical Korean names.

### 2026-05-24 12:30 KST - Character Detail And Opponent Gate Rail

**User Prompt**

> 1. 카드에 이름을 붙이지말고 카드 이미지 자체를 넣어준 뒤에 각 인물카드의 상세설명을 볼 수 있는 장치를 넣어줘
>
> 2. [Image #2] 이쪽에 이런 데이터보다 상대방들의 관문 카드를 볼 수 있게금 변경해줘
>
> 좋은데 이미지가 제대로 꽉차게 나오지 않고 있어 또한, 각 인물 효과들이 들어있는 html 혹은 md파일이 있을거야 확인해줘

**Intent**

- Make card faces image-first, without extra visible labels on top of the art.
- Provide a clear way to inspect character details.
- Use the right rail for opponent gate visibility instead of deck/action data.
- Find existing local character effect metadata and wire it into the detail view.
- Fix image aspect ratio so restored card images fill their UI frames.

**Outcome**

- Hid visible title/meta overlays inside card faces and kept labels only as accessibility text.
- Added a small inspect marker to character cards and a character detail overlay.
- Moved deck/refill actions to compact arena buttons.
- Removed the right rail after the user clarified that direct fields should be emphasized.
- Added per-player field sections with separate `관문` and `활성 인물` areas.
- Found effect metadata in `docs/llm-sources/2026-05-23-tts-character-verification.json` and review markup in `docs/llm-sources/2026-05-23-tts-card-crops/review.html`.
- Expanded runtime character fixtures to the 54 generated named-card candidates and added candidate effect notes where present.
- Changed card/detail-preview aspect ratios to match the generated image dimensions.
- Verified with Playwright screenshots and with `npm test` / `npm run build`.

**Bottleneck / Reflection**

- The effect metadata is still a TTS-derived verification candidate, not an official final card database.
