/**
 * Demo-data reseed: makes a fresh DB usable. Create-only upserts for demo
 * Users, Agencies and Placements, then replaces every Brand and ISCICode with
 * R&R's real client list plus a deterministic set of fake ISCI codes.
 *
 * Usage:
 *   node scripts/seedDemoData.js           # dry run, prints the plan only
 *   node scripts/seedDemoData.js --apply   # writes (single transaction)
 *
 * Deletes all ISCICode and Brand rows and resets every User's recentlyViewed.
 * Placements outside the Broadcast/Digital/Radio set are deleted after the code
 * wipe. Users (matched on email), Agencies and Placements (matched on name) are
 * only created when missing (a wrong mediaType on the three is corrected); existing rows are never modified or deleted, so this is
 * safe to run against a database with real accounts. Connects through DATABASE_URL, exactly like
 * the app (new PrismaClient()), so check the target printed at the top before
 * running with --apply.
 */

import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import { formatISCI, nextSequence } from "../app/utils/isci.js";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

//////////////////////////////////////
//////////////////////////////////////
//////////////////////////////////////
// DATA

//////////////////////////////////////
// Users: the first two are the credentials shown on the Login page. Passwords
// are plain text like the rest of the POC auth; the extras reuse its pattern.

const USERS = [
  ["steve@isciz.com", "Stevey", "McVideo", "admin", "admin123", "/uploads/profiles/user-1-1762377767810.jpg"],
  ["sarah.johnson@isciz.com", "Sara", "Johnson", "editor", "editor123", "/uploads/profiles/user-2-1769181821423.png"],
  ["mike.chen@isciz.com", "Mike", "Chen", "editor", "editor123"],
  ["maria.garcia@isciz.com", "Maria", "Garcia", "editor", "editor123"],
  ["lisa.park@isciz.com", "Lisa", "Park", "editor", "editor123"],
  ["david.lee@isciz.com", "David", "Lee", "editor", "editor123"],
  ["james.wilson@isciz.com", "James", "Wilson", "viewer", "viewer123"],
  ["emily.rodriguez@isciz.com", "Emily", "Rodriguez", "viewer", "viewer123"],
];

const AGENCIES = [
  ["R&R partners", true],
  ["House of V", false],
  ["R&R Foundation", false],
];

// [name, media type]: T broadcast, D digital, R radio. These three are the whole
// set; --apply removes any other placement (after the codes are wiped).
const PLACEMENTS = [["Broadcast", "T"], ["Digital", "D"], ["Radio", "R"]];

// One-letter keys used by SPOTS and PLACEMENT_SPECS below. They are demo-data
// shorthand for spot variety only (social, CTV, OLV and cinema specs all land on
// the Digital placement); they are not stored anywhere.
const PLACEMENT_KEYS = {
  B: "Broadcast", R: "Radio",
  S: "Digital", D: "Digital", P: "Digital", O: "Digital", C: "Digital", X: "Digital", T: "Digital", V: "Digital",
};

// Retired SO codes kept in the demo data so the SO to digital sequence
// continuation is visible: the next LVC digital code for 25 follows these.
const LEGACY_CODES = [
  { brand: "LVC", code: "SOLVC-2501", title: "Summer Teaser", created: "2025-01-03T15:00:00Z" },
  { brand: "LVC", code: "SOLVC-2502", title: "Convention Season", created: "2025-01-03T16:00:00Z" },
  { brand: "LVC", code: "SOLVCV-2503", title: "Weekend Getaway", created: "2025-01-03T17:00:00Z" },
];

//////////////////////////////////////
// Clients: [display name from the R&R list, 3-letter code, brand hex color]

