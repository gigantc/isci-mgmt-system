/**
 * Cell and text helpers shared by the Matrix library.
 */

export const str = (v) => (v == null ? "" : String(v).replace(/\s+/g, " ").trim());
export const isBlank = (v) => v == null || String(v).trim() === "";

export const xmlEsc = (s) =>
  String(s)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const colNum = (L) => {
  let n = 0;
  for (const ch of L.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
};

export const colLet = (n) => {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

export const parseRef = (ref) => {
  const m = /^\$?([A-Z]+)\$?(\d+)$/i.exec(ref || "");
  return m ? { c: colNum(m[1]), r: +m[2] } : null;
};

export const parseRange = (ref) => {
  const [a, b] = String(ref || "").split(":");
  const A = parseRef(a);
  const B = parseRef(b || a);
  return A && B ? { r1: Math.min(A.r, B.r), c1: Math.min(A.c, B.c), r2: Math.max(A.r, B.r), c2: Math.max(A.c, B.c) } : null;
};
