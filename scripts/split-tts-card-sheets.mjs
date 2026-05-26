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
    "docs/llm-sources/2026-05-23-tts-reference-assets",
);
const outputDir = resolve(
  repoRoot,
  args.get("out-dir") ??
    "docs/llm-sources/2026-05-23-tts-card-crops",
);
const manifestPath = resolve(sourceDir, "manifest.json");
const resetOutput = args.get("reset") !== "false";

async function identify(path) {
  const { stdout } = await execFileAsync("magick", [
    "identify",
    "-format",
    "%w %h",
    path,
  ]);
  const [width, height] = stdout.trim().split(/\s+/u).map(Number);
  return { width, height };
}

function inferGrid(asset, dimensions) {
  const contextPath = asset.contexts?.[0]?.path ?? "";
  const deckMatch = contextPath.match(/CustomDeck\.(\d+)/u);
  const deckId = deckMatch ? Number(deckMatch[1]) : null;

  if (deckId === 9) {
    return { columns: 2, rows: 2, reason: "tts-custom-deck-9" };
  }

  if (dimensions.width < 1500) {
    return { columns: 2, rows: 2, reason: "image-width" };
  }

  return { columns: 3, rows: 3, reason: "default-card-sheet" };
}

function cropGeometry(dimensions, columns, rows, column, row) {
  const x0 = Math.round((column * dimensions.width) / columns);
  const x1 = Math.round(((column + 1) * dimensions.width) / columns);
  const y0 = Math.round((row * dimensions.height) / rows);
  const y1 = Math.round(((row + 1) * dimensions.height) / rows);

  return {
    x: x0,
    y: y0,
    width: x1 - x0,
    height: y1 - y0,
  };
}

async function cropCard({ inputPath, outputPath, geometry }) {
  await execFileAsync("magick", [
    inputPath,
    "-crop",
    `${geometry.width}x${geometry.height}+${geometry.x}+${geometry.y}`,
    "+repage",
    "-quality",
    "95",
    outputPath,
  ]);
}

const sourceManifest = JSON.parse(await readFile(manifestPath, "utf8"));
const faceSheets = sourceManifest.assets.filter(
  (asset) => asset.kind === "card-sheet-face",
);

if (resetOutput) {
  await rm(outputDir, { recursive: true, force: true });
}
await mkdir(resolve(outputDir, "cards"), { recursive: true });

const cards = [];
for (const sheet of faceSheets) {
  const inputPath = resolve(sourceDir, sheet.fileName);
  const dimensions = await identify(inputPath);
  const grid = inferGrid(sheet, dimensions);
  const sheetBase = basename(sheet.fileName, ".jpg");

  for (let row = 0; row < grid.rows; row += 1) {
    for (let column = 0; column < grid.columns; column += 1) {
      const geometry = cropGeometry(
        dimensions,
        grid.columns,
        grid.rows,
        column,
        row,
      );
      const cardIndex = row * grid.columns + column + 1;
      const fileName = `${sheetBase}-r${row + 1}c${column + 1}.jpg`;
      const outputPath = resolve(outputDir, "cards", fileName);

      await cropCard({ inputPath, outputPath, geometry });

      cards.push({
        fileName: `cards/${fileName}`,
        sourceSheet: sheet.fileName,
        sourceUrl: sheet.sourceUrl,
        sourceContexts: sheet.contexts,
        grid,
        row: row + 1,
        column: column + 1,
        cardIndex,
        crop: geometry,
      });
    }
  }
}

const outputManifest = {
  status: "reference_card_crops_not_app_assets",
  warning:
    "These cropped files are reference/source material only. Do not use them as final distributable app assets unless rights are confirmed.",
  sourceManifest: "../2026-05-23-tts-reference-assets/manifest.json",
  sourceSheetCount: faceSheets.length,
  croppedCardCount: cards.length,
  cards,
};

await writeFile(
  resolve(outputDir, "manifest.json"),
  `${JSON.stringify(outputManifest, null, 2)}\n`,
  "utf8",
);

await writeFile(
  resolve(outputDir, "README.md"),
  `# TTS Card Crops\n\n` +
    `Individual card crops derived from the reference card sheets in ` +
    `\`../2026-05-23-tts-reference-assets\`.\n\n` +
    `These files are reference/source material only. Do not use them as final app assets unless rights are confirmed. ` +
    `Use them to inspect card composition, icon placement, and visual style while creating new original assets.\n\n` +
    `See \`manifest.json\` for source sheet, grid, and crop geometry metadata.\n`,
  "utf8",
);

console.log(
  `Split ${faceSheets.length} face sheets into ${cards.length} card crops at ${outputDir}`,
);
