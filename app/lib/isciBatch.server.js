/**
 * Batch assignment for the Matrix tool: reuse existing codes that match a row
 * exactly, allocate new ones for the rest. Runs inside one Prisma transaction.
 */

import { formatISCI, isciKey, nextSequence, parseISCI } from "@/utils/isci";

const AUDIO = { T: "Broadcast", D: "Digital", R: "Stereo LR" };
const FILE_FORMAT = { T: "Pro Res", D: "MP4", R: "WAV" };
const DEFAULT_ASPECT = "16:9";
const DEFAULT_LANGUAGE = "English";

const same = (a, b) => (a ?? null) === (b ?? null);

// A stored code matches a row when client, year, media type, title, length,
// aspect, language and platform all agree.
const matches = (rec, parsed, row, type, yy) =>
  parsed.type === type &&
  parsed.yy === yy &&
  rec.spotTitle.trim() === row.spotTitle.trim() &&
  same(rec.spotLength, row.spotLength ?? null) &&
  (rec.aspectRatio || DEFAULT_ASPECT) === (row.aspectRatio || DEFAULT_ASPECT) &&
  (rec.language || DEFAULT_LANGUAGE) === (row.language || DEFAULT_LANGUAGE) &&
  same(rec.platform || null, row.platform || null);

/**
 * @returns {Promise<{ results: {key, code, reused, row}[], brand }>}
 *   Writes records unless preview is true. Throws Error with `.status` 400 on bad input.
 */
export const assignBatch = async (tx, { brandId, year, campaignName, jobNumber, matrixCodes = [], rows, preview, createdBy = null }) => {
  const fail = (message) => Object.assign(new Error(message), { status: 400 });

  const brand = await tx.brand.findUnique({ where: { id: brandId } });
  if (!brand) throw fail("Client not found");
  const placements = await tx.placement.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.placementId))] } } });
  const placementById = new Map(placements.map((p) => [p.id, p]));
  for (const row of rows) if (!placementById.has(row.placementId)) throw fail(`Placement not found for row ${row.key}`);

  const yy = String(year).slice(-2).padStart(2, "0");
  const dbRecords = await tx.iSCICode.findMany({
    where: { OR: [{ code: { startsWith: brand.code } }, { code: { startsWith: `SO${brand.code}` } }] },
    select: { id: true, code: true, spotTitle: true, spotLength: true, aspectRatio: true, language: true, platform: true },
  });

  // Codes already sitting in the matrix are taken: never reused, always counted for the sequence.
  const matrixKeys = new Set(matrixCodes.map((c) => isciKey(c)).filter(Boolean));
  const used = new Set();
  const assigned = new Map(); // row.key -> { code, reused }

  rows.forEach((row) => {
    const type = placementById.get(row.placementId).mediaType;
    const hit = dbRecords.find((rec) => {
      const parsed = parseISCI(rec.code);
      if (!parsed || parsed.client !== brand.code) return false;
      const key = isciKey(rec.code);
      return !used.has(key) && !matrixKeys.has(key) && matches(rec, parsed, row, type, yy);
    });
    if (hit) {
      used.add(isciKey(hit.code));
      assigned.set(row.key, { code: hit.code, reused: true });
    }
  });

  const taken = [...dbRecords.map((r) => r.code), ...matrixCodes];
  rows.forEach((row) => {
    if (assigned.has(row.key)) return;
    const type = placementById.get(row.placementId).mediaType;
    const seq = nextSequence(taken, brand.code, type, yy);
    const code = formatISCI({ client: brand.code, type, yy, seq });
    taken.push(code);
    assigned.set(row.key, { code, reused: false });
  });

  const results = rows.map((row) => ({ key: row.key, ...assigned.get(row.key) }));

  if (!preview) {
    const now = new Date();
    for (const row of rows) {
      const { code, reused } = assigned.get(row.key);
      if (reused) continue;
      const type = placementById.get(row.placementId).mediaType;
      await tx.iSCICode.create({
        data: {
          id: crypto.randomUUID(),
          code,
          brandId: brand.id,
          placementId: row.placementId,
          campaignName: campaignName || null,
          jobNumber: jobNumber || null,
          spotTitle: row.spotTitle,
          spotLength: row.spotLength ?? null,
          language: row.language || DEFAULT_LANGUAGE,
          closedCaptioning: "Clean",
          audio: AUDIO[type],
          fileFormat: FILE_FORMAT[type],
          aspectRatio: row.aspectRatio || DEFAULT_ASPECT,
          platform: row.platform || null,
          createdBy,
          updatedBy: createdBy,
          editHistory: "[]",
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  }

  return { results, brand };
};
