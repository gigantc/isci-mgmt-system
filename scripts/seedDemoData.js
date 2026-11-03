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
 * Users (matched on email), Agencies and Placements (matched on name) are only
 * created when missing; existing rows are never modified or deleted, so this is
 * safe to run against a database with real accounts. Connects through DATABASE_URL, exactly like
 * the app (new PrismaClient()), so check the target printed at the top before
 * running with --apply.
 */

import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

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
  ["steve@isciz.com", "Stevey", "McVideo", "admin", "admin123"],
  ["sarah.johnson@isciz.com", "Sara", "Johnson", "editor", "editor123"],
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

const PLACEMENTS = [
  ["Broadcast", "B"], ["Social", "S"], ["Digital", "D"], ["Radio", "R"], ["Print", "P"],
  ["OOH", "O"], ["Cinema", "C"], ["Other", "X"], ["CTV", "T"], ["OLV", "V"],
];

//////////////////////////////////////
// Clients: [display name from the R&R list, 3-letter code]

const CLIENTS = [
  ["Allegiant Air", "ALL"], ["AREA15", "ARE"], ["Brand USA (BUSA)", "BUS"], ["Boeing", "BOE"],
  ["CDOT (Colorado Department of Transportation)", "CDO"], ["CASA", "CAS"], ["Case Studies (R&R internal)", "CSS"],
  ["Campus for Hope", "CFH"], ["CATCHA", "CAT"], ["Colorado Wildlife Council (CWC)", "CWC"], ["Discover Puerto Rico (DPR)", "DPR"],
  ["Explore St. Louis", "ESL"], ["Firestone Walker Brewing Company", "FIR"], ["Grand Canyon West", "GCW"], ["HOAG", "HOA"],
  ["Intermountain Healthcare", "INH"], ["International Association of Gambling Regulators", "IAG"], ["Legal Aid Center of Southern Nevada (LACSN)", "LAC"],
  ["Las Vegas Convention and Visitors Authority (LVCVA)", "LVC"], ["Las Vegas Metro Police Department (LVMPD)", "LVM"],
  ["Mattel", "MAT"], ["NV Energy", "NVE"], ["Opportunity Village", "OPV"], ["Raiders", "LVR"], ["R&R Foundation", "RRF"],
  ["R&R Internal (internal projects)", "RRP"], ["RxDrug", "RXD"], ["Select Health", "SEH"],
  ["SouthEast Alaska Regional Health Consortium (SEARHC)", "SEA"], ["Southern Nevada Water Authority (SNWA)", "SNW"],
  ["Vegas Thrill", "VET"], ["Xanterra", "XAN"], ["The William Carter Company", "TWC"], ["Utah Department of Health", "UDH"],
  ["Utah Transportation Authority (UTA)", "UTA"], ["Your Nevada Doctors", "YND"],
];

// "Name (ACRONYM)" splits into name + abbreviation. Descriptive parentheses,
// like "(R&R internal)", are dropped and leave the abbreviation null.
const parseClient = ([raw, code]) => {
  const m = raw.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (!m) return { name: raw, abbreviation: null, code };
  const isAcronym = /^[A-Z]{2,6}$/.test(m[2]);
  // "CDOT (Colorado Department of Transportation)": the acronym comes first.
  if (/^[A-Z]{2,6}$/.test(m[1])) return { name: m[2], abbreviation: m[1], code };
  return { name: m[1], abbreviation: isAcronym ? m[2] : null, code };
};

//////////////////////////////////////
// Fake codes: how many per client, which placements, and campaigns with titles.
// Placement letters are filtered against the active Placements in the DB.

