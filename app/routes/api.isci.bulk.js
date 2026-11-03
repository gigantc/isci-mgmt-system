/**
 * API Route: PUT /api/isci/bulk
 *
 * Applies the same field changes to many ISCI codes in one transaction.
 * Body: { ids: [...], changes: { field: value }, updatedBy? }
 * Only the fields in `changes` are written. Identity fields (code, client,
 * placement, length, aspect ratio) are rejected. Like the other ISCI endpoints
 * there is no server-side session; role checks live in the client.
 */

import { prisma } from "@/lib/prisma";
import {
  EDITABLE_FIELDS,
  IDENTITY_FIELDS,
  checkFieldValue,
  parseEditHistory,
  toApiCode,
} from "@/lib/isciFields.server";

const MAX_IDS = 500;

const fail = (message, extra = {}) => Object.assign(new Error(message), { status: 400, ...extra });

// Throws a 400 error for anything outside the allowlist or with a bad value.
const parseBody = (data) => {
  if (!data || typeof data !== "object") throw fail("Invalid request body");
  const { ids, changes } = data;
  if (!Array.isArray(ids) || ids.length === 0) throw fail("ids is required");
  if (ids.length > MAX_IDS) throw fail(`At most ${MAX_IDS} codes per request`);
  if (new Set(ids).size !== ids.length) throw fail("ids must be unique");
  if (ids.some((id) => typeof id !== "string" || !id)) throw fail("ids must be strings");
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) throw fail("changes is required");
  const fields = Object.keys(changes);
  if (fields.length === 0) throw fail("changes is empty");
  for (const field of fields) {
    if (IDENTITY_FIELDS.includes(field)) throw fail(`${field} cannot be changed in bulk`);
    if (!(field in EDITABLE_FIELDS)) throw fail(`${field} is not a bulk-editable field`);
    const problem = checkFieldValue(field, changes[field]);
    if (problem) throw fail(problem);
  }
  return { ids, changes, fields, updatedBy: data.updatedBy ? String(data.updatedBy) : null };
};

export async function action({ request }) {
  if (request.method !== "PUT") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }
  try {
    const { ids, changes, fields, updatedBy } = parseBody(await request.json());
    const values = Object.fromEntries(fields.map((f) => [f, EDITABLE_FIELDS[f](changes[f])]));

    const codes = await prisma.$transaction(async (tx) => {
      const found = await tx.iSCICode.findMany({ where: { id: { in: ids } }, select: { id: true, editHistory: true, completedAt: true } });
      const have = new Set(found.map((c) => c.id));
      const missing = ids.filter((id) => !have.has(id));
      if (missing.length) throw fail(`ISCI codes not found: ${missing.join(", ")}`, { missing });

      const now = new Date();
      const updated = [];
      for (const row of found) {
        // Setting a completion date never overwrites one that is already there;
        // clearing (null) applies to every code.
        const rowFields = fields.filter((f) => !(f === "completedAt" && values.completedAt !== null && row.completedAt));
        const rowValues = Object.fromEntries(rowFields.map((f) => [f, values[f]]));
        const history = parseEditHistory(row.editHistory);
        if (rowFields.length === 0) {
          updated.push(await tx.iSCICode.findUnique({ where: { id: row.id }, include: { brand: true, placement: true } }));
          continue;
        }
        history.push({ user: updatedBy, timestamp: now.toISOString(), bulk: true, count: ids.length, fields: rowFields });
        updated.push(
          await tx.iSCICode.update({
            where: { id: row.id },
            data: { ...rowValues, updatedAt: now, ...(updatedBy && { updatedBy }), editHistory: JSON.stringify(history) },
            include: { brand: true, placement: true },
          })
        );
      }
      return updated;
    });

    return Response.json({ success: true, count: codes.length, isciCodes: codes.map(toApiCode) });
  } catch (error) {
    if (error.status === 400) {
      return Response.json({ success: false, error: error.message, missing: error.missing }, { status: 400 });
    }
    console.error("Error in ISCI bulk API:", error);
    return Response.json({ success: false, error: "Failed to update ISCI codes" }, { status: 500 });
  }
}
