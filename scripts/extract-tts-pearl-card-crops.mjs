#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const execFileAsync = promisify(execFile);

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (arg.startsWith("--")) {
    args.set(arg.slice(2), process.argv[index + 1] ?? "true");
    index += 1;
  }
}

const cropSourceDir = resolve(
  repoRoot,
  args.get("crop-source-dir") ??
    args.get("source-dir") ??
    "docs/llm-sources/2026-05-23-tts-card-crops",
);
const referenceSourceDir = resolve(
  repoRoot,
  args.get("reference-source-dir") ??
    "docs/llm-sources/2026-05-23-tts-reference-assets",
);
const outputDir = resolve(
  repoRoot,
  args.get("out-dir") ??
    "docs/llm-sources/2026-05-23-tts-pearl-card-crops",
);
const resetOutput = args.get("reset") !== "false";

const pearlCards = [
  {
    fileName: "cards/pearl-1.jpg",
    value: 1,
    variant: "standard",
    sourceFileName: "cards/13-card-sheet-face-r1c1.jpg",
  },
  {
    fileName: "cards/pearl-2.jpg",
    value: 2,
    variant: "standard",
    sourceFileName: "cards/13-card-sheet-face-r1c2.jpg",
  },
  {
    fileName: "cards/pearl-3.jpg",
    value: 3,
    variant: "standard",
    sourceFileName: "cards/13-card-sheet-face-r1c3.jpg",
  },
  {
    fileName: "cards/pearl-4.jpg",
    value: 4,
    variant: "standard",
    sourceFileName: "cards/13-card-sheet-face-r2c1.jpg",
  },
  {
    fileName: "cards/pearl-5.jpg",
    value: 5,
    variant: "standard",
    sourceFileName: "cards/13-card-sheet-face-r2c2.jpg",
  },
  {
    fileName: "cards/pearl-6.jpg",
    value: 6,
    variant: "standard",
    sourceFileName: "cards/13-card-sheet-face-r2c3.jpg",
  },
  {
    fileName: "cards/pearl-7.jpg",
    value: 7,
    variant: "standard",
    sourceFileName: "cards/13-card-sheet-face-r3c1.jpg",
  },
  {
    fileName: "cards/pearl-8.jpg",
    value: 8,
    variant: "standard",
    sourceFileName: "cards/13-card-sheet-face-r3c2.jpg",
  },
  {
    fileName: "cards/pearl-3-refresh.jpg",
    value: 3,
    variant: "character-refresh",
    hasCharacterRefreshIcon: true,
    sourceFileName: "cards/13-card-sheet-face-r3c3.jpg",
  },
  {
    fileName: "cards/pearl-4-refresh.jpg",
    value: 4,
    variant: "character-refresh",
    hasCharacterRefreshIcon: true,
    sourceFileName: "cards/15-card-sheet-face-r1c1.jpg",
  },
  {
    fileName: "cards/pearl-5-refresh.jpg",
    value: 5,
    variant: "character-refresh",
    hasCharacterRefreshIcon: true,
    sourceFileName: "cards/15-card-sheet-face-r1c2.jpg",
  },
];

const sourceManifest = JSON.parse(
  await readFile(resolve(cropSourceDir, "manifest.json"), "utf8"),
);
const sourceCardsByFileName = new Map(
  sourceManifest.cards.map((card) => [card.fileName, card]),
);

if (resetOutput) {
  await Promise.all(
    ["cards", "manifest.json", "README.md", "review.html", "contact-sheet.jpg"].map(
      (path) => rm(resolve(outputDir, path), { recursive: true, force: true }),
    ),
  );
}
await mkdir(resolve(outputDir, "cards"), { recursive: true });

const cards = [];
for (const pearlCard of pearlCards) {
  const sourceCrop = sourceCardsByFileName.get(pearlCard.sourceFileName);
  if (!sourceCrop) {
    throw new Error(`Missing source crop: ${pearlCard.sourceFileName}`);
  }

  await execFileAsync("magick", [
    resolve(referenceSourceDir, sourceCrop.sourceSheet),
    "-crop",
    `${sourceCrop.crop.width}x${sourceCrop.crop.height}+${sourceCrop.crop.x}+${sourceCrop.crop.y}`,
    "+repage",
    "-quality",
    "95",
    resolve(outputDir, pearlCard.fileName),
  ]);

  cards.push({
    fileName: pearlCard.fileName,
    value: pearlCard.value,
    variant: pearlCard.variant,
    hasCharacterRefreshIcon: pearlCard.hasCharacterRefreshIcon === true,
    source: {
      cropFileName: sourceCrop.fileName,
      sourceSheet: sourceCrop.sourceSheet,
      sourceUrl: sourceCrop.sourceUrl,
      row: sourceCrop.row,
      column: sourceCrop.column,
      cardIndex: sourceCrop.cardIndex,
      crop: sourceCrop.crop,
    },
  });
}