const SPOTS = {
  LVC: {
    n: 14, placements: "BBSDTV", markets: ["US", "US", "CA", "GB", "MX"],
    campaigns: [
      ["What Happens Here", ["Neon Nights", "Midnight Run", "Welcome Home", "After Dark", "The Long Weekend"]],
      ["Vegas Winter Escape", ["Cold Open", "Snow Birds", "Warm Welcome", "Heat Wave", "Winter Break"]],
      ["Meetings That Matter", ["Big Room", "Handshake", "Keynote", "Booth 42"]],
    ],
  },
  ALL: {
    n: 9, placements: "BTVSD", markets: ["US"],
    campaigns: [
      ["Nonstop Summer", ["Window Seat", "Carry On", "Sunny Side", "Gate A12", "Boarding Group"]],
      ["Fares That Fly", ["Low Fare Alert", "Pack Light", "Hello Weekend", "Fly Local"]],
    ],
  },
  LVR: {
    n: 9, placements: "BTSVD", markets: ["US"],
    campaigns: [
      ["Season Tickets 2026", ["Silver and Black", "Stadium Nights", "Own the Dome", "Join the Raider Nation", "Black Hole"]],
      ["Gameday", ["Kickoff", "Tunnel Walk", "Fourth Quarter", "Final Whistle"]],
    ],
  },
  NVE: {
    n: 8, placements: "BDSTR", markets: ["US"],
    campaigns: [
      ["Powering Nevada", ["Always On", "Desert Sun", "Grid Ready", "Quiet Hours", "Lineworkers"]],
      ["Summer Savings", ["Cool Off", "Shade Trees", "Smart Thermostat", "Peak Hours"]],
    ],
  },
  BUS: {
    n: 8, placements: "VDSTB", markets: ["GB", "CA", "MX", "DE", "FR", "US"],
    campaigns: [
      ["Find Your USA", ["Road Trip", "Canyon Country", "City Lights", "Coast to Coast", "Small Town Charm"]],
      ["Visit USA Welcome", ["Arrival", "First Bite", "Open Road", "Local Guide"]],
    ],
  },
  SNW: {
    n: 7, placements: "BDSRV", markets: ["US"],
    campaigns: [
      ["Water Smart", ["Drip Drip", "Lawn Be Gone", "Desert Landscapes", "Every Drop Counts", "Leak Detective"]],
      ["Know Your Water", ["Tap Test", "Source to Sink", "Lake Mead"]],
    ],
  },
  UTA: {
    n: 6, placements: "BDRSV", markets: ["US"],
    campaigns: [
      ["Ride the Wasatch", ["Skip the Traffic", "Powder Day Pass", "Last Mile", "Game Day Train"]],
      ["FrontRunner Forward", ["Platform", "On Time", "Park and Ride"]],
    ],
  },
  CDO: {
    n: 6, placements: "BRDSV", markets: ["US"],
    campaigns: [
      ["Arrive Alive", ["Buckle Up", "Look Twice", "Mile High Mindset", "Slow Down"]],
      ["Plow Safe", ["Give Them Room", "Winter Roads", "Orange Barrels"]],
    ],
  },
  MAT: {
    n: 6, placements: "TVSDB", markets: ["US", "CA", "MX", "GB"],
    campaigns: [
      ["Hot Wheels Unleashed", ["Loop de Loop", "Track Day", "Garage Kings", "Mega Jump"]],
      ["Barbie Dream Days", ["Dreamhouse", "Pink Hour", "Road Trip Ready"]],
    ],
  },
  INH: {
    n: 5, placements: "BDSTV", markets: ["US"],
    campaigns: [
      ["Helping People Live the Healthiest Lives Possible", ["Care Team", "Close to Home", "Every Visit"]],
      ["Urgent Care Open", ["After Hours", "Walk In"]],
    ],
  },
  SEH: {
    n: 5, placements: "BDRSV", markets: ["US"],
    campaigns: [
      ["Open Enrollment", ["Pick Your Plan", "Coverage That Fits", "Sign Up Today"]],
      ["Healthy Moments", ["Check Up", "Little Wins"]],
    ],
  },
  XAN: {
    n: 5, placements: "VDSBC", markets: ["US", "CA"],
    campaigns: [
      ["Park Lodges", ["Old Faithful", "Rim Sunrise", "Campfire Stories"]],
      ["Book Early", ["Last Rooms", "Summer Calling"]],
    ],
  },
  BOE: {
    n: 4, placements: "VDST", markets: ["US", "GB"],
    campaigns: [
      ["Careers Take Off", ["Build It", "First Flight"]],
      ["Engineered to Last", ["Wingspan", "Test Day"]],
    ],
  },
  DPR: {
    n: 4, placements: "VSDTB", markets: ["US", "US", "MX"],
    campaigns: [
      ["Puerto Rico Awaits", ["Golden Hour", "Isla Bonita", "Rhythm of the Island"]],
      ["Spring Escape", ["Beach Day"]],
    ],
  },
  ESL: {
    n: 4, placements: "BDSVT", markets: ["US"],
    campaigns: [
      ["Gateway Getaway", ["Arch Views", "Toasted Ravioli", "Blues Night"]],
      ["Weekend in STL", ["Forest Park"]],
    ],
  },
};