const CLIENTS = [
  ["Allegiant Air", "ALL", "#F7A41D"], ["AREA15", "ARE", "#8D6E63"], ["Brand USA (BUSA)", "BUS", "#7B2CBF"], ["Boeing", "BOE", "#1D439C"],
  ["CDOT (Colorado Department of Transportation)", "CDO", "#E9C46A"], ["CASA", "CAS", "#00A3E0"], ["Case Studies (R&R internal)", "CSS", "#F4A261"],
  ["Campus for Hope", "CFH", "#F26B3A"], ["CATCHA", "CAT", "#6B7280"], ["Colorado Wildlife Council (CWC)", "CWC", "#3A86FF"], ["Discover Puerto Rico (DPR)", "DPR", "#F58220"],
  ["Explore St. Louis", "ESL", "#C2185B"], ["Firestone Walker Brewing Company", "FIR", "#9C6644"], ["Grand Canyon West", "GCW", "#B5532F"], ["HOAG", "HOA", "#B5179E"],
  ["Intermountain Healthcare", "INH", "#5E60CE"], ["International Association of Gambling Regulators", "IAG", "#90BE6D"], ["Legal Aid Center of Southern Nevada (LACSN)", "LAC", "#6D597A"],
  ["Las Vegas Convention and Visitors Authority (LVCVA)", "LVC", "#D6001C"], ["Las Vegas Metro Police Department (LVMPD)", "LVM", "#C9A227"],
  ["Mattel", "MAT", "#E0218A"], ["NV Energy", "NVE", "#6DB33F"], ["Opportunity Village", "OPV", "#277DA1"], ["Raiders", "LVR", "#A5ACAF"], ["R&R Foundation", "RRF", "#F94144"],
  ["R&R Internal (internal projects)", "RRP", "#4D908E"], ["RxDrug", "RXD", "#43AA8B"], ["Select Health", "SEH", "#00828F"],
  ["SouthEast Alaska Regional Health Consortium (SEARHC)", "SEA", "#00558C"], ["Southern Nevada Water Authority (SNWA)", "SNW", "#0072BB"],
  ["Vegas Thrill", "VET", "#577590"], ["Xanterra", "XAN", "#00573F"], ["The William Carter Company", "TWC", "#F8961E"], ["Utah Department of Health", "UDH", "#D6247A"],
  ["Utah Transportation Authority (UTA)", "UTA", "#2A9D8F"], ["Your Nevada Doctors", "YND", "#00897B"],
];

// "Name (ACRONYM)" splits into name + abbreviation. Descriptive parentheses,
// like "(R&R internal)", are dropped and leave the abbreviation null.
const parseClient = ([raw, code, color]) => {
  const m = raw.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (!m) return { name: raw, abbreviation: null, code, color };
  const isAcronym = /^[A-Z]{2,6}$/.test(m[2]);
  // "CDOT (Colorado Department of Transportation)": the acronym comes first.
  if (/^[A-Z]{2,6}$/.test(m[1])) return { name: m[2], abbreviation: m[1], code, color };
  return { name: m[1], abbreviation: isAcronym ? m[2] : null, code, color };
};

//////////////////////////////////////
// Fake codes: how many per client, which placements, and campaigns with titles.
// Placement keys (see PLACEMENT_KEYS) are filtered against the active Placements in the DB.

