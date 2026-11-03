/**
 * Header detection and row extraction from a sheet grid, plus the grouping and
 * value maps the Tune-up step edits.
 */

import { findISCICodes, isciKey } from "../../../../utils/isci.js"; // relative with extension: node tests load this file
import { isBlank, str } from "./cells.js";
import { normLen, normSize, langName, placementLang, partnerShort, seg, suggestMedia, suggestPlatform } from "./normalize.js";
import { coveredByMerge } from "./read.js";

export const HDR = [
  ["isci", /\bisci/i], ["filename", /file\s*-?\s*name/i], ["length", /length|duration|\bdur\b|\blen\b|run\s*time|seconds/i],
  ["aspect", /aspect|ratio|\bsize\b|dimension|format/i], ["language", /lang|market/i],
  ["placement", /placement|media|channel|tactic/i], ["partner", /^(?!.*(review|legal|approv)).*(partner|vendor|publisher|platform|network|\bsite\b)/i],
  ["title", /title|creative|spot\s*name|version|\bspot\b/i], ["notes", /\bnotes?\b|comments?/i], ["specs", /\bspecs?\b|specification/i],
];

export const detectHeader = (g) => {
  let best = null;
  for (let r = 1; r <= Math.min(40, g.maxR); r++) {
    const cols = {};
    let score = 0;
    for (let c = 1; c <= g.maxC; c++) {
      const v = g.raw.get(r + "," + c);
      if (typeof v !== "string") continue;
      for (const [k, rx] of HDR) {
        if (!cols[k] && rx.test(v)) {
          cols[k] = c;
          score++;
          break;
        }
      }
    }
    if (score >= 3 && (!best || score > best.score)) best = { row: r, cols, score };
  }
  if (!best) return null;
  if (best.cols.isci && !best.cols.filename) best.cols.filename = best.cols.isci; // combined column
  let lastCol = 0;
  for (let c = 1; c <= g.maxC; c++) if (!isBlank(g.raw.get(best.row + "," + c))) lastCol = c;
  best.lastCol = lastCol;
  return best;
};

