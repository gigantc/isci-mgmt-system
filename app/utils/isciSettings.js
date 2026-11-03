/**
 * ISCI code format settings, re-exported by app/config.js. They live here
 * because node scripts (seed) load isci.js and config.js can't load under plain
 * node (it reads package.json).
 *
 * Both are pending confirmation with media. They only affect NEWLY generated
 * codes; parsing and validation accept every variant either way.
 */

export const ISCI_HYPHEN = true; // LVCT-2517 (true) vs LVCT2517 (false)
export const ISCI_BROADCAST_H = true; // append "H" to new broadcast (T) codes
