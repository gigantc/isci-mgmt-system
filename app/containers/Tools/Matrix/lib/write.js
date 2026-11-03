/**
 * Surgical XLSX writer: patches only the cells we fill in the sheet XML so the
 * template's formatting, comments and hidden tabs survive.
 */

import JSZip from "jszip";
import { colLet, colNum, xmlEsc } from "./cells.js";

export const setAttr = (tag, name, val) => {
  const rx = new RegExp("\\s" + name + '="[^"]*"');
  if (val == null) return tag.replace(rx, "");
  return rx.test(tag) ? tag.replace(rx, ` ${name}="${val}"`) : tag.replace(/^(<\w+)/, `$1 ${name}="${val}"`);
};

export const getAttr = (tag, name) => {
  const m = new RegExp("\\s" + name + '="([^"]*)"').exec(tag);
  return m ? m[1] : null;
};

// Adds wrapText copies of cell styles on demand so two-line cells show both lines.
export const makeStyler = (stylesXml) => {
  let xml = stylesXml;
  let added = 0;
  const cache = {};
  const blockRx = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/;
  return {
    wrap(s) {
      if (!xml) return s;
      const k = String(s || 0);
      if (k in cache) return cache[k];
      const m = blockRx.exec(xml);
      if (!m) return s;
      const xfs = m[1].match(/<xf\b[^>]*\/>|<xf\b[^>]*>[\s\S]*?<\/xf>/g) || [];
      const base = xfs[+k] || xfs[0];
      if (!base) return s;
      if (/wrapText="(1|true)"/.test(base)) {
        cache[k] = s;
        return s;
      }
      let nx;
      if (/<alignment\b/.test(base)) {
        nx = base.replace(/<alignment\b([^>]*?)(\/?)>/, (a, attrs, sl) => `<alignment${attrs.replace(/\swrapText="[^"]*"/, "")} wrapText="1"${sl}>`);
      } else if (/\/>$/.test(base)) nx = base.replace(/\/>$/, '><alignment wrapText="1"/></xf>');
      else nx = base.replace(/^(<xf\b[^>]*>)/, '$1<alignment wrapText="1"/>');
      nx = nx.replace(/^<xf\b[^>]*>|^<xf\b[^>]*\/>/, (t) => setAttr(t, "applyAlignment", "1"));
      const idx = xfs.length;
      xml = xml.replace(blockRx, (all, inner) =>
        all.replace(inner + "</cellXfs>", inner + nx + "</cellXfs>").replace(/(<cellXfs\b[^>]*?)\scount="\d+"/, `$1 count="${idx + 1}"`)
      );
      added++;
      cache[k] = String(idx);
      return cache[k];
    },
    get xml() {
      return xml;
    },
    get changed() {
      return added > 0;
    },
  };
};

export const cellXml = (ref, s, text) =>
  `<c r="${ref}"${s != null ? ` s="${s}"` : ""} t="inlineStr"><is><t xml:space="preserve">${xmlEsc(text)}</t></is></c>`;

export const ensureColWidth = (head, c, w) => {
  const colsM = /<cols>([\s\S]*?)<\/cols>/.exec(head);
  const mk = (mn, mx, attrs) => `<col min="${mn}" max="${mx}"${attrs}/>`;
  if (!colsM) return head + `<cols><col min="${c}" max="${c}" width="${w}" customWidth="1"/></cols>`;
  const cols = colsM[1].match(/<col\b[^>]*\/>/g) || [];
  const hit = cols.find((t) => +getAttr(t, "min") <= c && +getAttr(t, "max") >= c);
  let next;
  if (!hit) {
    const idx = cols.findIndex((t) => +getAttr(t, "min") > c);
    const nc = `<col min="${c}" max="${c}" width="${w}" customWidth="1"/>`;
    if (idx < 0) cols.push(nc);
    else cols.splice(idx, 0, nc);
    next = cols;
  } else {
    const cur = parseFloat(getAttr(hit, "width") || "0");
    if (cur >= w) return head;
    const mn = +getAttr(hit, "min");
    const mx = +getAttr(hit, "max");
    const attrs = hit.replace(/^<col\b/, "").replace(/\/>$/, "").replace(/\s(min|max)="[^"]*"/g, "");
    const mid = setAttr(setAttr(mk(c, c, attrs), "width", String(w)), "customWidth", "1");
    const rep = [];
    if (mn < c) rep.push(mk(mn, c - 1, attrs));
    rep.push(mid);
    if (mx > c) rep.push(mk(c + 1, mx, attrs));
    next = cols.flatMap((t) => (t === hit ? rep : [t]));
  }
  return head.replace(colsM[0], "<cols>" + next.join("") + "</cols>");
};

