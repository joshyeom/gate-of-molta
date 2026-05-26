#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const paths = {
  verification: resolve(
    repoRoot,
    "docs/llm-sources/2026-05-23-tts-character-verification.json",
  ),
  referenceManifest: resolve(
    repoRoot,
    "docs/llm-sources/2026-05-23-tts-reference-assets/manifest.json",
  ),
  cropManifest: resolve(
    repoRoot,
    "docs/llm-sources/2026-05-23-tts-card-crops/manifest.json",
  ),
  output: resolve(
    repoRoot,
    "docs/llm-sources/2026-05-23-tts-card-crops/review.html",
  ),
};

const verification = JSON.parse(await readFile(paths.verification, "utf8"));
const referenceManifest = JSON.parse(await readFile(paths.referenceManifest, "utf8"));
const cropManifest = JSON.parse(await readFile(paths.cropManifest, "utf8"));

const deckToSheet = new Map();
for (const asset of referenceManifest.assets) {
  if (asset.kind !== "card-sheet-face") {
    continue;
  }

  for (const context of asset.contexts) {
    const match = context.path.match(/root\.ObjectStates\[23\]\.CustomDeck\.(\d+)\.FaceURL/u);
    if (match) {
      deckToSheet.set(Number(match[1]), asset.fileName);
    }
  }
}

const sheetGrid = new Map();
for (const crop of cropManifest.cards) {
  if (!sheetGrid.has(crop.sourceSheet)) {
    sheetGrid.set(crop.sourceSheet, crop.grid);
  }
}

function cardImageFor(card) {
  const sourceSheet = deckToSheet.get(card.sourceDeckId);
  if (!sourceSheet) {
    throw new Error(`No source sheet for deck ${card.sourceDeckId}`);
  }

  const grid = sheetGrid.get(sourceSheet);
  if (!grid) {
    throw new Error(`No crop grid for sheet ${sourceSheet}`);
  }

  const row = Math.floor(card.sourceSheetIndex / grid.columns) + 1;
  const column = (card.sourceSheetIndex % grid.columns) + 1;
  if (row > grid.rows) {
    throw new Error(`Card ${card.cardId} exceeds grid ${grid.columns}x${grid.rows}`);
  }

  const sheetBase = basename(sourceSheet, ".jpg");
  return {
    sourceSheet,
    grid,
    row,
    column,
    imagePath: `cards/${sheetBase}-r${row}c${column}.jpg`,
  };
}

const rawCards = verification.characterCards.map((card) => ({
  cardId: card.cardId,
  requirement: card.activationRequirement,
  effect: card.effectNote || "",
  power: card.power,
  diamonds: card.diamonds,
  ...cardImageFor(card),
}));

function normalizeRequirement(requirement) {
  return String(requirement ?? "")
    .replaceAll("'", "")
    .replaceAll(" ", "")
    .replace("6카드2장", "66")
    .replace("합이10이되는", "합하면10이되는");
}

function groupKeyFor(card) {
  return [
    normalizeRequirement(card.requirement),
    card.effect.trim(),
    card.power ?? "unknown-power",
    card.diamonds ?? 0,
  ].join("::");
}

const groupMap = new Map();
for (const card of rawCards) {
  const groupKey = groupKeyFor(card);
  if (!groupMap.has(groupKey)) {
    groupMap.set(groupKey, []);
  }
  groupMap.get(groupKey).push(card);
}

const groups = [...groupMap.entries()]
  .map(([groupKey, groupCards]) => ({
    groupKey,
    cards: groupCards.sort((left, right) => left.cardId - right.cardId),
    minCardId: Math.min(...groupCards.map((card) => card.cardId)),
  }))
  .sort((left, right) => {
    const duplicateBias = Number(right.cards.length > 1) - Number(left.cards.length > 1);
    if (duplicateBias !== 0) {
      return duplicateBias;
    }
    return left.minCardId - right.minCardId;
  });

