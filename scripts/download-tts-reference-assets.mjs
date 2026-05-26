#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSHOP_ID = "1198835784";
const STEAM_DETAILS_URL =
  "https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (arg.startsWith("--")) {
    args.set(arg.slice(2), process.argv[index + 1]);
    index += 1;
  }
}

const workshopId = args.get("workshop-id") ?? DEFAULT_WORKSHOP_ID;
const outputDir = resolve(
  repoRoot,
  args.get("out-dir") ??
    "docs/llm-sources/2026-05-23-tts-reference-assets",
);
const accessedDate =
  args.get("accessed-date") ?? new Date().toISOString().slice(0, 10);

class BsonReader {
  constructor(buffer) {
    this.buffer = buffer;
    this.offset = 0;
  }

  readCString() {
    const end = this.buffer.indexOf(0, this.offset);
    if (end < 0) {
      throw new Error("Invalid BSON: unterminated cstring");
    }

    const value = this.buffer.toString("utf8", this.offset, end);
    this.offset = end + 1;
    return value;
  }

  readDocument() {
    const start = this.offset;
    const length = this.buffer.readInt32LE(this.offset);
    this.offset += 4;

    const document = {};
    while (this.offset < start + length - 1) {
      const type = this.buffer[this.offset];
      this.offset += 1;
      const key = this.readCString();
      document[key] = this.readValue(type);
    }

    this.offset += 1;
    return document;
  }

  readValue(type) {
    switch (type) {
      case 0x01: {
        const value = this.buffer.readDoubleLE(this.offset);
        this.offset += 8;
        return value;
      }
      case 0x02: {
        const length = this.buffer.readInt32LE(this.offset);
        this.offset += 4;
        const value = this.buffer.toString(
          "utf8",
          this.offset,
          this.offset + length - 1,
        );
        this.offset += length;
        return value;
      }
      case 0x03:
        return this.readDocument();
      case 0x04: {
        const document = this.readDocument();
        return Object.keys(document)
          .sort((left, right) => Number(left) - Number(right))
          .map((key) => document[key]);
      }
      case 0x05: {
        const length = this.buffer.readInt32LE(this.offset);
        this.offset += 5 + length;
        return null;
      }
      case 0x08: {
        const value = Boolean(this.buffer[this.offset]);
        this.offset += 1;
        return value;
      }
      case 0x09:
        this.offset += 8;
        return null;
      case 0x0a:
        return null;
      case 0x10: {
        const value = this.buffer.readInt32LE(this.offset);
        this.offset += 4;
        return value;
      }
      case 0x12: {
        const value = this.buffer.readBigInt64LE(this.offset);
        this.offset += 8;
        return Number(value);
      }
      default:
        throw new Error(
          `Unsupported BSON type 0x${type.toString(16)} at offset ${
            this.offset - 1
          }`,
        );
    }
  }
}

async function getWorkshopDetails(id) {
  const response = await fetch(STEAM_DETAILS_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      itemcount: "1",
      "publishedfileids[0]": id,
    }),
  });

  if (!response.ok) {
    throw new Error(`Steam details request failed: ${response.status}`);
  }

  const payload = await response.json();
  const details = payload.response?.publishedfiledetails?.[0];

  if (!details?.file_url) {
    throw new Error(`Workshop item ${id} has no downloadable file_url`);
  }

  return details;
}

async function fetchBinary(url) {
  const response = await fetch(normalizeSteamusercontentUrl(url));
  if (!response.ok) {
    throw new Error(`Download failed for ${url}: ${response.status}`);
  }

  return {
    contentType: response.headers.get("content-type") ?? "application/octet-stream",
    buffer: Buffer.from(await response.arrayBuffer()),
  };
}