// edits: [{ r, c, text, wrap?, lines?, styleFrom? }]
export const patchSheet = (xml, edits, styler, colWidths) => {
  if (/<sheetData\s*\/>/.test(xml)) xml = xml.replace(/<sheetData\s*\/>/, "<sheetData></sheetData>");
  const a = xml.indexOf("<sheetData");
  const aEnd = xml.indexOf(">", a) + 1;
  const b = xml.indexOf("</sheetData>");
  let head = xml.slice(0, a);
  const open = xml.slice(a, aEnd);
  let body = xml.slice(aEnd, b);
  const tail = xml.slice(b);
  const parts = body.split(/(<row\b[^>]*\/>|<row\b[^>]*>[\s\S]*?<\/row>)/);
  const rowIdx = new Map();
  parts.forEach((p, i) => {
    if (p.startsWith("<row")) {
      const r = getAttr(p.match(/^<row\b[^>]*>/)[0], "r");
      if (r) rowIdx.set(+r, i);
    }
  });
  const byRow = new Map();
  edits.forEach((e) => {
    if (!byRow.has(e.r)) byRow.set(e.r, []);
    byRow.get(e.r).push(e);
  });
  const newRows = [];
  for (const [r, list] of byRow) {
    const i = rowIdx.get(r);
    const rowStr = i == null ? `<row r="${r}"></row>` : parts[i];
    let openTag = rowStr.match(/^<row\b[^>]*?\/?>/)[0];
    let content = openTag.endsWith("/>") ? "" : rowStr.slice(openTag.length, rowStr.length - 6);
    if (openTag.endsWith("/>")) openTag = openTag.replace(/\s*\/>$/, ">");
    let inserted = false;
    let needHt = 0;
    for (const e of list) {
      const ref = colLet(e.c) + r;
      const cellRx = new RegExp(`<c\\b[^>]*?\\sr="${ref}"[^>]*?(?:\\/>|>[\\s\\S]*?<\\/c>)`);
      const m = cellRx.exec(content);
      let s = m ? getAttr(m[0].match(/^<c\b[^>]*>/)[0], "s") : null;
      if (!m && e.styleFrom) {
        const m2 = new RegExp(`<c\\b[^>]*?\\sr="${colLet(e.styleFrom) + r}"[^>]*?>`).exec(content);
        if (m2) s = getAttr(m2[0], "s");
      }
      if (e.wrap) {
        s = styler.wrap(s);
        needHt = Math.max(needHt, e.lines * 15 + 2);
      }
      const nc = cellXml(ref, s, e.text);
      if (m) content = content.slice(0, m.index) + nc + content.slice(m.index + m[0].length);
      else {
        const crx = /<c\b[^>]*?\sr="([A-Z]+)\d+"/g;
        let mm;
        let pos = content.length;
        while ((mm = crx.exec(content))) {
          if (colNum(mm[1]) > e.c) {
            pos = mm.index;
            break;
          }
        }
        content = content.slice(0, pos) + nc + content.slice(pos);
        inserted = true;
      }
    }
    if (inserted) openTag = setAttr(openTag, "spans", null);
    if (needHt) {
      const ht = parseFloat(getAttr(openTag, "ht") || "0");
      if (ht < needHt) {
        openTag = setAttr(openTag, "ht", String(needHt));
        openTag = setAttr(openTag, "customHeight", "1");
      }
    }
    const out = openTag + content + "</row>";
    if (i != null) parts[i] = out;
    else newRows.push([r, out]);
  }
  body = parts.join("");
  for (const [r, out] of newRows.sort((x, y) => x[0] - y[0])) {
    const rx = /<row\b[^>]*?\sr="(\d+)"/g;
    let mm;
    let pos = body.length;
    while ((mm = rx.exec(body))) {
      if (+mm[1] > r) {
        pos = mm.index;
        break;
      }
    }
    body = body.slice(0, pos) + out + body.slice(pos);
  }
  for (const [c, w] of colWidths) head = ensureColWidth(head, c, w);
  return head + open + body + tail;
};

/**
 * Writes codes and filenames into the matrix and returns the new workbook.
 *
 * @param {object} p
 *   buf        original file bytes
 *   wb         workbook from readWorkbook (sheets, stylesPath)
 *   sheetIdx   which sheet
 *   hdr        header from detectHeader (cols.isci / cols.filename may be "new")
 *   jobCell    { r, c, text } or null
 *   job        job number text to write after the job label
 *   results    [{ r, code, fileName }] FINAL codes from the batch API (never a preview)
 *   outputType JSZip output type, "uint8array" by default ("blob" in the browser)
 */
export const buildOutput = async ({ buf, wb, sheetIdx, hdr, jobCell, job, results, outputType = "uint8array" }) => {
  const zip = await JSZip.loadAsync(buf);
  const sh = wb.sheets[sheetIdx];
  let xml = await zip.file(sh.path).async("string");
  const stylesXml = wb.stylesPath && zip.file(wb.stylesPath) ? await zip.file(wb.stylesPath).async("string") : null;
  const styler = makeStyler(stylesXml);
  const cols = hdr.cols;
  const edits = [];
  const widths = new Map();
  let iscC = cols.isci;
  let fnC = cols.filename;
  if (iscC === "new") {
    iscC = hdr.lastCol + 1;
    fnC = iscC;
    edits.push({ r: hdr.row, c: iscC, text: "ISCI CODE & FILE NAME", styleFrom: hdr.lastCol });
  }
  const combined = !fnC || fnC === iscC;
  let longest = 0;
  for (const x of results) {
    if (!x.code) continue;
    if (combined) {
      edits.push({ r: x.r, c: iscC, text: x.code + "\n" + x.fileName, wrap: true, lines: 2 });
    } else {
      edits.push({ r: x.r, c: iscC, text: x.code });
      edits.push({ r: x.r, c: fnC, text: x.fileName });
    }
    longest = Math.max(longest, x.fileName.length);
  }
  if (combined) widths.set(iscC, Math.min(100, Math.ceil(longest * 1.05) + 3));
  else {
    widths.set(fnC, Math.min(100, Math.ceil(longest * 1.05) + 3));
    widths.set(iscC, 16);
  }
  if (jobCell) {
    const t = jobCell.text;
    const i = t.indexOf(":");
    edits.push({ r: jobCell.r, c: jobCell.c, text: (i >= 0 ? t.slice(0, i + 1) : t.trim() + ":") + " " + job });
  }
  xml = patchSheet(xml, edits, styler, widths);
  zip.file(sh.path, xml);
  if (styler.changed) zip.file(wb.stylesPath, styler.xml);
  return zip.generateAsync({ type: outputType, compression: "DEFLATE", compressionOptions: { level: 6 } });
};