const SPOTS = {
  LVC: {
    n: 14, placements: "BDBSRDVBRDDT", markets: ["US", "US", "CA", "GB", "MX"],
    campaigns: [
      ["What Happens Here", ["Neon Nights", "Midnight Run", "Welcome Home", "After Dark", "The Long Weekend"]],
      ["Vegas Winter Escape", ["Cold Open", "Snow Birds", "Warm Welcome", "Heat Wave", "Winter Break"]],
      ["Meetings That Matter", ["Big Room", "Handshake", "Keynote", "Booth 42"]],
    ],
  },
  ALL: {
    n: 9, placements: "BDBSDRDRD", markets: ["US"],
    campaigns: [
      ["Nonstop Summer", ["Window Seat", "Carry On", "Sunny Side", "Gate A12", "Boarding Group"]],
      ["Fares That Fly", ["Low Fare Alert", "Pack Light", "Hello Weekend", "Fly Local"]],
    ],
  },
  LVR: {
    n: 9, placements: "DDBTSRDDV", markets: ["US"],
    campaigns: [
      ["Season Tickets 2026", ["Silver and Black", "Stadium Nights", "Own the Dome", "Join the Raider Nation", "Black Hole"]],
      ["Gameday", ["Kickoff", "Tunnel Walk", "Fourth Quarter", "Final Whistle"]],
    ],
  },
  NVE: {
    n: 8, placements: "BDRBSDRDV", markets: ["US"],
    campaigns: [
      ["Powering Nevada", ["Always On", "Desert Sun", "Grid Ready", "Quiet Hours", "Lineworkers"]],
      ["Summer Savings", ["Cool Off", "Shade Trees", "Smart Thermostat", "Peak Hours"]],
    ],
  },
  BUS: {
    n: 8, placements: "BDVSRBTDD", markets: ["GB", "CA", "MX", "DE", "FR", "US"],
    campaigns: [
      ["Find Your USA", ["Road Trip", "Canyon Country", "City Lights", "Coast to Coast", "Small Town Charm"]],
      ["Visit USA Welcome", ["Arrival", "First Bite", "Open Road", "Local Guide"]],
    ],
  },
  SNW: {
    n: 7, placements: "DRDBSRVDB", markets: ["US"],
    campaigns: [
      ["Water Smart", ["Drip Drip", "Lawn Be Gone", "Desert Landscapes", "Every Drop Counts", "Leak Detective"]],
      ["Know Your Water", ["Tap Test", "Source to Sink", "Lake Mead"]],
    ],
  },
  UTA: {
    n: 6, placements: "BRDSRBVDB", markets: ["US"],
    campaigns: [
      ["Ride the Wasatch", ["Skip the Traffic", "Powder Day Pass", "Last Mile", "Game Day Train"]],
      ["FrontRunner Forward", ["Platform", "On Time", "Park and Ride"]],
    ],
  },
  CDO: {
    n: 6, placements: "DRVRDBSDB", markets: ["US"],
    campaigns: [
      ["Arrive Alive", ["Buckle Up", "Look Twice", "Mile High Mindset", "Slow Down"]],
      ["Plow Safe", ["Give Them Room", "Winter Roads", "Orange Barrels"]],
    ],
  },
  MAT: {
    n: 6, placements: "DDRVSBDD", markets: ["US", "CA", "MX", "GB"],
    campaigns: [
      ["Hot Wheels Unleashed", ["Loop de Loop", "Track Day", "Garage Kings", "Mega Jump"]],
      ["Barbie Dream Days", ["Dreamhouse", "Pink Hour", "Road Trip Ready"]],
    ],
  },
  INH: {
    n: 5, placements: "DDSRBVDD", markets: ["US"],
    campaigns: [
      ["Helping People Live the Healthiest Lives Possible", ["Care Team", "Close to Home", "Every Visit"]],
      ["Urgent Care Open", ["After Hours", "Walk In"]],
    ],
  },
  SEH: {
    n: 5, placements: "BDRSBVDD", markets: ["US"],
    campaigns: [
      ["Open Enrollment", ["Pick Your Plan", "Coverage That Fits", "Sign Up Today"]],
      ["Healthy Moments", ["Check Up", "Little Wins"]],
    ],
  },
  XAN: {
    n: 5, placements: "DDVSDBCD", markets: ["US", "CA"],
    campaigns: [
      ["Park Lodges", ["Old Faithful", "Rim Sunrise", "Campfire Stories"]],
      ["Book Early", ["Last Rooms", "Summer Calling"]],
    ],
  },
  BOE: {
    n: 4, placements: "DBVB", markets: ["US", "GB"],
    campaigns: [
      ["Careers Take Off", ["Build It", "First Flight"]],
      ["Engineered to Last", ["Wingspan", "Test Day"]],
    ],
  },
  DPR: {
    n: 4, placements: "BDVS", markets: ["US", "US", "MX"],
    campaigns: [
      ["Puerto Rico Awaits", ["Golden Hour", "Isla Bonita", "Rhythm of the Island"]],
      ["Spring Escape", ["Beach Day"]],
    ],
  },
  ESL: {
    n: 4, placements: "BDSV", markets: ["US"],
    campaigns: [
      ["Gateway Getaway", ["Arch Views", "Toasted Ravioli", "Blues Night"]],
      ["Weekend in STL", ["Forest Park"]],
    ],
  },
};

