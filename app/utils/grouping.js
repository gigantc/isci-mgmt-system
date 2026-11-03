/**
 * Dashboard grouping (card view). A mode is a key function: codes with the same key
 * share a card. Adding Campaign or Client later is one more entry in GROUP_MODES.
 */

import { familyKey } from "./families.js";

export const NO_JOB_KEY = "job|none";

export const GROUP_MODES = {
  family: { label: "Family", keyOf: familyKey },
  // Codes with no job number share one final card.
  job: { label: "Job", keyOf: (code) => (code.jobNumber ? `job|${code.jobNumber}` : NO_JOB_KEY) },
};

// Shown as Family / Job / List. "none" (the ungrouped table) keeps its id so stored choices still apply.
export const GROUP_OPTIONS = [...Object.entries(GROUP_MODES).map(([id, m]) => [id, m.label]), ["none", "List"]];

const placementName = (c) => c.placement?.name || "";

// Inside a card: longest first, then placement, then code.
export const byLengthDesc = (a, b) =>
  (b.spotLength ?? -1) - (a.spotLength ?? -1) ||
  placementName(a).localeCompare(placementName(b)) ||
  a.code.localeCompare(b.code);

const created = (c) => Date.parse(c.createdAt || 0) || 0;
const distinct = (list) => [...new Set(list.filter(Boolean))];

/**
 * Cards for the visible codes. Every visible code lands in exactly one card.
 * Each card: { key, mode, all (every code in the group, for totals), members (the
 * visible ones, longest first), lines } where lines is [{ title, codes }]: one line
 * per spot title (a family has one, a job has one per title).
 * Order: newest createdAt among the visible members first; the "No job number"
 * card always goes last.
 */
export const cardEntries = (visible, allCodes, mode) => {
  const keyOf = GROUP_MODES[mode]?.keyOf;
  if (!keyOf) return [];
  const totals = new Map();
  for (const code of allCodes) {
    const key = keyOf(code);
    if (!totals.has(key)) totals.set(key, []);
    totals.get(key).push(code);
  }
  const cards = new Map();
  for (const code of visible) {
    const key = keyOf(code);
    if (!cards.has(key)) cards.set(key, { key, mode, all: totals.get(key).slice().sort(byLengthDesc), members: [] });
    cards.get(key).members.push(code);
  }
  const list = [...cards.values()];
  for (const card of list) {
    card.members.sort(byLengthDesc);
    const titles = new Map();
    for (const code of card.members) {
      const t = (code.spotTitle || "").trim();
      if (!titles.has(t)) titles.set(t, []);
      titles.get(t).push(code);
    }
    // Titles in the order they were made (earliest member first).
    card.lines = [...titles.entries()]
      .map(([title, codes]) => ({ title, codes, first: Math.min(...codes.map(created)) }))
      .sort((a, b) => a.first - b.first || a.title.localeCompare(b.title));
  }
  const stamp = (card) => Math.max(...card.members.map(created));
  return list.sort((a, b) => (a.key === NO_JOB_KEY) - (b.key === NO_JOB_KEY) || stamp(b) - stamp(a));
};

// Header facts for a card, from all of its members.
export const cardMeta = (all) => {
  const first = all[0];
  return {
    first,
    clients: distinct(all.map((c) => c.brand)),
    campaigns: distinct(all.map((c) => (c.campaignName || "").trim())),
    title: (first.spotTitle || "").trim() || "Untitled",
  };
};
