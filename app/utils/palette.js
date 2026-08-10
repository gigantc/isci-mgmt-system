/**
 * Deterministic color palette for client/brand swatches.
 *
 * Brands don't yet have a `color` column in the schema, so we derive a stable
 * color from the 3-letter code. When the schema gains a `color` field, callers
 * can fall back to this helper only when the stored value is absent.
 */
const PALETTE = [
  "#e89a52", // orange
  "#4ca876", // green
  "#5b8def", // blue
  "#b86acc", // purple
  "#d46a8a", // pink
  "#d9b049", // yellow
  "#4cb0a6", // teal
  "#c86b50", // rust
  "#8a6ed6", // indigo
  "#5fa16a", // olive
];

export function colorForCode(code) {
  if (!code) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
