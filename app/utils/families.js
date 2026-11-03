/**
 * Code families: codes that share client + campaign + spot title (the cuts of one
 * spot). Used by Reports > Cutdown families and by the Detail page's bulk shortcuts.
 */

// Normalized so casing and whitespace differences don't split a family.
export const familyKey = (code) =>
  [code.brand || "—", (code.campaignName || "").trim().toLowerCase(), (code.spotTitle || "").trim().toLowerCase()].join("|");

export const familyOf = (code, codes) => {
  const key = familyKey(code);
  return codes.filter((c) => familyKey(c) === key);
};

export const jobOf = (code, codes) => (code.jobNumber ? codes.filter((c) => c.jobNumber === code.jobNumber) : [code]);
