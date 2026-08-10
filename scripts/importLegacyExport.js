/**
 * One-off importer: takes a legacy CSV export (4-letter brand codes, free-text
 * Channel column) and rebuilds it as new-format data.
 *
 * Steps:
 *   1. Rename each brand's `code` to a chosen 3-letter form.
 *   2. Upsert any missing placements referenced by the CSV's Channel column.
 *   3. For each row, generate a fresh ISCI code as [BRAND3][PLACEMENT1][YY][SEQ]
 *      where SEQ is per (brand, placement, year), starting at 01.
 *
 * Usage: node scripts/importLegacyExport.js path/to/export.csv
 */

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

// Old 4-letter code -> new 3-letter code. Only brands that need shrinking.
const BRAND_CODE_MAP = {
  ADID: "ADI",
  AMZN: "AMZ",
  APPL: "APL",
  BMWW: "BMW",
  COCA: "COC",
  FORD: "FOR",
  LVCI: "LVC",
  MCDO: "MCD",
  MSFT: "MSF",
  NFLX: "NFL",
  NIKE: "NIK",
  PEPS: "PEP",
  SRHC: "SEA",
  STBK: "STB",
  TLSA: "TSL",
  TOYT: "TOY",
};

// Additional placements to seed for channels the default seed didn't cover.
const EXTRA_PLACEMENTS = [
  { name: "CTV", letter: "T" },
  { name: "OLV", letter: "V" },
];

// Simple CSV line parser (handles double-quoted fields with escaped quotes).
const parseCSVLine = (line) => {
  const out = [];
  let i = 0;
  while (i <= line.length) {
    if (i === line.length) { out.push(""); break; }
    if (line[i] === '"') {
      let field = ""; i++;
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') { field += '"'; i += 2; }
        else if (line[i] === '"') { i++; break; }
        else field += line[i++];
      }
      out.push(field);
      if (line[i] === ",") i++;
    } else {
      const end = line.indexOf(",", i);
      if (end === -1) { out.push(line.slice(i).trim()); break; }
      out.push(line.slice(i, end).trim());
      i = end + 1;
    }
  }
  return out;
};

async function shrinkBrandCodes() {
  const brands = await prisma.brand.findMany();
  let changed = 0;
  for (const b of brands) {
    const target = BRAND_CODE_MAP[b.code];
    if (!target || target === b.code) continue;
    await prisma.brand.update({
      where: { id: b.id },
      data: { code: target, updatedAt: new Date() },
    });
    console.log(`  ${b.name}: ${b.code} -> ${target}`);
    changed++;
  }
  return changed;
}

