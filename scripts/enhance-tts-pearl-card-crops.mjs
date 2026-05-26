#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (arg.startsWith("--")) {
    args.set(arg.slice(2), process.argv[index + 1] ?? "true");
    index += 1;
  }
}

const sourceDir = resolve(
  repoRoot,
  args.get("source-dir") ??
    "docs/llm-sources/2026-05-23-tts-pearl-card-crops",
);
const outputDir = resolve(
  repoRoot,
  args.get("out-dir") ??
    "docs/llm-sources/2026-05-23-tts-pearl-card-crops/enhanced",
);
const resetOutput = args.get("reset") !== "false";

const manifest = JSON.parse(
  await readFile(resolve(sourceDir, "manifest.json"), "utf8"),
);

if (resetOutput) {
  await rm(outputDir, { recursive: true, force: true });
}
await mkdir(resolve(outputDir, "cards"), { recursive: true });

const enhancement = {
  resize: "200%",
  filter: "Lanczos",
  unsharp: "0x1.1+1.05+0.018",
  contrastStretch: "0.2%x0.2%",
  jpegQuality: 96,
  jpegSamplingFactor: "4:4:4",
};

const cards = [];
for (const card of manifest.cards) {
  const fileName = `cards/${basename(card.fileName)}`;
  const inputPath = resolve(sourceDir, card.fileName);
  const outputPath = resolve(outputDir, fileName);

  await execFileAsync("magick", [
    inputPath,
    "-auto-orient",
    "-colorspace",
    "sRGB",
    "-filter",
    enhancement.filter,
    "-resize",
    enhancement.resize,
    "-unsharp",
    enhancement.unsharp,
    "-contrast-stretch",
    enhancement.contrastStretch,
    "-strip",
    "-sampling-factor",
    enhancement.jpegSamplingFactor,
    "-quality",
    String(enhancement.jpegQuality),
    outputPath,
  ]);

  cards.push({
    ...card,
    fileName,
    sourceFileName: card.fileName,
  });
}

const enhancedManifest = {
  status: "enhanced_reference_pearl_card_crops_not_app_assets",
  warning:
    "These files are sharpened/upscaled derivatives of Steam/TTS source material. Do not use them as final distributable app assets unless rights are confirmed.",
  sourceManifest: "../manifest.json",
  enhancement,
  contactSheet: "contact-sheet.jpg",
  pearlCardCount: cards.length,
  cards,
};

await writeFile(
  resolve(outputDir, "manifest.json"),
  `${JSON.stringify(enhancedManifest, null, 2)}\n`,
  "utf8",
);

await writeFile(
  resolve(outputDir, "README.md"),
  `# Enhanced TTS Pearl Card Crops\n\n` +
    `Sharpened 2x derivatives of the pearl-card reference crops in ` +
    `\`../cards\`.\n\n` +
    `The image content is intentionally unchanged: this pass only upsizes, ` +
    `sharpens, lightly adjusts contrast, and writes high-quality JPEG output. ` +
    `The original crops remain preserved in the parent source folder.\n\n` +
    `These files are still Steam/TTS-derived reference material. Do not use ` +
    `them as final distributable app assets unless rights are confirmed.\n\n` +
    `Open \`review.html\` or \`contact-sheet.jpg\` for quick inspection.\n`,
  "utf8",
);

const cardMarkup = cards
  .map(
    (card) => `
      <article>
        <img src="${card.fileName}" alt="Enhanced pearl ${card.value} ${card.variant}">
        <h2>Pearl ${card.value}</h2>
        <p>${card.variant}</p>
        <code>${card.sourceFileName}</code>
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
  <title>Enhanced TTS Pearl Card Crops</title>
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
    <h1>Enhanced TTS Pearl Card Crops</h1>
    <p class="note">Sharpened 2x reference derivatives. Not final app assets.</p>
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

console.log(`Enhanced ${cards.length} pearl card images at ${outputDir}`);
