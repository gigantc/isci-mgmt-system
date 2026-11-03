/**
 * ISCI code allocation and server-side checks. Pass the Prisma transaction
 * client (or the prisma instance) as `tx`.
 */

import { formatISCI, isciKey, nextSequence, parseISCI } from "@/utils/isci";

// All stored codes for a client, new-format and legacy SO.
const clientCodes = async (tx, clientCode, excludeId) => {
  const rows = await tx.iSCICode.findMany({
    where: {
      OR: [{ code: { startsWith: clientCode } }, { code: { startsWith: `SO${clientCode}` } }],
      ...(excludeId && { NOT: { id: excludeId } }),
    },
    select: { code: true },
  });
  return rows.map((r) => r.code);
};

// Returns `count` consecutive new codes for the brand + placement media type.
export const allocateCodes = async (tx, { brandId, placementId, yy, count = 1 }) => {
  const [brand, placement] = await Promise.all([
    tx.brand.findUnique({ where: { id: brandId } }),
    tx.placement.findUnique({ where: { id: placementId } }),
  ]);
  if (!brand) throw new Error("Client not found");
  if (!placement) throw new Error("Placement not found");

  const year = String(yy).padStart(2, "0");
  const first = nextSequence(await clientCodes(tx, brand.code), brand.code, placement.mediaType, year);
  return Array.from({ length: count }, (_, i) =>
    formatISCI({ client: brand.code, type: placement.mediaType, yy: year, seq: first + i })
  );
};

// Format, client and media type checks (no database). Returns an error message or null.
export const checkCodeShape = ({ code, brand, placement }) => {
  const parsed = parseISCI(code);
  if (!parsed) return "Invalid ISCI code format";
  if (parsed.client !== brand.code) return `Code must start with the client code ${brand.code}`;
  if (parsed.type !== placement.mediaType) return `Code media type must be ${placement.mediaType} for ${placement.name}`;
  return null;
};

// Existing row with the same identity as `code` (see isciKey), or null.
export const findExistingCode = async (tx, code, excludeId) => {
  const parsed = parseISCI(code);
  if (!parsed) return null;
  const wanted = isciKey(code);
  const rows = await tx.iSCICode.findMany({
    where: {
      OR: [{ code: { startsWith: parsed.client } }, { code: { startsWith: `SO${parsed.client}` } }],
      ...(excludeId && { NOT: { id: excludeId } }),
    },
    select: { id: true, code: true },
  });
  return rows.find((r) => isciKey(r.code) === wanted) || null;
};

// Shape checks plus the duplicate check, for creating or renaming one code.
export const checkCode = async (tx, { code, brand, placement, excludeId }) => {
  const problem = checkCodeShape({ code, brand, placement });
  if (problem) return problem;
  return (await findExistingCode(tx, code, excludeId)) ? "ISCI code already exists" : null;
};
