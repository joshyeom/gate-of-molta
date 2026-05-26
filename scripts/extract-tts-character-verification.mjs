#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
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
const outputPath = resolve(
  repoRoot,
  args.get("out") ??
    "docs/llm-sources/2026-05-23-tts-character-verification.json",
);
const accessedDate =
  args.get("accessed-date") ?? new Date().toISOString().slice(0, 10);

const CHARACTER_POWER_BY_ID = {
  302: 1,
  303: 1,
  304: 0,
  305: 3,
  306: 1,
  307: 4,
  308: 1,
  400: 0,
  401: 1,
  402: 1,
  403: 2,
  404: 1,
  405: 2,
  406: 1,
  407: 2,
  408: 1,
  500: 1,
  501: 2,
  502: 1,
  503: 4,
  504: 3,
  505: 5,
  506: 1,
  507: 1,
  508: 1,
  600: 3,
  601: 2,
  602: 1,
  603: 0,
  604: 2,
  605: 3,
  606: 3,
  607: 1,
  608: 1,
  700: 2,
  701: 2,
  702: 2,
  703: 1,
  704: 3,
  705: 1,
  706: 2,
  707: 3,
  708: 1,
  800: 1,
  801: 1,
  802: 3,
  803: 1,
  804: 1,
  805: 1,
  806: 0,
  807: 1,
  808: 1,
  900: 2,
  901: 3,
};

const CHARACTER_DIAMONDS_BY_ID = {
  401: 1,
  403: 1,
  408: 1,
  605: 1,
  703: 1,
  802: 1,
  806: 1,
  808: 2,
  900: 1,
};

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
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TTS save download failed: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function collectCards(root) {
  const cards = [];

  function visit(value, path) {
    if (!value || typeof value !== "object") {
      return;
    }

    if (value.Name === "Card" && Number.isInteger(value.CardID)) {
      cards.push({
        path,
        cardId: value.CardID,
        activationRequirement: value.Nickname || null,
        effectNote: value.Description || null,
      });
    }

    if (Array.isArray(value.ObjectStates)) {
      value.ObjectStates.forEach((child, index) =>
        visit(child, `${path}.ObjectStates[${index}]`),
      );
    }

    if (Array.isArray(value.ContainedObjects)) {
      value.ContainedObjects.forEach((child, index) =>
        visit(child, `${path}.ContainedObjects[${index}]`),
      );
    }
  }

  visit(root, "root");
  return cards
    .filter((card) => card.cardId >= 300)
    .sort((left, right) => left.cardId - right.cardId)
    .map((card) => ({
      cardId: card.cardId,
      sourceDeckId: Math.trunc(card.cardId / 100),
      sourceSheetIndex: card.cardId % 100,
      activationRequirement: card.activationRequirement,
      effectNote: card.effectNote,
      power: CHARACTER_POWER_BY_ID[card.cardId] ?? null,
      powerSource: "read_from_tts_reference_image",
      diamonds: CHARACTER_DIAMONDS_BY_ID[card.cardId] ?? 0,
      diamondsSource: "read_from_tts_reference_image",
      verificationStatus: "tts_metadata_unverified",
      verificationNeeds: [
        "official card photo or rulebook check",
        "card name confirmation",
        "power value confirmation",
        "diamond reward confirmation",
      ],
    }));
}

function assertSanitized(payload) {
  const serialized = JSON.stringify(payload);
  const forbiddenFragments = [
    "FaceURL",
    "BackURL",
    "cloud-",
    "steamusercontent.com/ugc",
  ];

  for (const fragment of forbiddenFragments) {
    if (serialized.includes(fragment)) {
      throw new Error(`Sanitization failed: output contains ${fragment}`);
    }
  }
}

const details = await getWorkshopDetails(workshopId);
const saveBuffer = await fetchBinary(details.file_url);
const root = new BsonReader(saveBuffer).readDocument();
const characterCards = collectCards(root);

if (characterCards.length !== 54) {
  throw new Error(
    `Expected 54 character card metadata entries, found ${characterCards.length}`,
  );
}

const payload = {
  status: "verification_only_not_canonical",
  warning:
    "Use this file only to build a rule/effect verification checklist. Do not treat it as official rules, final app content, or asset permission.",
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
      "TTS card object id",
      "activation requirement text from card nickname",
      "effect note text from card description",
    ],
    notSaved: [
      "card images",
      "image URLs",
      "TTS save binary",
      "custom deck face/back URLs",
    ],
  },
  characterCardCount: characterCards.length,
  characterCards,
};

assertSanitized(payload);

await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${characterCards.length} verification entries to ${outputPath}`);
