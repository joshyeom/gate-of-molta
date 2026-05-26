#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
const outputDir = resolve(sourceDir, "imagegen-prompts");

const manifest = JSON.parse(
  await readFile(resolve(sourceDir, "manifest.json"), "utf8"),
);

function centralGemDescription(value) {
  const descriptions = {
    1: "a warm amber-yellow glowing number 1 over a dark bronze circular pearl medallion",
    2: "a pale stone-gray number 2 with small greenish flecks over a muted gray pearl medallion",
    3: "a luminous yellow-green number 3 over a golden green pearl medallion",
    4: "a deep emerald green number 4 over a cracked green pearl medallion",
    5: "a cool silvery blue number 5 over a frosted blue pearl medallion",
    6: "a violet-magenta number 6 over a smoky purple pearl medallion",
    7: "a bright red number 7 over a cracked black and ember-red pearl medallion",
    8: "a fiery orange-red number 8 over a glowing warm pearl medallion",
  };

  return descriptions[value] ?? `a clear number ${value} pearl medallion`;
}

function refreshIconClause(card) {
  if (!card.hasCharacterRefreshIcon) {
    return "No red refresh panels, no arrow panels, no extra icons beyond the printed pearl-card artwork.";
  }

  return [
    "Preserve the character-refresh icon panels exactly:",
    "two small red rectangular panels near the top edge, each containing a gray card tile and a white upward arrow;",
    "two matching red rectangular panels near the bottom edge, each containing a gray card tile and a white downward arrow;",
    "do not add, remove, merge, rotate, or reinterpret these panels.",
  ].join(" ");
}

function cardPrompt(card) {
  const value = card.value;
  return `Use case: precise-object-edit
Asset type: board-game card restoration reference
Input image role: edit target. Use the supplied low-resolution pearl card crop as the exact composition and layout reference.

Primary request:
Create a new high-resolution, print-clean version of the same pearl card image. This is an image-to-image restoration/re-render, not a redesign. Preserve the original card's layout, proportions, ornaments, color placement, symbols, and number identity exactly while removing scan haze, blur, moire, compression artifacts, and muddy edges.

Required card identity:
- Pearl card value: ${value}.
- The four corner numerals must all be exactly "${value}".
- The lower two corner numerals must remain upside-down/mirrored exactly as in the source card.
- The center medallion must show ${centralGemDescription(value)}.
- ${refreshIconClause(card)}

Strict invariants:
- Same vertical card crop, same aspect ratio, same rounded corners, same dark blue outer border.
- Same ornate gold filigree frame around the center medallion.
- Same circular central medallion placement and same large central numeral.
- Same small bronze face emblem at the bottom center of the gold frame.
- Preserve every numeral, icon, frame element, and border position from the input.
- Keep it looking like a physical printed board-game card, not a modern UI icon or plastic token.
- Do not invent new symbols, text, labels, signatures, watermarks, logos, characters, or background scenery.
- Do not change the card value, do not stylize digits into different shapes, and do not omit the inverted bottom numerals.

Quality direction:
High input fidelity, low creativity, low denoise strength, restoration only. Crisp ink edges, cleaner linework, richer but faithful color, reduced scanner blur, subtle printed-card texture retained, no over-smoothing, no painterly redesign.

Negative constraints:
No alternate card design. No new border. No changed number. No changed arrow direction. No extra text. No fantasy scene outside the existing card art. No blank corners. No illegible digits. No cropped-off corners. No AI watermark.`;
}

const prompts = manifest.cards.map((card) => ({
  fileName: card.fileName,
  value: card.value,
  variant: card.variant,
  hasCharacterRefreshIcon: card.hasCharacterRefreshIcon,
  suggestedOutputFileName: card.fileName.replace(/^cards\//u, "cards/"),
  prompt: cardPrompt(card),
}));

await mkdir(outputDir, { recursive: true });

await writeFile(
  resolve(outputDir, "prompts.json"),
  `${JSON.stringify(
    {
      status: "image_generation_prompts_for_reference_restoration",
      warning:
        "These prompts are for high-fidelity restoration/re-rendering of Steam/TTS-derived reference crops. Outputs inherit the same reference-only restriction unless rights are confirmed.",
      sourceManifest: "../manifest.json",
      promptCount: prompts.length,
      prompts,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

const markdown = [
  "# Pearl Card Image-Generation Prompts",
  "",
  "These prompts are designed for image-to-image restoration of the pearl-card crops.",
  "",
  "Use each source crop as the edit target/reference image. The prompt intentionally asks for low-creativity, high-input-fidelity restoration rather than a redesigned card.",
  "",
  "Outputs remain reference-only derivatives of Steam/TTS source material unless rights are confirmed.",
  "",
  ...prompts.flatMap((item) => [
    `## ${item.fileName}`,
    "",
    "```text",
    item.prompt,
    "```",
    "",
  ]),
];

await writeFile(resolve(outputDir, "prompts.md"), `${markdown.join("\n")}\n`, "utf8");

console.log(`Wrote ${prompts.length} pearl image-generation prompts to ${outputDir}`);
