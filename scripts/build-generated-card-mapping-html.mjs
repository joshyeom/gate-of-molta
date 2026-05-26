#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const generatedDir = resolve(
  repoRoot,
  "docs/llm-sources/2026-05-23-tts-card-crops/generated-imagegen",
);
const manifestPath = resolve(generatedDir, "manifest.json");
const outputPath = resolve(generatedDir, "named-review.html");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cardSortKey(card) {
  if (card.category === "pearl") {
    return `z-${String(card.pearl?.value ?? 0).padStart(2, "0")}-${card.assetName}`;
  }

  const candidate = card.characterCandidate;
  const id = candidate?.cardId ?? 9999;
  return `a-${String(id).padStart(4, "0")}-${card.assetName}`;
}

function normalizeCard(card) {
  if (card.category === "pearl") {
    return {
      id: card.assetName,
      category: "pearl",
      imagePath: card.namedFileName,
      title: `진주 ${card.pearl?.value ?? "?"}`,
      requirement: `값 ${card.pearl?.value ?? "?"}`,
      power: "-",
      diamonds: "-",
      effect: card.pearl?.variant === "character-refresh" ? "시장 교체 아이콘이 있는 진주 카드" : "진주 카드",
      group: "",
      source: `${card.sourceFileName} -> ${card.generatedFileName}`,
    };
  }

  const candidate = card.characterCandidate ?? {};
  return {
    id: card.assetName,
    category: "character",
    imagePath: card.namedFileName,
    title: `인물 카드 ${candidate.cardId ?? "extra"}`,
    requirement: candidate.requirement || "-",
    power: candidate.power ?? "미확인",
    diamonds: candidate.diamonds ?? "미확인",
    effect: candidate.effect || "효과 없음",
    group:
      candidate.groupSize > 1
        ? `동일 후보 ${candidate.groupIndex}/${candidate.groupSize}`
        : "",
    source: `${card.sourceFileName} -> ${card.generatedFileName}`,
  };
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const cards = manifest.cards
  .filter((card) => card.namedFileName)
  .sort((left, right) => cardSortKey(left).localeCompare(cardSortKey(right)))
  .map(normalizeCard);

const cardJson = JSON.stringify(cards);
const cardsHtml = cards
  .map(
    (card) => `      <article class="card" data-category="${escapeHtml(card.category)}" data-search="${escapeHtml(
      [
        card.id,
        card.title,
        card.requirement,
        card.effect,
        card.power,
        card.diamonds,
        card.source,
      ].join(" "),
    )}">
        <div class="image-wrap">
          <img src="${escapeHtml(card.imagePath)}" alt="${escapeHtml(card.id)}">
        </div>
        <div class="card-copy">
          <div class="card-head">
            <h2>${escapeHtml(card.title)}</h2>
            ${card.group ? `<span>${escapeHtml(card.group)}</span>` : ""}
          </div>
          <dl>
            <div>
              <dt>조건</dt>
              <dd>${escapeHtml(card.requirement)}</dd>
            </div>
            <div>
              <dt>점수</dt>
              <dd>${escapeHtml(card.power)}</dd>
            </div>
            <div>
              <dt>다이아</dt>
              <dd>${escapeHtml(card.diamonds)}</dd>
            </div>
            <div class="effect-row">
              <dt>효과</dt>
              <dd>${escapeHtml(card.effect)}</dd>
            </div>
          </dl>
          <code>${escapeHtml(card.id)}</code>
          <code>${escapeHtml(card.source)}</code>
        </div>
      </article>`,
  )
  .join("\n");

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>몰타의 관문 생성 카드 이미지/설명 매핑</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f4f0e8;
      --panel: #fffaf1;
      --ink: #231f1a;
      --muted: #70675b;
      --line: #d7c7af;
      --accent: #236a62;
      --effect: #245f34;
      --shadow: 0 10px 28px rgba(49, 38, 22, 0.12);
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
      z-index: 10;
      border-bottom: 1px solid var(--line);
      background: rgba(244, 240, 232, 0.96);
      backdrop-filter: blur(10px);
    }

    .bar {
      max-width: 1500px;
      display: grid;
      gap: 12px;
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
      grid-template-columns: minmax(220px, 1fr) 160px;
      gap: 8px;
    }

    input,
    select {
      min-height: 38px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: #fffef9;
      color: var(--ink);
      padding: 0 10px;
      font: inherit;
    }

    main {
      max-width: 1500px;
      margin: 0 auto;
      padding: 18px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(620px, 1fr));
      gap: 14px;
    }

    .card {
      min-width: 0;
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr);
      gap: 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      box-shadow: var(--shadow);
      padding: 12px;
    }

    .image-wrap {
      align-self: start;
      border: 1px solid #eadfcf;
      border-radius: 8px;
      background: #fff;
      padding: 6px;
    }

    img {
      width: 100%;
      aspect-ratio: 1008 / 1561;
      display: block;
      object-fit: fill;
      border-radius: 5px;
    }

    .card-copy {
      min-width: 0;
      display: grid;
      align-content: start;
      gap: 10px;
    }

    .card-head {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 8px;
    }

    h2 {
      margin: 0;
      font-size: 17px;
      line-height: 1.25;
    }

    .card-head span {
      flex: 0 0 auto;
      border: 1px solid #dfc18a;
      border-radius: 999px;
      color: #6c4b0f;
      background: #fff3d6;
      padding: 3px 7px;
      font-size: 11px;
      font-weight: 800;
    }

    dl {
      display: grid;
      gap: 7px;
      margin: 0;
    }

    dl > div {
      display: grid;
      grid-template-columns: 56px minmax(0, 1fr);
      gap: 8px;
      border: 1px solid rgba(215, 199, 175, 0.65);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.48);
      padding: 7px 8px;
    }

    dt,
    dd {
      margin: 0;
    }

    dt {
      color: var(--muted);
      font-size: 12px;
      font-weight: 800;
    }

    dd {
      min-width: 0;
      overflow-wrap: anywhere;
      font-size: 13px;
      font-weight: 700;
      line-height: 1.45;
    }

    .effect-row {
      border-color: rgba(36, 95, 52, 0.28);
      background: rgba(36, 95, 52, 0.06);
    }

    .effect-row dt {
      color: var(--effect);
    }

    code {
      display: block;
      color: var(--muted);
      overflow-wrap: anywhere;
      font-size: 11px;
      line-height: 1.35;
    }

    .hidden {
      display: none;
    }

    @media (max-width: 720px) {
      .controls,
      .card {
        grid-template-columns: 1fr;
      }

      .image-wrap {
        width: min(300px, 100%);
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="bar">
      <div>
        <h1>몰타의 관문 생성 카드 이미지/설명 매핑</h1>
        <div class="meta">이미지는 <code>generated-imagegen/named-cards/</code>, 설명은 generated manifest의 후보 메타데이터 기준입니다. 후보 데이터는 공식 확정 자료가 아닙니다.</div>
      </div>
      <div class="controls">
        <input id="search" type="search" placeholder="조건, 효과, 파일명, 카드 번호 검색">
        <select id="category">
          <option value="all">전체</option>
          <option value="character">인물 카드</option>
          <option value="pearl">진주 카드</option>
        </select>
      </div>
    </div>
  </header>
  <main>
    <section class="grid" id="grid">
${cardsHtml}
    </section>
  </main>
  <script>
    const CARDS = ${cardJson};
    const searchInput = document.querySelector("#search");
    const categorySelect = document.querySelector("#category");
    const elements = [...document.querySelectorAll(".card")];

    function applyFilters() {
      const query = searchInput.value.trim().toLowerCase();
      const category = categorySelect.value;
      for (const element of elements) {
        const matchesCategory = category === "all" || element.dataset.category === category;
        const matchesQuery = !query || element.dataset.search.toLowerCase().includes(query);
        element.classList.toggle("hidden", !(matchesCategory && matchesQuery));
      }
    }

    searchInput.addEventListener("input", applyFilters);
    categorySelect.addEventListener("change", applyFilters);
    window.CARDS = CARDS;
  </script>
</body>
</html>
`;

await writeFile(outputPath, html);
console.log(`Wrote ${outputPath}`);
