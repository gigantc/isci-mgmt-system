/**
 * Filename builder shared by ISCIForm and the Matrix tool.
 *
 * data: { code, brand (client NAME), campaignName, spotTitle, language,
 *         spotLength (seconds), aspectRatio ("16:9"), placementName }
 * Missing segments render as "[Label]" so callers can tell the name is incomplete.
 * The platform is intentionally not part of the filename.
 */

import { fileNameCode } from "./isci.js";

// Sanitize a piece of the auto-generated File Name: strip characters that
// are awkward in filenames, replace spaces with underscores, collapse repeats.
const sanitizeFileNameSegment = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .trim()
    .replace(/[^A-Za-z0-9\s\-]/g, "") // drop punctuation, keep letters/digits/space/hyphen
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");
};

const FILE_NAME_TEMPLATE = [
  { key: "code",         label: "ISCI",         get: (d) => (d.code ? fileNameCode(d.code) : "") },
  { key: "brand",        label: "Client",       get: (d) => d.brand },
  { key: "campaignName", label: "Campaign",     get: (d) => d.campaignName },
  { key: "spotTitle",    label: "Spot Title",   get: (d) => d.spotTitle },
  { key: "language",     label: "Language",     get: (d) => d.language },
  { key: "spotLength",   label: "Length",       get: (d) => (d.spotLength ? `${d.spotLength}s` : "") },
  { key: "aspectRatio",  label: "Aspect Ratio", get: (d) => (d.aspectRatio ? String(d.aspectRatio).replace(":", "-") : "") },
  { key: "placement",    label: "Placement",    get: (d) => d.placementName },
];

// skipEmpty drops segments with no value instead of showing a "[Label]" placeholder.
export const buildFileName = (data, { skipEmpty = false } = {}) => {
  return FILE_NAME_TEMPLATE
    .map((seg) => {
      const clean = sanitizeFileNameSegment(seg.get(data));
      return clean || (skipEmpty ? "" : `[${seg.label}]`);
    })
    .filter((part) => part !== "")
    .join("_");
};
