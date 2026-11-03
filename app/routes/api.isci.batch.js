/**
 * API Route: POST /api/isci/batch
 *
 * Assigns ISCI codes to a batch of matrix rows in one transaction. Matching
 * existing codes are reused, the rest are allocated. With preview: true nothing
 * is written. The workbook must be written from the non-preview response.
 *
 * Like the other ISCI endpoints there is no server-side session; role checks
 * live in the client (Tools page).
 */

import { prisma } from "@/lib/prisma";
import { assignBatch } from "@/lib/isciBatch.server";

const MAX_ROWS = 500;
const MAX_ATTEMPTS = 5;

const clean = (v) => (v == null || v === "" ? null : String(v).trim());

// Validates and normalizes the body; throws Error with `.status` 400.
const parseBody = (data) => {
  const fail = (message) => Object.assign(new Error(message), { status: 400 });
  if (!data || typeof data !== "object") throw fail("Invalid request body");
  if (!data.brandId) throw fail("brandId is required");
  const year = Number(data.year);
  if (!Number.isInteger(year) || year < 2000 || year > 2099) throw fail("year must be a four digit year");
  if (!Array.isArray(data.rows) || data.rows.length === 0) throw fail("rows is required");
  if (data.rows.length > MAX_ROWS) throw fail(`At most ${MAX_ROWS} rows per request`);
  const keys = new Set();
  const rows = data.rows.map((r) => {
    if (r.key == null || keys.has(r.key)) throw fail("Every row needs a unique key");
    keys.add(r.key);
    if (!r.placementId) throw fail(`Row ${r.key}: placementId is required`);
    if (!clean(r.spotTitle)) throw fail(`Row ${r.key}: spotTitle is required`);
    const spotLength = r.spotLength == null || r.spotLength === "" ? null : Number(r.spotLength);
    if (spotLength !== null && !Number.isInteger(spotLength)) throw fail(`Row ${r.key}: spotLength must be whole seconds`);
    return {
      key: r.key,
      placementId: r.placementId,
      spotTitle: clean(r.spotTitle),
      spotLength,
      aspectRatio: clean(r.aspectRatio),
      language: clean(r.language),
      platform: clean(r.platform),
    };
  });
  return {
    brandId: data.brandId,
    year,
    campaignName: clean(data.campaignName),
    jobNumber: clean(data.jobNumber),
    matrixCodes: Array.isArray(data.matrixCodes) ? data.matrixCodes.map(String) : [],
    createdBy: clean(data.createdBy),
    preview: data.preview === true,
    rows,
  };
};

export async function action({ request }) {
  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }
  try {
    const input = parseBody(await request.json());
    for (let attempt = 1; ; attempt++) {
      try {
        const { results } = await prisma.$transaction((tx) => assignBatch(tx, input), { timeout: 30000 });
        return Response.json({ success: true, preview: input.preview, results });
      } catch (error) {
        // A concurrent create can take the same sequence; the unique index rejects ours, so retry.
        if (error.code === "P2002" && attempt < MAX_ATTEMPTS) continue;
        throw error;
      }
    }
  } catch (error) {
    if (error.status === 400) return Response.json({ success: false, error: error.message }, { status: 400 });
    console.error("Error in ISCI batch API:", error);
    return Response.json({ success: false, error: "Failed to assign ISCI codes" }, { status: 500 });
  }
}
