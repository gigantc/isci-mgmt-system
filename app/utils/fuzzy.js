/**
 * Lightweight fuzzy match scorer.
 * Returns a positive score for a hit, 0 for no match.
 * Scoring favors contiguous runs, prefix matches, and word-boundary hits.
 * Port of the matchScore() helper from design-reference/option-a.html.
 */
export function matchScore(haystack, needle) {
  if (!needle) return 1;
  if (!haystack) return 0;
  const h = String(haystack).toLowerCase();
  const n = String(needle).toLowerCase().trim();
  if (!n) return 1;

  if (h === n) return 1000;
  if (h.startsWith(n)) return 500;
  const idx = h.indexOf(n);
  if (idx !== -1) return 300 - idx;

  // Subsequence match
  let score = 0;
  let hi = 0;
  let ni = 0;
  let run = 0;
  while (hi < h.length && ni < n.length) {
    if (h[hi] === n[ni]) {
      run += 1;
      score += 10 + run * 5;
      if (hi === 0 || h[hi - 1] === " " || h[hi - 1] === "-") score += 15;
      ni += 1;
    } else {
      run = 0;
    }
    hi += 1;
  }
  return ni === n.length ? score : 0;
}

/**
 * Rank an array of records against a query across the supplied string fields.
 * Returns records sorted by descending relevance, filtering out non-matches.
 */
export function rankByFuzzy(records, query, fields) {
  if (!query || !query.trim()) return records;
  const scored = records
    .map((r) => {
      let best = 0;
      for (const f of fields) {
        const v = typeof f === "function" ? f(r) : r[f];
        const s = matchScore(v, query);
        if (s > best) best = s;
      }
      return { r, s: best };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  return scored.map((x) => x.r);
}