export const findJobCell = (g, hdrRow) => {
  for (let r = 1; r <= Math.max(1, (hdrRow || 6) - 1); r++) {
    for (let c = 1; c <= Math.min(g.maxC, 30); c++) {
      const v = g.raw.get(r + "," + c);
      if (typeof v === "string" && /job\s*(number|num|no\.?|#|code)/i.test(v)) return { r, c, text: v };
    }
  }
  return null;
};

// Rows with kind "spot" (needs a code), "filled" (already has an ISCI, skipped)
// or "note" (language/title only, never tagged).
export const extractRows = (g, hdr) => {
  const col = hdr.cols;
  const out = [];
  const get = (r, c) => (c ? g.cells.get(r + "," + c) : undefined);
  let curPl = "";
  let curTitle = "";
  let curPartner = "";
  let curSpecs = "";
  const partnerCol = col.partner || col.notes; // the R&R template keeps the partner (Sojern, Hulu, Comcast...) in NOTES
  for (let r = hdr.row + 1; r <= g.maxR; r++) {
    const pl = str(get(r, col.placement));
    const len = get(r, col.length);
    const asp = get(r, col.aspect);
    const ti = str(get(r, col.title));
    const la = str(get(r, col.language));
    const paRaw = get(r, partnerCol);
    const spRaw = get(r, col.specs);
    const pa = paRaw == null ? "" : String(paRaw);
    if (pl && pl !== curPl) {
      curPl = pl;
      curTitle = "";
      curPartner = "";
      curSpecs = "";
    }
    if (spRaw != null && String(spRaw).trim()) curSpecs = String(spRaw);
    if (ti) curTitle = ti;
    if (pa.trim()) curPartner = pa;
    const hasLen = !isBlank(len);
    const hasAsp = !isBlank(asp);
    const iscCol = col.isci && col.isci !== "new" ? col.isci : null;
    let existing = iscCol ? str(g.raw.get(r + "," + iscCol)) : "";
    let where = existing ? iscCol : null;
    const fnCol = col.filename && col.filename !== "new" && col.filename !== iscCol ? col.filename : null;
    if (!existing && fnCol && str(g.raw.get(r + "," + fnCol))) {
      existing = str(g.raw.get(r + "," + fnCol));
      where = fnCol;
    }
    if (!existing) {
      // A code typed anywhere else on the row (filename, link or notes column) still means this spot is done.
      for (let c = 1; c <= g.maxC && !existing; c++) {
        const v = g.raw.get(r + "," + c);
        if (typeof v === "string") {
          const found = findISCICodes(v);
          if (found.length) {
            existing = found[0].raw;
            where = c;
          }
        }
      }
    }
    const codes = existing ? findISCICodes(existing).map((f) => f.raw) : [];
    if (codes.length) existing = codes[0];
    if (!hasLen && !hasAsp) {
      const rowPl = str(g.raw.get(r + "," + col.placement));
      if (!rowPl && (la || str(g.raw.get(r + "," + col.title)))) {
        out.push({
          r, kind: "note", placement: curPl, partner: partnerShort(curPartner), title: curTitle, lenRaw: "", aspRaw: "", langRaw: la,
          existing, codes, where, include: false, hidden: g.hidden.has(r), why: "No length or size",
        });
      }
      continue;
    }
    if (iscCol && coveredByMerge(g, r, iscCol)) continue;
    out.push({
      r, kind: existing ? "filled" : "spot", placement: curPl, partner: partnerShort(curPartner), specs: partnerShort(curSpecs), title: curTitle,
      lenRaw: len, aspRaw: asp, langRaw: la, existing, codes, where, include: !existing, hidden: g.hidden.has(r),
      why: existing ? "Already has an ISCI" : "",
    });
  }
  return out;
};

const mostCommon = (arr) => {
  const m = new Map();
  arr.forEach((x) => m.set(x, (m.get(x) || 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0][0];
};

// Groups rows by placement + partner and builds the editable value maps.
// `prev` keeps a user's earlier choices (media, platform, on) when rows are re-extracted.
// Mutates rows with their group/map keys (gk, tk, lk, lenK, szK).
export const buildMaps = (rows, prev = {}) => {
  const groups = {};
  const order = [];
  const titles = {};
  const langs = {};
  const lens = {};
  const sizes = {};
  for (const row of rows) {
    const gk = row.placement + "¦" + row.partner;
    row.gk = gk;
    if (!groups[gk]) {
      const p = prev[gk];
      groups[gk] = {
        placement: row.placement,
        partner: row.partner,
        media: p ? p.media : suggestMedia(row.placement, row.partner),
        platform: p ? p.platform : suggestPlatform(row.placement, row.partner, row.specs),
        on: p ? p.on : !/\bsrt\b/i.test(row.placement),
        n: 0,
        filled: 0,
      };
      order.push(gk);
    }
    if (row.include) groups[gk].n++;
    if (row.kind === "filled") groups[gk].filled++;
    const tk = row.title.toLowerCase();
    row.tk = tk;
    (titles[tk] = titles[tk] || { variants: [], label: "" }).variants.push(row.title);
    if (!str(row.langRaw) && placementLang(row.placement)) {
      row.langRaw = row.placement.replace(/\s+/g, " ");
      row.langFromPl = true;
    }
    row.lk = str(row.langRaw);
    if (!(row.lk in langs)) langs[row.lk] = row.langFromPl ? placementLang(row.lk) : langName(row.lk);
    row.lenK = typeof row.lenRaw === "number" ? "#" + row.lenRaw : str(row.lenRaw);
    if (!(row.lenK in lens)) lens[row.lenK] = { raw: row.lenRaw, value: normLen(row.lenRaw) };
    row.szK = typeof row.aspRaw === "number" ? "#" + row.aspRaw : str(row.aspRaw);
    if (!(row.szK in sizes)) sizes[row.szK] = { raw: row.aspRaw, value: normSize(row.aspRaw) };
  }
  for (const k in titles) titles[k].label = seg(mostCommon(titles[k].variants));
  return { groups, order, titles, langs, lens, sizes };
};

// Every ISCI code already in the matrix (sent to the batch API so they count as taken).
export const matrixCodes = (rows) => {
  const seen = new Set();
  return rows.flatMap((r) => r.codes || []).filter((c) => !seen.has(isciKey(c)) && seen.add(isciKey(c)));
};

// Rows that get a code now: included, group switched on, not skipped.
export const activeRows = (rows, maps, skip = new Set()) =>
  rows.filter((r) => r.include && maps.groups[r.gk] && maps.groups[r.gk].on && !skip.has(r.r));

// API rows for POST /api/isci/batch. `placementByMedia` maps T/D/R to a placementId
// (defaults from the group's media; pass group.placementId to override per group).
export const toBatchRows = (rows, maps, placements, skip = new Set()) =>
  activeRows(rows, maps, skip).map((row) => {
    const g = maps.groups[row.gk];
    const placement = g.placementId
      ? placements.find((p) => p.id === g.placementId)
      : placements.find((p) => p.active !== false && p.mediaType === g.media);
    return {
      key: row.r,
      placementId: placement ? placement.id : null,
      spotTitle: maps.titles[row.tk] ? maps.titles[row.tk].label : seg(row.title),
      spotLength: maps.lens[row.lenK] ? maps.lens[row.lenK].value : null,
      aspectRatio: maps.sizes[row.szK] ? maps.sizes[row.szK].value : null,
      language: maps.langs[row.lk] || "English",
      platform: g.platform || null,
    };
  });
