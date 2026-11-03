/**
 * Workbook reading: zip, shared strings, sheets and cell grids.
 */

import JSZip from "jszip";
import { parseRange, parseRef } from "./cells.js";
import { parseXml, tagNS } from "./xml.js";

const textOf = (el) => {
  let t = "";
  for (const n of tagNS(el, "t")) {
    if (n.parentNode && n.parentNode.localName === "rPh") continue; // phonetic runs
    t += n.textContent;
  }
  return t;
};

export const readWorkbook = async (buf) => {
  const zip = await JSZip.loadAsync(buf);
  const wbFile = zip.file("xl/workbook.xml");
  if (!wbFile) throw new Error("not-xlsx");
  const wbDoc = parseXml(await wbFile.async("string"));
  const relDoc = parseXml(await zip.file("xl/_rels/workbook.xml.rels").async("string"));
  const rels = {};
  const byType = {};
  for (const r of tagNS(relDoc, "Relationship")) {
    const tgt = r.getAttribute("Target");
    const path = tgt.startsWith("/") ? tgt.slice(1) : "xl/" + tgt.replace(/^\.\//, "");
    rels[r.getAttribute("Id")] = path;
    byType[(r.getAttribute("Type") || "").split("/").pop()] = path;
  }
  const RNS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const sheets = [...tagNS(wbDoc, "sheet")]
    .map((s) => ({
      name: s.getAttribute("name"),
      state: s.getAttribute("state") || "visible",
      path: rels[s.getAttributeNS(RNS, "id") || s.getAttribute("r:id")],
    }))
    .filter((s) => s.path && zip.file(s.path));
  let sst = [];
  if (byType.sharedStrings && zip.file(byType.sharedStrings)) {
    const d = parseXml(await zip.file(byType.sharedStrings).async("string"));
    sst = [...tagNS(d, "si")].map(textOf);
  }
  return { zip, sheets, sst, stylesPath: byType.styles || null };
};

export const readSheet = async (wb, idx) => {
  const xml = await wb.zip.file(wb.sheets[idx].path).async("string");
  const d = parseXml(xml);
  const cells = new Map();
  const hidden = new Set();
  let maxR = 0;
  let maxC = 0;
  let rr = 0;
  for (const row of tagNS(d, "row")) {
    rr = row.getAttribute("r") ? +row.getAttribute("r") : rr + 1;
    if (row.getAttribute("hidden") === "1" || row.getAttribute("hidden") === "true") hidden.add(rr);
    let cc = 0;
    for (const c of row.children) {
      if (c.localName !== "c") continue;
      const ref = parseRef(c.getAttribute("r"));
      cc = ref ? ref.c : cc + 1;
      const t = c.getAttribute("t");
      const vEl = tagNS(c, "v")[0];
      let v = null;
      if (t === "s") v = vEl ? (wb.sst[+vEl.textContent] ?? "") : "";
      else if (t === "inlineStr") {
        const is = tagNS(c, "is")[0];
        v = is ? textOf(is) : "";
      } else if (t === "str" || t === "e") v = vEl ? vEl.textContent : "";
      else if (t === "b") v = vEl ? (vEl.textContent === "1" ? "TRUE" : "FALSE") : "";
      else v = vEl ? Number(vEl.textContent) : null;
      if (v === null || v === "") continue;
      cells.set(rr + "," + cc, v);
      if (rr > maxR) maxR = rr;
      if (cc > maxC) maxC = cc;
    }
  }
  const merges = [...tagNS(d, "mergeCell")].map((m) => parseRange(m.getAttribute("ref"))).filter(Boolean);
  const raw = new Map(cells);
  // Fill merged blocks downward (first column only) so a merged "PLACEMENT" or "Spot Title" applies to every row it spans.
  for (const m of merges) {
    if (m.r2 === m.r1) continue;
    const v = raw.get(m.r1 + "," + m.c1);
    if (v == null) continue;
    for (let r = m.r1 + 1; r <= m.r2; r++) cells.set(r + "," + m.c1, v);
    if (m.r2 > maxR) maxR = m.r2;
  }
  return { cells, raw, maxR, maxC, merges, hidden };
};

export const coveredByMerge = (g, r, c) =>
  g.merges.some((m) => r >= m.r1 && r <= m.r2 && c >= m.c1 && c <= m.c2 && !(r === m.r1 && c === m.c1));
