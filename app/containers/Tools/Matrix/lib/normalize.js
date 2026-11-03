/**
 * Value normalizers and suggestion rules for matrix cells.
 * Output matches what ISCIz stores: length in integer seconds, aspect like
 * "16:9", language as a full name, platform as a short label.
 */

import { isBlank, str } from "./cells.js";

//////////////////////////////////////
// Length and size

// Seconds as an integer, or null (blank, "LF" long form, or unreadable).
export const normLen = (v) => {
  if (isBlank(v)) return null;
  let secs = null;
  if (typeof v === "number") {
    if (v > 0 && v < 1) {
      // Excel turned ":30" into a time of day. h:mm typed as m:ss, or a true time.
      const m = v * 1440;
      secs = Math.abs(m - Math.round(m)) < 1e-6 ? Math.round(m) : Math.round(v * 86400);
    } else secs = Math.round(v);
  } else {
    const s = String(v).trim();
    let m;
    if (/\bLF\b|long\s*-?\s*form/i.test(s)) return null;
    if ((m = s.match(/^(\d{1,2})?\s*:\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?/))) {
      secs = m[3] != null ? (+m[1] || 0) * 3600 + +m[2] * 60 + +m[3] : (+m[1] || 0) * 60 + +m[2];
    } else if ((m = s.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minutes)\b/i))) secs = Math.round(+m[1] * 60);
    else if ((m = s.match(/(\d+)/))) secs = +m[1];
    else return null;
  }
  return secs == null || isNaN(secs) ? null : secs;
};

// "16:9" style. Excel turns 9:16 into a time of day, so small numbers are undone.
export const normSize = (v) => {
  if (isBlank(v)) return null;
  if (typeof v === "number") {
    if (v > 0 && v < 1) {
      const t = Math.round(v * 1440);
      return Math.floor(t / 60) + ":" + (t % 60);
    }
    return String(v);
  }
  return String(v)
    .trim()
    .replace(/\s*[:;x×/]\s*/gi, ":")
    .replace(/\s*&\s*/g, "+")
    .replace(/\s+/g, "");
};

//////////////////////////////////////
// Language: full name plus an optional region, e.g. "English (UK, Canada)"

const LANGS = [
  ["english", "English"], ["spanish", "Spanish"], ["español", "Spanish"], ["espanol", "Spanish"], ["portuguese", "Portuguese"],
  ["japanese", "Japanese"], ["korean", "Korean"], ["french", "French"], ["german", "German"], ["italian", "Italian"],
  ["mandarin", "Mandarin"], ["cantonese", "Cantonese"], ["chinese", "Mandarin"], ["arabic", "Arabic"], ["hindi", "Hindi"],
  ["vietnamese", "Vietnamese"], ["tagalog", "Tagalog"], ["filipino", "Filipino"], ["russian", "Russian"], ["dutch", "Dutch"],
  ["polish", "Polish"], ["swedish", "Swedish"], ["thai", "Thai"], ["hebrew", "Hebrew"], ["turkish", "Turkish"], ["greek", "Greek"],
  ["navajo", "Navajo"], ["hawaiian", "Hawaiian"], ["samoan", "Samoan"], ["tongan", "Tongan"],
  ["sign language", "American Sign Language"], ["asl", "American Sign Language"],
];

// A language implied by a country name carries no region of its own.
const COUNTRY_LANG = [
  ["korea", "Korean"], ["japan", "Japanese"], ["brazil", "Portuguese"], ["mexic", "Spanish"], ["argentin", "Spanish"],
  ["france", "French"], ["germany", "German"], ["italy", "Italian"], ["china", "Mandarin"], ["quebec", "French"],
];

// [keyword, region label]. Order matters: the first match in the text wins its position.
const REGIONS = [
  ["australia", "Australia"], ["au", "Australia"], ["united kingdom", "UK"], ["uk", "UK"], ["britain", "UK"], ["england", "UK"],
  ["ireland", "Ireland"], ["india", "India"], ["argentina", "Argentina"], ["mexico", "Mexico"], ["brazil", "Brazil"], ["canada", "Canada"],
  ["canadian", "Canada"], ["quebec", "Canada"], ["united states", "US"], ["usa", "US"], ["us", "US"], ["u.s.", "US"], ["spain", "Spain"],
  ["portugal", "Portugal"], ["latin america", "LATAM"], ["latam", "LATAM"], ["puerto rico", "Puerto Rico"], ["colombia", "Colombia"],
  ["chile", "Chile"], ["peru", "Peru"], ["germany", "Germany"], ["france", "France"], ["japan", "Japan"], ["korea", "Korea"],
  ["china", "China"], ["taiwan", "Taiwan"], ["hong kong", "Hong Kong"], ["new zealand", "New Zealand"], ["nz", "New Zealand"],
  ["singapore", "Singapore"], ["philippines", "Philippines"], ["global", "Global"],
];

const wordRx = (w) => new RegExp("(^|[^a-z])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?=$|[^a-z])", "i");

const CLEAN_RX = /\bno\s*vo\b|textless|\bclean\b|no\s*(vo|gfx|graphics)/i;

// Regions found in `text`, in the order they appear, without repeats.
const regionsIn = (text) => {
  const low = text.toLowerCase();
  const hits = [];
  for (const [k, label] of REGIONS) {
    const m = low.match(wordRx(k));
    if (m) hits.push([m.index, label]);
  }
  const out = [];
  hits.sort((a, b) => a[0] - b[0]).forEach(([, label]) => {
    if (!out.includes(label)) out.push(label);
  });
  return out;
};

const withRegions = (name, regions) => (regions.length ? `${name} (${regions.join(", ")})` : name);