async function ensurePlacements() {
  const now = new Date();
  for (const p of EXTRA_PLACEMENTS) {
    await prisma.placement.upsert({
      where: { letter: p.letter },
      update: { name: p.name, active: true, updatedAt: now },
      create: {
        id: randomUUID(),
        name: p.name,
        letter: p.letter,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
}

function buildPlacementLookup(placements) {
  const map = {};
  for (const p of placements) {
    if (p.name) map[p.name.toLowerCase()] = p;
    if (p.letter) map[p.letter.toLowerCase()] = p;
  }
  return map;
}

function buildBrandLookup(brands) {
  const map = {};
  for (const b of brands) {
    if (b.name) map[b.name.toLowerCase()] = b;
    if (b.code) map[b.code.toLowerCase()] = b;
  }
  // A few known name variants in the CSV
  map["pepsico"] = brands.find((b) => b.name === "Pepsi");
  map["lvcva"] = brands.find((b) => b.name === "LVCVA");
  return map;
}

async function run() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: node scripts/importLegacyExport.js <path/to/csv>");
    process.exit(1);
  }

  console.log(`Loading ${path.basename(csvPath)}...`);
  const raw = await fs.readFile(csvPath, "utf-8");
  const lines = raw.trim().split("\n");
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const col = (name) => headers.indexOf(name.toLowerCase());

  console.log(`\nShrinking brand codes to 3 letters...`);
  const changed = await shrinkBrandCodes();
  console.log(`  ${changed} brand(s) updated`);

  console.log(`\nEnsuring extra placements exist (CTV, OLV)...`);
  await ensurePlacements();

  const brands = await prisma.brand.findMany();
  const placements = await prisma.placement.findMany();
  const brandByKey = buildBrandLookup(brands);
  const placementByKey = buildPlacementLookup(placements);

  console.log(`\nWiping existing ISCI codes before rebuild...`);
  const existing = await prisma.iSCICode.count();
  if (existing > 0) {
    await prisma.iSCICode.deleteMany({});
    console.log(`  deleted ${existing} existing row(s)`);
  } else {
    console.log(`  (table already empty)`);
  }

  // Per-group counter: `${brandCode}${placementLetter}${YY}` -> highest seq
  const counters = {};

  const errors = [];
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const v = parseCSVLine(line);

    const oldCode = v[col("isci code")];
    const clientRaw = v[col("client")];
    const channelRaw = v[col("channel")];
    const airDateRaw = v[col("air date")];
    const createdAtRaw = v[col("created at")];

    const brand = brandByKey[String(clientRaw || "").trim().toLowerCase()];
    if (!brand) {
      errors.push({ row: i + 1, oldCode, error: `unknown client "${clientRaw}"` });
      continue;
    }
    const placement = placementByKey[String(channelRaw || "").trim().toLowerCase()];
    if (!placement) {
      errors.push({ row: i + 1, oldCode, error: `unknown placement "${channelRaw}"` });
      continue;
    }

    // Derive the 2-digit year: prefer created-at, fall back to what was in the
    // old code, and finally the current year.
    let year;
    if (createdAtRaw) {
      const y = new Date(createdAtRaw).getFullYear();
      if (!Number.isNaN(y)) year = String(y).slice(-2);
    }
    if (!year && oldCode && /^[A-Z]{4}(\d{2})\d+$/.test(oldCode)) {
      year = oldCode.match(/^[A-Z]{4}(\d{2})\d+$/)[1];
    }
    if (!year) year = String(new Date().getFullYear()).slice(-2);

    const prefix = `${brand.code}${placement.letter}${year}`;
    const nextSeq = (counters[prefix] || 0) + 1;
    counters[prefix] = nextSeq;
    const seqStr = nextSeq < 100 ? String(nextSeq).padStart(2, "0") : String(nextSeq);
    const newCode = `${prefix}${seqStr}`;

    const spotLengthRaw = v[col("spot length")];
    const spotLength = spotLengthRaw ? parseInt(spotLengthRaw, 10) : null;

    rows.push({
      oldCode,
      newCode,
      brandId: brand.id,
      placementId: placement.id,
      campaignName: v[col("campaign name")] || null,
      jobNumber:    v[col("job number")] || null,
      spotTitle:    v[col("spot title")] || "(untitled)",
      description:  v[col("description")] || null,
      airDate:      airDateRaw || null,
      market:       v[col("market")] || null,
      agency:       v[col("agency")] || null,
      language:     v[col("language")] || "English",
      spotLength:   Number.isFinite(spotLength) ? spotLength : null,
      aspectRatio:  v[col("aspect ratio")] || "16:9",
      fileFormat:   v[col("file format")] || "Pro Res",
      audio:        v[col("audio")] || "Stereo LR",
      closedCaptioning: v[col("accessibility")] || "Clean",
      musicRights:  v[col("music rights")] || null,
      createdAt:    createdAtRaw ? new Date(createdAtRaw) : new Date(),
      updatedAt:    v[col("updated at")] ? new Date(v[col("updated at")]) : new Date(),
    });
  }

  console.log(`\nInserting ${rows.length} code(s)...`);
  const now = new Date();
  for (const r of rows) {
    const { oldCode, newCode, ...data } = r;
    await prisma.iSCICode.create({
      data: {
        id: randomUUID(),
        code: newCode,
        ...data,
      },
    });
  }

  console.log(`\nSummary:`);
  console.log(`  inserted: ${rows.length}`);
  console.log(`  errors:   ${errors.length}`);
  if (errors.length) {
    for (const e of errors) console.log(`    row ${e.row} (${e.oldCode}): ${e.error}`);
  }

  console.log(`\nSample of new codes:`);
  rows.slice(0, 10).forEach((r) => console.log(`  ${r.oldCode.padEnd(9)} -> ${r.newCode}`));

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
