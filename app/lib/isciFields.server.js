/**
 * Shared ISCI code helpers for the single-edit and bulk-edit endpoints:
 * the GET response shape, edit history parsing, and per-field normalizers.
 */

export const parseEditHistory = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const parseSpotLength = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = parseInt(value);
  return isNaN(parsed) ? null : parsed;
};

// A code row (with brand and placement included) in the shape GET /api/isci returns.
export const toApiCode = (code) => ({
  ...code,
  brand: code.brand.name,
  brandCode: code.brand.code,
  brandColor: code.brand.color || null,
  placement: code.placement
    ? { id: code.placement.id, name: code.placement.name, mediaType: code.placement.mediaType }
    : null,
  editHistory: parseEditHistory(code.editHistory),
});

//////////////////////////////////////
// Editable fields: how each value is stored. Optional text is stored as null when
// empty; the rest are stored as given.

const orNull = (v) => v || null;
const asIs = (v) => v;
const toDate = (v) => (v ? new Date(v) : null);

export const EDITABLE_FIELDS = {
  campaignName: orNull,
  jobNumber: orNull,
  spotTitle: asIs,
  description: orNull,
  language: asIs,
  closedCaptioning: asIs,
  audio: asIs,
  fileFormat: asIs,
  airDate: orNull, // ISO date string, or "TBD"
  musicRights: orNull,
  agency: orNull,
  market: orNull,
  platform: orNull,
  completedAt: toDate,
};

// Identity of each cut: never edited in bulk.
export const IDENTITY_FIELDS = ["code", "brandId", "placementId", "spotLength", "aspectRatio"];

// Returns an error message for a value that can't be stored in `field`, or null.
export const checkFieldValue = (field, value) => {
  const required = ["spotTitle", "language", "closedCaptioning", "audio", "fileFormat"].includes(field);
  if (value === null || value === undefined || value === "") {
    return required ? `${field} cannot be empty` : null;
  }
  if (field === "completedAt") {
    return typeof value === "string" && !isNaN(new Date(value).getTime()) ? null : "completedAt must be a date or null";
  }
  if (typeof value !== "string") return `${field} must be text`;
  if (required && !value.trim()) return `${field} cannot be empty`;
  if (field === "airDate" && value !== "TBD" && isNaN(new Date(value).getTime())) {
    return "airDate must be a date or TBD";
  }
  return null;
};