// Per-placement spec values; options match ISCIForm and the Import template.
const PLACEMENT_SPECS = {
  B: { audio: ["Broadcast", "Stereo LR"], formats: ["Pro Res"], ratios: ["16:9"], captions: ["Closed Captions", "Closed Captions", "Clean"], lengths: [30, 30, 15, 60], cutdown: true },
  T: { audio: ["Digital Streaming", "Stereo LR"], formats: ["Pro Res", "H.264"], ratios: ["16:9"], captions: ["Closed Captions", "Clean"], lengths: [30, 15, 30, 60], cutdown: true },
  V: { audio: ["Digital", "Digital Streaming"], formats: ["MP4", "H.264"], ratios: ["16:9", "9:16", "1:1"], captions: ["Subtitles", "Clean"], lengths: [15, 6, 30], cutdown: true },
  S: { audio: ["Digital"], formats: ["MP4"], ratios: ["9:16", "1:1", "4:5"], captions: ["Subtitles", "Subtitles", "Clean"], lengths: [15, 6, 15, 30], cutdown: false },
  D: { audio: ["Digital"], formats: ["MP4", "H.264"], ratios: ["16:9", "1:1", "4:5"], captions: ["Subtitles", "Clean"], lengths: [15, 30, 6], cutdown: true },
  R: { audio: ["Stereo LR"], formats: ["WAV", "MP3"], ratios: ["16:9"], captions: ["Clean"], lengths: [30, 60, 30], cutdown: false },
  C: { audio: ["Cinema 5:1"], formats: ["Pro Res"], ratios: ["16:9"], captions: ["Clean", "Subtitles"], lengths: [30, 60], cutdown: false },
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
    color: null,
    active: true,
    createdAt: BRAND_CREATED,
    updatedAt: BRAND_CREATED,
  }));

const buildCodes = (brands, placements, agencies) => {
  const brandByCode = new Map(brands.map((b) => [b.code, b]));
  const placementByLetter = new Map(placements.map((p) => [p.letter, p]));
  const agencyNames = agencies.map((a) => a.name);
  const defaultAgency = agencies.find((a) => a.isDefault)?.name || agencyNames[0] || null;
  const pickAgency = () => (rand() < 0.75 || agencyNames.length < 2 ? defaultAgency : pick(agencyNames));

  const drafts = [];

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

      const letter = pick(letters);
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

  // Sequence per (brand, placement, year), assigned in creation order so the
  // numbers read like the app made them.
  drafts.sort((a, b) => a.createdAt - b.createdAt || a.brand.code.localeCompare(b.brand.code));
  const counters = new Map();
  return drafts.map((d) => {
    const prefix = `${d.brand.code}${d.placement.letter}${String(d.year).slice(-2)}`;
    const next = (counters.get(prefix) || 0) + 1;
    counters.set(prefix, next);
    const code = `${prefix}${pad2(next)}`;
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
  const newUsers = USERS.filter(([email]) => !haveEmail.has(email)).map(([email, firstName, lastName, userType, password]) => ({
    id: stableId(`user:${email}`), email, password, firstName, lastName, userType,
    active: true, recentlyViewed: "[]", createdAt: now, updatedAt: now,
  }));
  const newPlacements = PLACEMENTS.filter(([name]) => !havePlacement.has(name)).map(([name, letter]) => ({
    id: stableId(`placement:${letter}`), name, letter, active: true, createdAt: now, updatedAt: now,
  }));
  const newAgencies = AGENCIES.filter(([name]) => !haveAgency.has(name)).map(([name, isDefault]) => ({
    id: stableId(`agency:${name}`), name, isDefault, active: true, createdAt: now, updatedAt: now,
  }));

  // Codes are built from what the DB will hold after the upserts.
  const placements = [...dbPlacements, ...newPlacements].filter((p) => p.active);
  const agencies = [...dbAgencies, ...newAgencies].filter((a) => a.active);

  const brands = buildBrands();
  const codes = buildCodes(brands, placements, agencies);
  const perBrand = new Map();
  codes.forEach((c) => perBrand.set(c.brandId, (perBrand.get(c.brandId) || 0) + 1));

  console.log(`Upsert (create-only): ${newUsers.length} users, ${newAgencies.length} agencies, ${newPlacements.length} placements`);
  console.log(`Delete: ${existingCodes} ISCI codes, ${existingBrands} brands`);
  console.log(`Reset recentlyViewed on ${userCount} users`);
  console.log(`Create: ${brands.length} brands, ${codes.length} ISCI codes across ${perBrand.size} clients`);
  console.log(`Placements used from DB: ${placements.map((p) => p.letter).sort().join(" ")}; agencies: ${agencies.map((a) => a.name).join(", ") || "none"}\n`);
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
