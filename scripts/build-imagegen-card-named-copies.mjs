#!/usr/bin/env node

import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const generatedDir = resolve(
  repoRoot,
  "docs/llm-sources/2026-05-23-tts-card-crops/generated-imagegen",
);
const generatedCardsDir = resolve(generatedDir, "cards");
const namedCardsDir = resolve(generatedDir, "named-cards");
const cropDir = resolve(repoRoot, "docs/llm-sources/2026-05-23-tts-card-crops");
const pearlDir = resolve(
  repoRoot,
  "docs/llm-sources/2026-05-23-tts-pearl-card-crops",
);

function parseReviewCards(html) {
  const marker = "const CARDS = ";
  const start = html.indexOf(marker);
  if (start === -1) {
    return [];
  }

  const arrayStart = start + marker.length;
  const arrayEnd = html.indexOf("];", arrayStart);
  if (arrayEnd === -1) {
    return [];
  }

  return JSON.parse(html.slice(arrayStart, arrayEnd + 1));
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function sourceBaseName(fileName) {
  return fileName.replace(/^cards\//, "").replace(/\.[^.]+$/, "");
}

function compactSheetPosition(fileName) {
  const match = fileName.match(/(\d+)-card-sheet-face-r(\d+)c(\d+)/);
  if (!match) {
    return sourceBaseName(fileName);
  }

  return `${match[1]}r${match[2]}c${match[3]}`;
}

function sanitizeName(value) {
  return String(value)
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function requirementSlug(requirement) {
  const text = String(requirement ?? "").trim();
  if (!text) {
    return "no-condition";
  }

  const compact = text.replace(/['"\s]/g, "");
  const numeric = compact.match(/\d+/g) ?? [];
  if (/^\d+(?:\/\d+)?$/.test(compact)) {
    return compact.replace("/", "-or-");
  }
  if (compact.includes("다이아몬드")) {
    return `${numeric.join("-") || "cards"}-plus-diamond`;
  }
  if (compact.includes("같은") && compact.includes("+66")) {
    return "same-2-plus-66";
  }
  if (compact.includes("같은") && compact.includes("6카드2")) {
    return "same-2-plus-6x2";
  }
  if (compact.includes("합") && numeric.includes("20") && numeric.includes("3")) {
    return "three-card-sum-20";
  }
  if (compact.includes("합") && numeric.includes("7") && numeric.includes("3")) {
    return "three-card-sum-7";
  }
  if (compact.includes("합") && numeric.includes("10") && numeric.includes("3")) {
    return "three-card-sum-10";
  }
  if (compact.includes("합") && numeric.includes("10")) {
    return "sum-10";
  }
  if (compact.includes("연속")) {
    return `straight-${numeric[0] ?? "n"}`;
  }
  if (compact.includes("짝수")) {
    return `even-${numeric[0] ?? "n"}-cards`;
  }
  if (compact.includes("홀수")) {
    return `odd-${numeric[0] ?? "n"}-cards`;
  }
  if (compact.includes("같은") && compact.includes("2") && compact.includes("두")) {
    return "two-pairs";
  }
  if (compact.includes("같은") && compact.includes("4")) {
    return "four-of-kind";
  }
  if (compact.includes("같은") && compact.includes("3")) {
    return "three-of-kind";
  }
  if (compact.includes("같은") && compact.includes("2")) {
    return "pair";
  }

  const fallback = sanitizeName(text);
  return fallback || `condition-${numeric.join("-") || "unknown"}`;
}

function pearlFileName(pearl) {
  const suffix = pearl.variant === "character-refresh" ? "-refresh" : "";
  return `pearl-${pearl.value}${suffix}.png`;
}

function characterFileName(card) {
  const candidate = card.characterCandidate;
  const condition = requirementSlug(candidate.requirement);
  const power = candidate.power ?? "x";
  const diamonds = candidate.diamonds ?? 0;

  if (candidate.cardId === null || candidate.cardId === undefined) {
    return `character-extra-${compactSheetPosition(card.sourceFileName)}-${condition}-p${power}-d${diamonds}.png`;
  }

  return `character-${candidate.cardId}-${condition}-p${power}-d${diamonds}.png`;
}

function displayName(card) {
  if (card.category === "pearl") {
    const suffix =
      card.pearl.variant === "character-refresh" ? " character-refresh" : "";
    return `Pearl ${card.pearl.value}${suffix}`;
  }

  const candidate = card.characterCandidate;
  if (candidate) {
    const prefix =
      candidate.cardId === null || candidate.cardId === undefined
        ? "Character extra"
        : `Character ${candidate.cardId}`;
    return `${prefix}: ${candidate.requirement || "no condition"} / power ${candidate.power} / diamonds ${candidate.diamonds}`;
  }

  return `Unmatched crop ${compactSheetPosition(card.sourceFileName)}`;
}

function uniqueName(name, usedNames) {
  if (!usedNames.has(name)) {
    usedNames.add(name);
    return name;
  }

  const stem = name.replace(/\.png$/, "");
  let index = 2;
  while (usedNames.has(`${stem}-${index}.png`)) {
    index += 1;
  }
  const unique = `${stem}-${index}.png`;
  usedNames.add(unique);
  return unique;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildNamedReviewHtml(cards) {
  const items = cards
    .map((card) => {
      const candidate = card.characterCandidate;
      const detail = candidate
        ? `${candidate.requirement || "no condition"} | power ${candidate.power} | diamonds ${candidate.diamonds}`
        : card.pearl
          ? `value ${card.pearl.value} | ${card.pearl.variant}`
          : card.sourceFileName;
      return `      <article class="card">
        <img src="${escapeHtml(card.namedFileName)}" alt="${escapeHtml(card.assetName)}">
        <h2>${escapeHtml(card.assetName)}</h2>
        <p>${escapeHtml(card.displayName)}</p>
        <p>${escapeHtml(detail)}</p>
        <code>${escapeHtml(card.sourceFileName)} -> ${escapeHtml(card.generatedFileName)}</code>
      </article>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Generated ImageGen Named Cards</title>
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f6f5f2;
      color: #1f2933;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 1;
      padding: 16px 20px;
      border-bottom: 1px solid #d6d3cc;
      background: #fffdfa;
    }
    h1 {
      margin: 0 0 4px;
      font-size: 20px;
    }
    .meta {
      color: #5f6b7a;
      font-size: 13px;
    }
    main {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 14px;
      padding: 16px;
    }
    .card {
      padding: 10px;
      border: 1px solid #d6d3cc;
      border-radius: 6px;
      background: #fffdfa;
    }
    img {
      display: block;
      width: 100%;
      height: 280px;
      object-fit: contain;
      background: #fff;
      border: 1px solid #ece8df;
    }
    h2 {
      margin: 8px 0 4px;
      overflow-wrap: anywhere;
      font-size: 13px;
    }
    p,
    code {
      display: block;
      margin: 4px 0 0;
      color: #5f6b7a;
      overflow-wrap: anywhere;
      font-size: 12px;
      line-height: 1.35;
    }
  </style>
</head>
<body>
  <header>
    <h1>Generated ImageGen Named Cards</h1>
    <div class="meta">${cards.length} named reference derivatives. Source-position files remain in <code>cards/</code>; human-readable copies live in <code>named-cards/</code>.</div>
  </header>
  <main>
${items}
  </main>
</body>
</html>
`;
}

const [sourceManifest, pearlManifest, reviewHtml] = await Promise.all([
  readFile(resolve(cropDir, "manifest.json"), "utf8").then(JSON.parse),
  readFile(resolve(pearlDir, "manifest.json"), "utf8").then(JSON.parse),
  readFile(resolve(cropDir, "review.html"), "utf8"),
]);

const reviewCards = parseReviewCards(reviewHtml);
const reviewByPath = new Map(reviewCards.map((card) => [card.imagePath, card]));
const pearlByCrop = new Map(
  pearlManifest.cards.map((card) => [card.source.cropFileName, card]),
);

const cards = [];
for (const sourceCard of sourceManifest.cards) {
  const base = sourceBaseName(sourceCard.fileName);
  const generatedFileName = `cards/${base}.png`;
  const generatedBuffer = await readFile(resolve(generatedDir, generatedFileName));
  const review = reviewByPath.get(sourceCard.fileName);
  const pearl = pearlByCrop.get(sourceCard.fileName);

  const card = {
    sourceFileName: sourceCard.fileName,
    generatedFileName,
    category: pearl ? "pearl" : review ? "character" : "unmatched-crop",
    sourceSheet: sourceCard.sourceSheet,
    row: sourceCard.row,
    column: sourceCard.column,
    cardIndex: sourceCard.cardIndex,
    sha256: sha256(generatedBuffer),
  };

  if (pearl) {
    card.pearl = {
      fileName: pearl.fileName,
      value: pearl.value,
      variant: pearl.variant,
      hasCharacterRefreshIcon: pearl.hasCharacterRefreshIcon,
    };
  }

  if (review) {
    card.characterCandidate = {
      cardId: review.cardId,
      requirement: review.requirement,
      effect: review.effect,
      power: review.power,
      diamonds: review.diamonds,
      groupId: review.groupId,
      groupSize: review.groupSize,
      groupIndex: review.groupIndex,
    };
  }

  cards.push(card);
}

const firstByHash = new Map();
for (const card of cards) {
  const first = firstByHash.get(card.sha256);
  if (first) {
    card.duplicateOfGeneratedFileName = first.generatedFileName;
    if (!card.characterCandidate && first.characterCandidate) {
      card.category = "character";
      card.characterCandidate = {
        ...first.characterCandidate,
        cardId: null,
        metadataSourceGeneratedFileName: first.generatedFileName,
      };
      card.isDuplicateCropWithoutReviewEntry = true;
    }
  } else {
    firstByHash.set(card.sha256, card);
  }
}

await mkdir(namedCardsDir, { recursive: true });
const usedNames = new Set();
for (const card of cards) {
  const rawName =
    card.category === "pearl"
      ? pearlFileName(card.pearl)
      : card.characterCandidate
        ? characterFileName(card)
        : `unmatched-${compactSheetPosition(card.sourceFileName)}.png`;
  const namedBaseName = uniqueName(rawName, usedNames);
  card.displayName = displayName(card);
  card.assetName = namedBaseName.replace(/\.png$/, "");
  card.namedFileName = `named-cards/${namedBaseName}`;
}

const expectedNamedFiles = new Set(cards.map((card) => card.namedFileName));
for (const entry of await readdir(namedCardsDir, { withFileTypes: true })) {
  const relativeFileName = `named-cards/${entry.name}`;
  if (
    entry.isFile() &&
    entry.name.endsWith(".png") &&
    !expectedNamedFiles.has(relativeFileName)
  ) {
    await rm(resolve(generatedDir, relativeFileName));
  }
}

for (const card of cards) {
  await copyFile(
    resolve(generatedDir, card.generatedFileName),
    resolve(generatedDir, card.namedFileName),
  );
}

const categoryCounts = cards.reduce((counts, card) => {
  counts[card.category] = (counts[card.category] ?? 0) + 1;
  return counts;
}, {});

const manifest = {
  status: "generated_imagegen_reference_derivatives_not_app_assets",
  warning:
    "These files are AI-generated restorations derived from Steam/TTS source crops. Treat them as reference material only and do not ship as final app assets unless rights are confirmed.",
  createdAt: "2026-05-23",
  generationMode: "built-in image_gen image-to-image restoration from local crop previews",
  sourceCropManifest: "../manifest.json",
  sourceReviewHtml: "../review.html",
  sourcePearlManifest: "../../2026-05-23-tts-pearl-card-crops/manifest.json",
  generatedCardsDir: "cards",
  namedCardsDir: "named-cards",
  contactSheet: "contact-sheet.png",
  generatedCardCount: cards.length,
  categoryCounts,
  notes: [
    "Prompts emphasized high input fidelity, low creativity, haze/moire removal, and exact number/icon preservation.",
    "Source-position filenames are preserved in cards/ for traceability.",
    "Human-readable filenames are copied into named-cards/ and recorded as namedFileName.",
    "Some duplicate source cards were filled by copying an existing generated output for consistency.",
    "Manual visual review is still required because generative restoration can alter digits, icons, or lower-panel semantics.",
  ],
  cards,
};

await writeFile(
  resolve(generatedDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
await writeFile(
  resolve(generatedDir, "named-review.html"),
  buildNamedReviewHtml(cards),
);

console.log(
  `Wrote ${cards.length} named card copies to ${namedCardsDir.replace(`${repoRoot}/`, "")}`,
);