// "Spanish (US)" stays "Spanish (US)". Textless or clean masters become "Clean".
export const langName = (raw) => {
  const s = str(raw);
  if (!s) return "";
  if (CLEAN_RX.test(s)) return "Clean";
  const low = s.toLowerCase();
  let name = "";
  let fromCountry = false;
  let pos = 1e9;
  for (const [k, n] of LANGS) {
    const m = low.match(wordRx(k));
    if (m && m.index < pos) {
      pos = m.index;
      name = n;
    }
  }
  if (!name) {
    for (const [k, n] of COUNTRY_LANG) {
      if (low.includes(k)) {
        name = n;
        fromCountry = true;
        break;
      }
    }
  }
  if (!name) {
    const w = (s.match(/[A-Za-z]+/) || [""])[0];
    name = w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : "";
  }
  if (fromCountry) return name;
  const par = (s.match(/\(([^)]*)\)/) || [])[1] || "";
  const regions = par ? regionsIn(par) : [];
  if (!regions.length && /canad|quebec/i.test(low)) regions.push("Canada");
  return withRegions(name, regions);
};

// Template matrices have no Language column; "ENGLISH INTERNATIONAL VERSIONS UK/CANADA"
// or "CLEAN PRO RES MASTERS" still say it in the placement.
export const placementLang = (pl) => {
  const s = String(pl || "");
  if (CLEAN_RX.test(s)) return "Clean";
  const low = s.toLowerCase();
  for (const [k, n] of LANGS) if (wordRx(k).test(low)) return withRegions(n, regionsIn(s));
  return "";
};

//////////////////////////////////////
// Platform and media suggestions

export const PLATFORMS = [
  [/\bfb\s*(&|and|\+|\/)\s*ig\b|facebook\s*(&|and|\+|\/)\s*instagram/i, "Meta"], [/\bfb\b/i, "Facebook"], [/\big\b/i, "Instagram"],
  [/direc\s*tv|direct\s*tv/i, "DirecTV"], [/ad\s*\+?\s*genuity/i, "AdGenuity"], [/hills\s*balfour/i, "HillsBalfour"],
  [/you\s*tube|true\s*view/i, "YouTube"], [/\bmeta\b/i, "Meta"], [/facebook/i, "Facebook"], [/instagram/i, "Instagram"], [/tik\s*tok/i, "TikTok"],
  [/snap\s*chat/i, "Snapchat"], [/pinterest/i, "Pinterest"], [/linked\s*in/i, "LinkedIn"], [/reddit/i, "Reddit"], [/twitter/i, "X"],
  [/trade\s*desk|\bttd\b/i, "TradeDesk"], [/sojern/i, "Sojern"], [/teads/i, "Teads"], [/kargo/i, "Kargo"], [/\bhulu\b/i, "Hulu"], [/\broku\b/i, "Roku"],
  [/peacock/i, "Peacock"], [/amazon|prime\s*video/i, "Amazon"], [/netflix/i, "Netflix"], [/spotify/i, "Spotify"], [/pandora/i, "Pandora"],
  [/i\s*heart/i, "iHeart"], [/sirius/i, "SiriusXM"], [/audacy/i, "Audacy"], [/\bdv\s*360\b/i, "DV360"], [/google/i, "Google"], [/stack\s*adapt/i, "StackAdapt"],
  [/vevo/i, "Vevo"], [/twitch/i, "Twitch"], [/disney/i, "Disney"], [/paramount/i, "Paramount"], [/\btubi\b/i, "Tubi"], [/pluto/i, "Pluto"],
  [/samsung/i, "Samsung"], [/vizio/i, "Vizio"], [/effectv/i, "Effectv"], [/comcast/i, "Comcast"], [/\bespn\b/i, "ESPN"], [/\bfubo\b/i, "Fubo"],
];

export const firstPlatform = (t) => {
  let best = null;
  let pos = 1e9;
  for (const [rx, label] of PLATFORMS) {
    const m = t.match(rx);
    if (m && m.index < pos) {
      pos = m.index;
      best = label;
    }
  }
  return best;
};

export const partnerShort = (p) => {
  const first = String(p || "").split(/\n/).find((l) => l.trim()) || "";
  return str(first).slice(0, 80);
};

// The partner name alone (Comcast, Hulu, Meta...), or null when none is recognized.
// Looks at the placement text first, then the partner/notes text, then the first specs line.
export const suggestPlatform = (placement, partner, specs) => {
  const fromPlacement = firstPlatform(String(placement || ""));
  if (fromPlacement) return fromPlacement;
  if (partner && !/^https?:/i.test(partner)) {
    const fromPartner = firstPlatform(String(partner));
    if (fromPartner) return fromPartner;
  }
  return specs ? firstPlatform(String(specs).split(/\n/)[0]) : null;
};

// ISCI media type for a placement group: T broadcast, R radio, otherwise D.
export const suggestMedia = (placement, partner) => {
  const p = String(placement || "");
  const pa = String(partner || "");
  // Broadcast ISCIs: Comcast, DirecTV, spot TV and masters. "Broadcast CTV" stays digital.
  if (/comcast|direc\s*tv|direct\s*tv|spot\s*tv|\bmasters?\b/i.test(p)) return "T";
  if (/broadcast/i.test(p) && !/\bctv\b|\bott\b|stream|radio/i.test(p) && /comcast|direc\s*tv|direct\s*tv/i.test(pa)) return "T";
  if (/\bradio\b/i.test(p) && !/stream|digital|online|podcast|audio|pandora|spotify|iheart/i.test(p)) return "R";
  return "D";
};

// Active placement for a media type (ISCIz has one placement per type by default).
export const placementForMedia = (media, placements) =>
  placements.find((p) => p.active !== false && p.mediaType === media) || null;

// Filename-safe spot title.
export const seg = (s) =>
  String(s || "")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/_/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.+$/, "");