const manifest = {
  status: "reference_pearl_card_crops_not_app_assets",
  warning:
    "These files are Steam/TTS-derived source/reference material only. Do not use them as final distributable app assets unless rights are confirmed.",
  sourceCropManifest: "../2026-05-23-tts-card-crops/manifest.json",
  sourceReferenceManifest: "../2026-05-23-tts-reference-assets/manifest.json",
  contactSheet: "contact-sheet.jpg",
  pearlCardCount: cards.length,
  cards,
};

await writeFile(
  resolve(outputDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

await writeFile(
  resolve(outputDir, "README.md"),
  `# TTS Pearl Card Crops\n\n` +
    `Pearl-card reference crops cut directly from the Steam/TTS source card ` +
    `sheets in \`../2026-05-23-tts-reference-assets\` using crop geometry ` +
    `recorded in \`../2026-05-23-tts-card-crops/manifest.json\`.\n\n` +
    `These files are reference/source material only. Do not use them as final ` +
    `app assets unless rights are confirmed. Use them to verify pearl-card ` +
    `values, icon placement, and replacement-asset planning.\n\n` +
    `The set contains the standard pearl values 1-8 plus the visible ` +
    `character-refresh variants for pearl values 3, 4, and 5.\n\n` +
    `See \`manifest.json\` for source sheet, row/column, and crop metadata. ` +
    `Open \`review.html\` in a browser for quick visual inspection.\n`,
  "utf8",
);

const cardMarkup = cards
  .map(
    (card) => `
      <article>
        <img src="${card.fileName}" alt="Pearl ${card.value} ${card.variant}">
        <h2>Pearl ${card.value}</h2>
        <p>${card.variant}</p>
        <code>${card.source.cropFileName}</code>
      </article>`,
  )
  .join("\n");

await writeFile(
  resolve(outputDir, "review.html"),
  `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TTS Pearl Card Crops</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f4f0e8;
      --panel: #fffaf1;
      --ink: #24211c;
      --muted: #6f675d;
      --line: #d7c8b5;
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
    header,
    main {
      max-width: 1240px;
      margin: 0 auto;
      padding: 18px;
    }
    h1 {
      margin: 0 0 6px;
      font-size: 24px;
    }
    .note {
      margin: 0;
      color: var(--muted);
      font-size: 14px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 14px;
    }
    article {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      padding: 10px;
    }
    img {
      display: block;
      width: 100%;
      aspect-ratio: 660 / 1024;
      object-fit: contain;
      border-radius: 6px;
      background: #222;
    }
    h2 {
      margin: 10px 0 2px;
      font-size: 16px;
    }
    p {
      margin: 0 0 8px;
      color: var(--muted);
      font-size: 13px;
    }
    code {
      display: block;
      overflow-wrap: anywhere;
      color: var(--muted);
      font-size: 11px;
    }
  </style>
</head>
<body>
  <header>
    <h1>TTS Pearl Card Crops</h1>
    <p class="note">Reference-only Steam/TTS crops. Not final app assets.</p>
  </header>
  <main class="grid">
${cardMarkup}
  </main>
</body>
</html>
`,
  "utf8",
);

try {
  await execFileAsync("magick", [
    "montage",
    ...cards.map((card) => resolve(outputDir, card.fileName)),
    "-thumbnail",
    "220x342",
    "-tile",
    "4x",
    "-geometry",
    "+10+10",
    "-background",
    "white",
    resolve(outputDir, "contact-sheet.jpg"),
  ]);
} catch (error) {
  console.warn(
    `Skipped contact sheet generation: ${error.message ?? String(error)}`,
  );
}

console.log(`Cropped ${cards.length} pearl card images to ${outputDir}`);