// Per-placement spec values; options match ISCIForm and the Import template.
const PLACEMENT_SPECS = {
  B: { platforms: ["Comcast", "DirecTV", "Comcast", "AdGenuity"], audio: ["Broadcast", "Stereo LR"], formats: ["Pro Res"], ratios: ["16:9"], captions: ["Closed Captions", "Closed Captions", "Clean"], lengths: [30, 30, 15, 60], cutdown: true },
  T: { platforms: ["Hulu", "Roku", "Peacock", "TradeDesk"], audio: ["Digital Streaming", "Stereo LR"], formats: ["Pro Res", "H.264"], ratios: ["16:9"], captions: ["Closed Captions", "Clean"], lengths: [30, 15, 30, 60], cutdown: true },
  V: { platforms: ["YouTube", "YouTube", "TradeDesk"], audio: ["Digital", "Digital Streaming"], formats: ["MP4", "H.264"], ratios: ["16:9", "9:16", "1:1"], captions: ["Subtitles", "Clean"], lengths: [15, 6, 30], cutdown: true },
  S: { platforms: ["Meta", "TikTok", "Snapchat", "Meta"], audio: ["Digital"], formats: ["MP4"], ratios: ["9:16", "1:1", "4:5"], captions: ["Subtitles", "Subtitles", "Clean"], lengths: [15, 6, 15, 30], cutdown: false },
  D: { platforms: ["TradeDesk", "Google", "Sojern", "StackAdapt"], audio: ["Digital"], formats: ["MP4", "H.264"], ratios: ["16:9", "1:1", "4:5"], captions: ["Subtitles", "Clean"], lengths: [15, 30, 6], cutdown: true },
  R: { platforms: ["iHeart", "Audacy", "Pandora"], audio: ["Stereo LR"], formats: ["WAV", "MP3"], ratios: ["16:9"], captions: ["Clean"], lengths: [30, 60, 30], cutdown: false },
  C: { platforms: ["Screenvision"], audio: ["Cinema 5:1"], formats: ["Pro Res"], ratios: ["16:9"], captions: ["Clean", "Subtitles"], lengths: [30, 60], cutdown: false },
};

const CUTDOWN_LENGTHS = [30, 15, 6];
const MUSIC_RIGHTS = ["Licensed", "Original", "Licensed", "None"];
const BRAND_CREATED = new Date("2025-01-02T16:00:00Z");
const TODAY = new Date("2026-11-03T16:00:00Z");

//////////////////////////////////////
//////////////////////////////////////
//////////////////////////////////////
// HELPERS

// Seeded PRNG (mulberry32) so reruns produce identical data.
const makeRng = (seed) => {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const rand = makeRng(20261103);
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));
const pick = (list) => list[Math.floor(rand() * list.length)];

// Stable ids: same key, same id.
const stableId = (key) => {
  const h = createHash("md5").update(key).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
};

// Deterministic pick that doesn't consume the seeded RNG, so adding platforms
// leaves the rest of the generated data untouched. About 1 in 8 codes has none.
const hashPick = (list, key) => {
  const n = parseInt(createHash("md5").update(key).digest("hex").slice(0, 8), 16);
  return n % 8 === 0 ? null : list[Math.floor(n / 8) % list.length];
};

const pad2 = (n) => (n < 100 ? String(n).padStart(2, "0") : String(n));
const isoDay = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

const describeTarget = () => {
  const url = process.env.DATABASE_URL || "";
  if (url.startsWith("file:")) return `SQLite ${url.slice(5)}`;
  try {
    const u = new URL(url);
    return `${u.protocol.replace(":", "")} ${u.hostname}${u.pathname}`;
  } catch {
    return url ? "unparseable DATABASE_URL" : "DATABASE_URL not set";
  }
};