function collectImageUrls(root) {
  const assetsByUrl = new Map();

  function visit(value, path) {
    if (!value || typeof value !== "object") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((child, index) => visit(child, `${path}[${index}]`));
      return;
    }

    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}.${key}`;
      if (
        typeof child === "string" &&
        /^https?:\/\/(?:cloud-\d+\.)?steamusercontent\.com\/.+/u.test(child)
      ) {
        const existing = assetsByUrl.get(child);
        const context = { key, path: childPath };
        if (existing) {
          existing.contexts.push(context);
        } else {
          assetsByUrl.set(child, { sourceUrl: child, contexts: [context] });
        }
      } else {
        visit(child, childPath);
      }
    }
  }

  visit(root, "root");
  return [...assetsByUrl.values()].sort((left, right) =>
    left.sourceUrl.localeCompare(right.sourceUrl),
  );
}

function normalizeSteamusercontentUrl(url) {
  const parsed = new URL(url);
  if (/^cloud-\d+\.steamusercontent\.com$/u.test(parsed.hostname)) {
    parsed.protocol = "https:";
    parsed.hostname = "cdn.steamusercontent.com";
  }

  return parsed.toString();
}

function extensionFor(contentType, sourceUrl, buffer) {
  const urlExt = extname(new URL(sourceUrl).pathname);
  if (urlExt) {
    return urlExt;
  }

  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return ".png";
  }
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return ".jpg";
  }
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return ".webp";
  }

  if (contentType.includes("png")) {
    return ".png";
  }
  if (contentType.includes("jpeg") || contentType.includes("jpg")) {
    return ".jpg";
  }
  if (contentType.includes("webp")) {
    return ".webp";
  }

  return ".bin";
}

function assetKind(contexts) {
  const keys = new Set(contexts.map((context) => context.key));
  if (keys.has("FaceURL")) {
    return "card-sheet-face";
  }
  if (keys.has("BackURL")) {
    return "card-sheet-back";
  }
  if (keys.has("TableURL")) {
    return "table-reference";
  }
  return "reference-image";
}

const details = await getWorkshopDetails(workshopId);
const { buffer: saveBuffer } = await fetchBinary(details.file_url);
const root = new BsonReader(saveBuffer).readDocument();
const assets = collectImageUrls(root);

await mkdir(outputDir, { recursive: true });

const manifestAssets = [];
for (let index = 0; index < assets.length; index += 1) {
  const asset = assets[index];
  const { contentType, buffer } = await fetchBinary(asset.sourceUrl);
  const extension = extensionFor(contentType, asset.sourceUrl, buffer);
  const kind = assetKind(asset.contexts);
  const fileName = `${String(index + 1).padStart(2, "0")}-${kind}${extension}`;
  await writeFile(resolve(outputDir, fileName), buffer);

  manifestAssets.push({
    fileName,
    kind,
    contentType,
    sizeBytes: buffer.byteLength,
    sourceUrl: asset.sourceUrl,
    contexts: asset.contexts,
  });
}

const manifest = {
  status: "reference_assets_not_app_assets",
  warning:
    "These files are source/reference material only. Do not use them as final distributable app assets unless rights are confirmed.",
  accessedDate,
  source: {
    workshopId,
    workshopPage: `https://steamcommunity.com/sharedfiles/filedetails/?id=${workshopId}`,
    title: details.title,
    creatorSteamId: details.creator,
    consumerAppId: details.consumer_app_id,
    fileSizeBytes: Number(details.file_size),
    ttsSaveName: root.SaveName,
    ttsSaveDate: root.Date,
  },
  extractionPolicy: {
    saved: [
      "unique image files referenced by the TTS save",
      "manifest with source URLs and object contexts",
    ],
    notSaved: ["TTS save binary"],
    usageLimit:
      "Use as visual reference for creating new original assets; keep out of src/assets until rights/final asset status is decided.",
  },
  assetCount: manifestAssets.length,
  assets: manifestAssets,
};

await writeFile(
  resolve(outputDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

await writeFile(
  resolve(outputDir, "README.md"),
  `# TTS Reference Assets\n\n` +
    `Downloaded on ${accessedDate} from Steam Workshop item ${workshopId}.\n\n` +
    `These files are reference/source material only. Do not use them as final app assets unless rights are confirmed. ` +
    `Use them to inspect card layout, visual structure, and source-game iconography while creating new original assets.\n\n` +
    "See `manifest.json` for source URLs and contexts.\n",
  "utf8",
);

console.log(`Downloaded ${manifestAssets.length} reference assets to ${outputDir}`);