const cards = groups.flatMap((group, index) =>
  group.cards.map((card, groupIndex) => ({
    ...card,
    groupId: index + 1,
    groupSize: group.cards.length,
    groupIndex: groupIndex + 1,
  })),
);

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>몰타의 관문 인물 카드 매칭 확인</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f2ec;
      --panel: #fffaf1;
      --ink: #24211c;
      --muted: #70685d;
      --line: #d9cbb8;
      --accent: #226b67;
      --warn: #a24e2a;
      --ok: #316d3b;
      --shadow: 0 10px 28px rgba(54, 42, 24, 0.12);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    header {
      position: sticky;
      top: 0;
      z-index: 2;
      border-bottom: 1px solid var(--line);
      background: rgba(245, 242, 236, 0.96);
      backdrop-filter: blur(10px);
    }

    .bar {
      display: grid;
      gap: 12px;
      max-width: 1400px;
      margin: 0 auto;
      padding: 16px 18px;
    }

    h1 {
      margin: 0;
      font-size: 22px;
      line-height: 1.2;
    }

    .meta {
      color: var(--muted);
      font-size: 13px;
    }

    .controls {
      display: grid;
      grid-template-columns: minmax(220px, 1fr) 160px 150px;
      gap: 8px;
      align-items: center;
    }

    input,
    select,
    textarea,
    button {
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fffef9;
      color: var(--ink);
      font: inherit;
    }

    input,
    select {
      min-height: 36px;
      padding: 0 10px;
    }

    button {
      min-height: 32px;
      padding: 0 10px;
      cursor: pointer;
    }

    button[data-next] {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    main {
      max-width: 1400px;
      margin: 0 auto;
      padding: 18px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
    }

    .card {
      display: grid;
      gap: 10px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      box-shadow: var(--shadow);
      padding: 12px;
    }

    .group-header {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-top: 1px solid var(--line);
      padding: 16px 2px 2px;
      color: var(--muted);
      font-size: 13px;
      font-weight: 700;
    }

    .group-header strong {
      color: var(--ink);
      font-size: 15px;
    }

    .card[data-status="ok"] {
      border-color: rgba(49, 109, 59, 0.55);
    }

    .card[data-status="issue"] {
      border-color: rgba(162, 78, 42, 0.65);
    }

    .topline {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
    }

    .id {
      font-size: 17px;
      font-weight: 800;
    }

    .source {
      color: var(--muted);
      font-size: 12px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 22px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 0 8px;
      background: #fffef9;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
    }

    .photo {
      width: 100%;
      aspect-ratio: 660 / 1027;
      object-fit: contain;
      border: 1px solid #cbbca8;
      border-radius: 6px;
      background: #211f1c;
    }

    dl {
      display: grid;
      grid-template-columns: 64px 1fr;
      gap: 6px 8px;
      margin: 0;
      font-size: 14px;
      line-height: 1.45;
    }

    dt {
      color: var(--muted);
      font-weight: 700;
    }

    dd {
      margin: 0;
    }

    .effect {
      min-height: 42px;
    }

    .status {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }

    .status button[aria-pressed="true"][data-value="ok"] {
      background: var(--ok);
      color: white;
      border-color: var(--ok);
    }

    .status button[aria-pressed="true"][data-value="issue"] {
      background: var(--warn);
      color: white;
      border-color: var(--warn);
    }

    .status button[aria-pressed="true"][data-value="unknown"] {
      background: #5f5a52;
      color: white;
      border-color: #5f5a52;
    }

    textarea {
      width: 100%;
      min-height: 58px;
      resize: vertical;
      padding: 8px;
      font-size: 13px;
      line-height: 1.45;
    }

    @media (max-width: 720px) {
      .controls {
        grid-template-columns: 1fr;
      }

      main {
        padding: 12px;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="bar">
      <div>
        <h1>인물 카드 매칭 확인</h1>
        <div class="meta">
          TTS 검증용 메타데이터와 개별 카드 crop을 매칭한 화면입니다. 확인 상태와 메모는 이 브라우저의 localStorage에만 저장됩니다.
        </div>
      </div>
      <div class="controls">
        <input id="search" type="search" placeholder="ID, 비용, 효과 검색">
        <select id="filter">
          <option value="all">전체 보기</option>
          <option value="unknown">미확인만</option>
          <option value="ok">맞음만</option>
          <option value="issue">수정 필요만</option>
        </select>
        <button type="button" data-next>다음 미확인</button>
      </div>
      <div class="meta" id="summary"></div>
    </div>
  </header>
  <main>
    <section class="grid" id="cards" aria-live="polite"></section>
  </main>

  <script>
    const CARDS = ${JSON.stringify(cards, null, 6)};
    const STORAGE_KEY = "gate-of-molta-character-review-v1";

    const state = loadState();
    const cardsEl = document.querySelector("#cards");
    const searchEl = document.querySelector("#search");
    const filterEl = document.querySelector("#filter");
    const summaryEl = document.querySelector("#summary");

    document.querySelector("[data-next]").addEventListener("click", () => {
      const next = [...document.querySelectorAll('.card[data-status="unknown"]:not(.hidden)')][0];
      if (next) {
        next.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });

    searchEl.addEventListener("input", render);
    filterEl.addEventListener("change", render);

    render();

    function loadState() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      } catch {
        return {};
      }
    }

    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      updateSummary();
    }

    function reviewFor(cardId) {
      state[cardId] ||= { status: "unknown", note: "" };
      return state[cardId];
    }

    function render() {
      const query = searchEl.value.trim().toLowerCase();
      const filter = filterEl.value;

      cardsEl.innerHTML = "";
      let lastVisibleGroupId = null;
      for (const card of CARDS) {
        const review = reviewFor(card.cardId);
        const searchable = [
          card.cardId,
          card.requirement,
          card.power,
          card.diamonds,
          card.effect,
          card.sourceSheet,
          card.imagePath,
        ].join(" ").toLowerCase();
        const visibleByQuery = !query || searchable.includes(query);
        const visibleByFilter = filter === "all" || review.status === filter;

        if (visibleByQuery && visibleByFilter && card.groupId !== lastVisibleGroupId) {
          const groupHeader = document.createElement("div");
          groupHeader.className = "group-header";
          const label = card.groupSize > 1 ? \`같은 조건 그룹 \${card.groupSize}장\` : "단일 카드";
          groupHeader.innerHTML = \`<strong>그룹 \${card.groupId}</strong><span>\${label}</span>\`;
          cardsEl.append(groupHeader);
          lastVisibleGroupId = card.groupId;
        }

        const article = document.createElement("article");
        article.className = "card";
        article.dataset.cardId = card.cardId;
        article.dataset.status = review.status;
        if (!visibleByQuery || !visibleByFilter) continue;

        article.innerHTML = cardMarkup(card, review);
        bindCard(article, card);
        cardsEl.append(article);
      }

      updateSummary();
    }

    function cardMarkup(card, review) {
      return \`
      <div class="topline">
        <div class="id">#\${card.cardId}</div>
          <div class="source">\${card.sourceSheet} r\${card.row}c\${card.column}</div>
        </div>
        \${card.groupSize > 1 ? \`<div class="badge">같은 조건 그룹 \${card.groupIndex}/\${card.groupSize}</div>\` : ""}
        <img class="photo" src="\${card.imagePath}" alt="카드 #\${card.cardId} 이미지">
        <dl>
          <dt>비용</dt>
          <dd>\${escapeHtml(card.requirement || "-")}</dd>
          <dt>점수</dt>
          <dd>\${card.power === null || card.power === undefined ? "미확인" : escapeHtml(card.power)}</dd>
          <dt>다이아</dt>
          <dd>\${card.diamonds === null || card.diamonds === undefined ? "미확인" : escapeHtml(card.diamonds)}</dd>
          <dt>효과</dt>
          <dd class="effect">\${escapeHtml(card.effect || "효과 메모 없음")}</dd>
        </dl>
        <div class="status" role="group" aria-label="확인 상태">
          \${statusButton("unknown", "미확인", review.status)}
          \${statusButton("ok", "맞음", review.status)}
          \${statusButton("issue", "수정 필요", review.status)}
        </div>
        <textarea placeholder="확인 메모">\${escapeHtml(review.note || "")}</textarea>
      \`;
    }

    function statusButton(value, label, current) {
      return \`<button type="button" data-value="\${value}" aria-pressed="\${value === current}">\${label}</button>\`;
    }

    function bindCard(article, card) {
      article.querySelectorAll("button[data-value]").forEach((button) => {
        button.addEventListener("click", () => {
          const review = reviewFor(card.cardId);
          review.status = button.dataset.value;
          saveState();
          render();
        });
      });

      article.querySelector("textarea").addEventListener("input", (event) => {
        const review = reviewFor(card.cardId);
        review.note = event.target.value;
        saveState();
      });
    }

    function updateSummary() {
      const counts = { unknown: 0, ok: 0, issue: 0 };
      for (const card of CARDS) {
        counts[reviewFor(card.cardId).status] += 1;
      }
      const visible = document.querySelectorAll(".card:not(.hidden)").length;
      summaryEl.textContent =
        \`총 \${CARDS.length}장 · 표시 \${visible}장 · 미확인 \${counts.unknown} · 맞음 \${counts.ok} · 수정 필요 \${counts.issue}\`;
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }
  </script>
</body>
</html>
`;

await writeFile(paths.output, html, "utf8");
console.log(`Wrote review HTML for ${cards.length} cards to ${paths.output}`);