//////////////////////////////////////
//////////////////////////////////////
//////////////////////////////////////
// BUILD

const buildBrands = () =>
  CLIENTS.map(parseClient).map((c) => ({
    id: stableId(`brand:${c.code}`),
    name: c.name,
    abbreviation: c.abbreviation,
    code: c.code,
    color: c.color,
    active: true,
    createdAt: BRAND_CREATED,
    updatedAt: BRAND_CREATED,
  }));

const buildCodes = (brands, placements, agencies) => {
  const brandByCode = new Map(brands.map((b) => [b.code, b]));
  const placementByName = new Map(placements.map((p) => [p.name, p]));
  const placementByLetter = new Map(
    Object.entries(PLACEMENT_KEYS).filter(([, name]) => placementByName.has(name)).map(([k, name]) => [k, placementByName.get(name)])
  );
  const agencyNames = agencies.map((a) => a.name);
  const defaultAgency = agencies.find((a) => a.isDefault)?.name || agencyNames[0] || null;
  const pickAgency = () => (rand() < 0.75 || agencyNames.length < 2 ? defaultAgency : pick(agencyNames));

  const drafts = [];

  LEGACY_CODES.forEach((l) => {
    const brand = brandByCode.get(l.brand);
    const placement = placementByName.get("Digital");
    if (!brand || !placement) return;
    const createdAt = new Date(l.created);
    drafts.push({
      legacyCode: l.code,
      brand,
      placement,
      year: 2025,
      createdAt,
      campaignName: "Legacy campaign",
      jobNumber: null,
      spotTitle: l.title,
      spotLength: 30,
      description: `${l.title}, 30s legacy SO code`,
      language: "English",
      closedCaptioning: "Clean",
      audio: "Digital",
      fileFormat: "MP4",
      airDate: null,
      aspectRatio: "16:9",
      musicRights: "Licensed",
      agency: defaultAgency,
      market: "US",
      platform: null,
      updatedAt: createdAt,
      completedAt: addDays(createdAt, 20),
    });
  });

  Object.entries(SPOTS).forEach(([brandCode, cfg]) => {
    const brand = brandByCode.get(brandCode);
    const letters = [...cfg.placements].filter((l) => placementByLetter.has(l) && PLACEMENT_SPECS[l]);
    if (!brand || letters.length === 0) return;

    // One job number per campaign.
    const campaigns = cfg.campaigns.map(([name, titles]) => ({
      name,
      titles: [...titles],
      job: `${int(100000, 999999)}.${pad2(int(1, 99))}`,
    }));

    let made = 0;
    let unit = 0;
    while (made < cfg.n) {
      // Next campaign (round robin) that still has an unused title.
      const rotated = campaigns.map((_, i) => campaigns[(unit + i) % campaigns.length]);
      const camp = rotated.find((c) => c.titles.length) || rotated[0];
      const title = camp.titles.length ? camp.titles.shift() : `${camp.name} Extra ${unit}`;
      unit += 1;

      const letter = letters[(unit - 1) % letters.length]; // round robin keeps the mix on target
      const spec = PLACEMENT_SPECS[letter];
      const remaining = cfg.n - made;
      const isCutdown = spec.cutdown && remaining >= 3 && rand() < 0.3;
      const lengths = isCutdown ? CUTDOWN_LENGTHS : [pick(spec.lengths)];

      // Shared across a cutdown family.
      const year = rand() < 0.35 ? 2025 : 2026;
      const start = year === 2025 ? new Date("2025-01-06T15:00:00Z") : new Date("2026-01-05T15:00:00Z");
      const end = year === 2025 ? new Date("2025-12-19T15:00:00Z") : addDays(TODAY, -2);
      const createdAt = addDays(start, int(0, Math.floor((end - start) / 86400000)));
      const language = rand() < 0.85 ? "English" : "Spanish";
      const market = language === "Spanish" ? pick(["US", "MX"]) : pick(cfg.markets);
      const ratio = pick(spec.ratios);
      const audio = pick(spec.audio);
      const fileFormat = pick(spec.formats);
      const captions = language === "Spanish" ? "Subtitles" : pick(spec.captions);
      const musicRights = pick(MUSIC_RIGHTS);
      const agency = pickAgency();
      const airRoll = rand();
      const airDate = airRoll < 0.7 ? isoDay(addDays(createdAt, int(14, 60))) : airRoll < 0.85 ? "TBD" : null;

      lengths.forEach((spotLength, i) => {
        const at = new Date(createdAt.getTime() + i * 3600000);
        const done = at < addDays(TODAY, -60) && rand() < 0.7;
        drafts.push({
          brand,
          placement: placementByLetter.get(letter),
          platform: hashPick(spec.platforms, `${brand.code}|${title}|${letter}|${year}`),
          year,
          createdAt: at,
          campaignName: camp.name,
          jobNumber: camp.job,
          spotTitle: title,
          spotLength,
          description: `${title}, ${spotLength}s ${placementByLetter.get(letter).name.toLowerCase()} spot for ${brand.abbreviation || brand.name}`,
          language,
          closedCaptioning: captions,
          audio,
          fileFormat,
          airDate,
          aspectRatio: ratio,
          musicRights,
          agency,
          market,
          updatedAt: addDays(at, int(0, 10)),
          completedAt: done ? addDays(at, int(7, 30)) : null,
        });
        made += 1;
      });
    }
  });

  // Sequence per (client, media type, year), assigned in creation order so the
  // numbers read like the app made them. Legacy SO codes count toward digital.
  drafts.sort((a, b) => a.createdAt - b.createdAt || a.brand.code.localeCompare(b.brand.code));
  const assigned = [];
  return drafts.map((d) => {
    const yy = String(d.year).slice(-2);
    const code =
      d.legacyCode ||
      formatISCI({ client: d.brand.code, type: d.placement.mediaType, yy, seq: nextSequence(assigned, d.brand.code, d.placement.mediaType, yy) });
    assigned.push(code);
    return {
      id: stableId(`code:${code}`),
      code,
      brandId: d.brand.id,
      placementId: d.placement.id,
      campaignName: d.campaignName,
      jobNumber: d.jobNumber,
      spotTitle: d.spotTitle,
      spotLength: d.spotLength,
      description: d.description,
      language: d.language,
      closedCaptioning: d.closedCaptioning,
      audio: d.audio,
      fileFormat: d.fileFormat,
      airDate: d.airDate,
      aspectRatio: d.aspectRatio,
      musicRights: d.musicRights,
      agency: d.agency,
      market: d.market,
      platform: d.platform,
      createdBy: null,
      updatedBy: null,
      editHistory: "[]",
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      completedAt: d.completedAt,
    };
  });
};

