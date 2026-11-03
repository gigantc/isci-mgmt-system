/**
 * ISCI code rules (pure, safe on client and server).
 *
 * Format: CLIENT(3) + MEDIA TYPE(1) + "-" + YY + SEQ, plus "H" for media type T.
 *   LVCT-2517H (broadcast), LVCD-2517 (digital), LVCR-2517 (radio), LVCD-25100.
 *   SEQ pads to 2 digits for 1-99 and uses 3 digits from 100.
 *   Media types: T = Broadcast, D = Digital (social, CTV, streaming, everything
 *   not broadcast or radio), R = Radio.
 *
 * Sequence is independent per (client, media type, 2-digit year).
 *
 * Legacy codes: "SO" + 3-4 letters + optional "-" + YY + SEQ (SOLVC-2517,
 * SOLVC2517, SOLVCV-2517). The client is the first 3 letters; the full prefix is
 * kept as `legacyPrefix`.
 * They are retired for new codes but stay valid forever and are never changed.
 * A legacy code counts toward that client's D sequence for its year.
 *
 * The hyphen and the broadcast "H" are pending with media (see ISCI_HYPHEN and
 * ISCI_BROADCAST_H in app/config.js). Those only control what we GENERATE;
 * parsing accepts either. Two codes that differ only by the hyphen are the same
 * code. Duplicates are decided by identity (isciKey: client, type, yy, seq, with
 * legacy as D), so LVCT2517 duplicates LVCT-2517H and SOLVC-2517 duplicates
 * LVCD-2517. Filenames never include the hyphen.
 */

// Explicit extension: this file is also loaded by node scripts (seed).
import { ISCI_HYPHEN, ISCI_BROADCAST_H } from "./isciSettings.js";

export const MEDIA_TYPES = [
  { value: "T", label: "Broadcast" },
  { value: "D", label: "Digital" },
  { value: "R", label: "Radio" },
];

const CODE_RE = /^([A-Z]{3})([TDR])(-?)(\d{2})(\d{2,3})(H?)$/;
const LEGACY_RE = /^SO([A-Z]{3,4})(-?)(\d{2})(\d{2,3})$/;

const pad = (seq) => (seq < 100 ? String(seq).padStart(2, "0") : String(seq));

export const formatISCI = ({ client, type, yy, seq }, { hyphen = ISCI_HYPHEN, broadcastH = ISCI_BROADCAST_H } = {}) =>
  `${client}${type}${hyphen ? "-" : ""}${String(yy).padStart(2, "0")}${pad(seq)}${type === "T" && broadcastH ? "H" : ""}`;

export const parseISCI = (code) => {
  const value = String(code || "").trim().toUpperCase();
  let m = value.match(CODE_RE);
  if (m) {
    // "H" belongs to broadcast only.
    if (m[6] && m[2] !== "T") return null;
    return { client: m[1], type: m[2], yy: m[4], seq: Number(m[5]), legacy: false, hasHyphen: !!m[3], hasH: !!m[6] };
  }
  m = value.match(LEGACY_RE);
  if (m) {
    return {
      client: m[1].slice(0, 3),
      type: "D",
      yy: m[3],
      seq: Number(m[4]),
      legacy: true,
      legacyPrefix: m[1],
      hasHyphen: !!m[2],
      hasH: false,
    };
  }
  return null;
};

export const normalizeISCI = (code) => String(code || "").trim().toUpperCase().replace(/-/g, "");

// Identity of a code, ignoring hyphen, H and the SO prefix. Null when invalid.
export const isciKey = (code) => {
  const p = parseISCI(code);
  return p ? `${p.client}|${p.type}|${p.yy}|${p.seq}` : null;
};

// Same code by identity (exact string match covers codes that don't parse).
export const sameISCI = (a, b) => a === b || (isciKey(a) !== null && isciKey(a) === isciKey(b));

export const isValidISCI = (code) => parseISCI(code) !== null;

export const fileNameCode = (code) => normalizeISCI(code);

// Every ISCI code found in free text (a cell, a filename line), in order. Tolerates
// spaces around the hyphen and underscores or whitespace between tokens.
export const findISCICodes = (text) => {
  const out = [];
  const tokens = String(text || "").toUpperCase().replace(/\s*-\s*/g, "-").split(/[^A-Z0-9-]+/);
  for (const token of tokens) {
    const raw = token.replace(/^-+|-+$/g, "");
    const parsed = raw && parseISCI(raw);
    if (parsed) out.push({ raw, ...parsed });
  }
  return out;
};

// Next free sequence for (client, type, yy). Legacy SO codes count as D.
export const nextSequence = (existingCodes, client, type, yy) => {
  const year = String(yy).padStart(2, "0");
  let max = 0;
  for (const existing of existingCodes) {
    const p = parseISCI(existing);
    if (p && p.client === client && p.type === type && p.yy === year && p.seq > max) max = p.seq;
  }
  return max + 1;
};