//////////////////////////////////////
//////////////////////////////////////
//////////////////////////////////////
// RUN

const run = async () => {
  console.log(`Target: ${describeTarget()}`);
  console.log(APPLY ? "Mode: APPLY (writes)\n" : "Mode: DRY RUN (pass --apply to write)\n");

  const [dbPlacements, dbAgencies, dbUsers, existingCodes, existingBrands, userCount] = await Promise.all([
    prisma.placement.findMany(),
    prisma.agency.findMany(),
    prisma.user.findMany({ select: { email: true } }),
    prisma.iSCICode.count(),
    prisma.brand.count(),
    prisma.user.count(),
  ]);

  // Create-only plans: anything already present (by email / name) is skipped.
  const now = new Date();
  const haveEmail = new Set(dbUsers.map((u) => u.email));
  const havePlacement = new Set(dbPlacements.map((p) => p.name));
  const haveAgency = new Set(dbAgencies.map((a) => a.name));
  const newUsers = USERS.filter(([email]) => !haveEmail.has(email)).map(([email, firstName, lastName, userType, password, profileImage]) => ({
    id: stableId(`user:${email}`), email, password, firstName, lastName, userType,
    profileImage: profileImage ?? null,
    active: true, recentlyViewed: "[]", createdAt: now, updatedAt: now,
  }));
  const newPlacements = PLACEMENTS.filter(([name]) => !havePlacement.has(name)).map(([name, mediaType]) => ({
    id: stableId(`placement:${name}`), name, mediaType, active: true, createdAt: now, updatedAt: now,
  }));
  const newAgencies = AGENCIES.filter(([name]) => !haveAgency.has(name)).map(([name, isDefault]) => ({
    id: stableId(`agency:${name}`), name, isDefault, active: true, createdAt: now, updatedAt: now,
  }));

  const keepNames = new Set(PLACEMENTS.map(([name]) => name));
  const removePlacements = dbPlacements.filter((p) => !keepNames.has(p.name));
  const mediaTypeFixes = dbPlacements.filter((p) => keepNames.has(p.name) && p.mediaType !== PLACEMENTS.find(([n]) => n === p.name)[1]);
  const fixedType = (p) => PLACEMENTS.find(([n]) => n === p.name)[1];

  // Codes are built from what the DB will hold after the upserts.
  const placements = [...dbPlacements.filter((p) => keepNames.has(p.name)).map((p) => ({ ...p, mediaType: fixedType(p) })), ...newPlacements].filter((p) => p.active);
  const agencies = [...dbAgencies, ...newAgencies].filter((a) => a.active);

  const brands = buildBrands();
  const codes = buildCodes(brands, placements, agencies);
  const perBrand = new Map();
  codes.forEach((c) => perBrand.set(c.brandId, (perBrand.get(c.brandId) || 0) + 1));

  console.log(`Upsert (create-only): ${newUsers.length} users, ${newAgencies.length} agencies, ${newPlacements.length} placements`);
  console.log(`Delete: ${existingCodes} ISCI codes, ${existingBrands} brands`);
  console.log(`Remove placements: ${removePlacements.map((p) => p.name).join(", ") || "none"}`);
  if (mediaTypeFixes.length) console.log(`Fix media type: ${mediaTypeFixes.map((p) => `${p.name} ${p.mediaType} -> ${fixedType(p)}`).join(", ")}`);
  console.log(`Reset recentlyViewed on ${userCount} users`);
  console.log(`Create: ${brands.length} brands, ${codes.length} ISCI codes across ${perBrand.size} clients`);
  console.log(`Placements used from DB: ${placements.map((p) => `${p.name}=${p.mediaType}`).join(", ")}; agencies: ${agencies.map((a) => a.name).join(", ") || "none"}\n`);
  brands.filter((b) => perBrand.has(b.id)).forEach((b) => console.log(`  ${b.code}  ${String(perBrand.get(b.id)).padStart(2)} codes  ${b.name}`));
  console.log("\nSample codes:");
  codes.slice(0, 8).forEach((c) => console.log(`  ${c.code}  ${c.spotLength}s  ${c.spotTitle}  (${c.campaignName})`));

  if (!APPLY) {
    console.log("\nDry run only. Nothing written.");
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.user.createMany({ data: newUsers, skipDuplicates: true });
      await tx.agency.createMany({ data: newAgencies, skipDuplicates: true });
      await tx.placement.createMany({ data: newPlacements, skipDuplicates: true });
      await tx.iSCICode.deleteMany();
      await tx.brand.deleteMany();
      await tx.placement.deleteMany({ where: { id: { in: removePlacements.map((p) => p.id) } } });
      for (const p of mediaTypeFixes) await tx.placement.update({ where: { id: p.id }, data: { mediaType: fixedType(p) } });
      await tx.user.updateMany({ data: { recentlyViewed: "[]" } });
      await tx.brand.createMany({ data: brands });
      await tx.iSCICode.createMany({ data: codes });
    },
    { timeout: 60000 }
  );
  console.log("\nApplied.");
};

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
