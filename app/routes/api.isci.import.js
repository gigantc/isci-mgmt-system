/**
 * API Route: /api/isci/import
 *
 * Handles bulk import of ISCI codes from CSV data.
 * Supports three modes: add, update, replace
 */

import { prisma } from "@/lib/prisma";
import { normalizeMarketValue } from "@/utils/markets";

// Parse a single CSV line correctly, handling quoted fields and empty values.
const parseCSVLine = (line) => {
  const result = [];
  let i = 0;
  while (i <= line.length) {
    if (i === line.length) { result.push(""); break; }
    if (line[i] === '"') {
      let field = "";
      i++;
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') { field += '"'; i += 2; }
        else if (line[i] === '"') { i++; break; }
        else { field += line[i++]; }
      }
      result.push(field);
      if (line[i] === ",") i++;
    } else {
      const end = line.indexOf(",", i);
      if (end === -1) { result.push(line.slice(i).trim()); break; }
      result.push(line.slice(i, end).trim());
      i = end + 1;
    }
  }
  return result;
};

/**
 * POST /api/isci/import - Import ISCI codes from CSV data
 *
 * Expected column order (matches export + template):
 * ISCI Code, Client, Campaign Name, Job Number, Spot Title, Description,
 * Air Date, Market, Agency, Language, Spot Length, Aspect Ratio,
 * File Format, Placement, Audio, Accessibility, Music Rights, Created At, Updated At
 *
 * The Placement column is required. Values may be the placement name
 * (e.g. "Broadcast") or its single-letter code (e.g. "B").
 */
export async function action({ request }) {
  try {
    const { csvData, importMode } = await request.json();

    const lines = csvData.trim().split("\n");
    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    const headerIndex = headers.reduce((acc, header, index) => {
      acc[header.toLowerCase()] = index;
      return acc;
    }, {});

    // Placement column is required. Accept either "Placement" or the legacy
    // "Channel" header for backward compatibility with older exports.
    const hasPlacementColumn =
      headerIndex["placement"] !== undefined || headerIndex["channel"] !== undefined;
    if (!hasPlacementColumn) {
      return Response.json({
        success: false,
        message: "Import blocked. This file has no Placement column. Every row needs a placement (name or single-letter code) so the ISCI code can be validated.",
      });
    }

    // Look up by column name first; fall back to positional index if headers are missing.
    // Fallback indices match the current export/template column order.
    const getValue = (values, names, fallbackIndex = null) => {
      for (const name of names) {
        const index = headerIndex[name.toLowerCase()];
        if (index !== undefined) return values[index] || "";
      }
      if (fallbackIndex !== null && values[fallbackIndex] !== undefined) {
        return values[fallbackIndex] || "";
      }
      return "";
    };

    const importedCodes = [];
    const errors = [];

    // Load all brands. Build a lookup that accepts the Client column filled with
    // the full name, the 3-letter code, or the abbreviation (all case-insensitive).
    const brands = await prisma.brand.findMany();
    const brandLookup = {};
    const addKey = (key, id) => {
      if (!key) return;
      const k = String(key).trim().toLowerCase();
      if (k && !brandLookup[k]) brandLookup[k] = id;
    };
    brands.forEach(brand => {
      addKey(brand.name, brand.id);
      addKey(brand.code, brand.id);
      addKey(brand.abbreviation, brand.id);
    });

    // Load placements. Lookup accepts the placement name or its single-letter code.
    const placementRecords = await prisma.placement.findMany();
    const placementLookup = {};
    placementRecords.forEach(p => {
      const nameKey = String(p.name || "").trim().toLowerCase();
      const letterKey = String(p.letter || "").trim().toLowerCase();
      if (nameKey && !placementLookup[nameKey]) placementLookup[nameKey] = p;
      if (letterKey && !placementLookup[letterKey]) placementLookup[letterKey] = p;
    });

    // Preflight: collect every unique Client and Placement value in the CSV, then
    // report all missing ones in a single error so the admin can add them in one
    // pass instead of re-uploading after each failure.
    const missingClients = new Set();
    const missingPlacements = new Set();
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const values = parseCSVLine(line);
      const clientRaw = getValue(values, ["Client", "Brand", "Brand/Client"], 1);
      const client = String(clientRaw || "").trim();
      if (client && !brandLookup[client.toLowerCase()]) missingClients.add(client);

      const placementRaw = getValue(values, ["Placement", "Channel"], 13);
      const placement = String(placementRaw || "").trim();
      if (!placement) {
        missingPlacements.add("(blank)");
      } else if (!placementLookup[placement.toLowerCase()]) {
        missingPlacements.add(placement);
      }
    }
    if (missingClients.size > 0) {
      const list = Array.from(missingClients).sort();
      return Response.json({
        success: false,
        message: `Import blocked. ${list.length} Client${list.length === 1 ? "" : "s"} in this file ${list.length === 1 ? "does" : "do"} not exist yet: ${list.join(", ")}. Add ${list.length === 1 ? "it" : "them"} in Admin, Brand Management before importing.`,
        missingClients: list,
      });
    }
    if (missingPlacements.size > 0) {
      const list = Array.from(missingPlacements).sort();
      return Response.json({
        success: false,
        message: `Import blocked. ${list.length} Placement value${list.length === 1 ? "" : "s"} in this file ${list.length === 1 ? "is" : "are"} not recognized: ${list.join(", ")}. Add ${list.length === 1 ? "it" : "them"} in Admin, Placement Management or fix the CSV.`,
        missingPlacements: list,
      });
    }

    // Process each row (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = parseCSVLine(line);

      const rawSpotLength = getValue(values, ["Spot Length"], 10);
      const placementRaw = getValue(values, ["Placement", "Channel"], 13);
      const code = {
        code:             getValue(values, ["ISCI Code", "Code"], 0),
        brand:            getValue(values, ["Client", "Brand", "Brand/Client"], 1),
        campaignName:     getValue(values, ["Campaign Name"], 2) || null,
        jobNumber:        getValue(values, ["Job Number"], 3) || null,
        spotTitle:        getValue(values, ["Spot Title"], 4),
        description:      getValue(values, ["Description"], 5) || null,
        airDate:          getValue(values, ["Air Date", "Air/Start Date"], 6) || null,
        market:           normalizeMarketValue(getValue(values, ["Market"], 7)) || null,
        agency:           getValue(values, ["Agency"], 8) || null,
        language:         getValue(values, ["Language"], 9) || "English",
        spotLength:       rawSpotLength ? parseInt(rawSpotLength, 10) : null,
        aspectRatio:      getValue(values, ["Aspect Ratio"], 11) || "16:9",
        fileFormat:       getValue(values, ["File Format"], 12) || "Pro Res",
        placementRaw:     placementRaw,
        audio:            getValue(values, ["Audio"], 14) || "Stereo LR",
        closedCaptioning: getValue(values, ["Accessibility", "Closed Captioning"], 15) || "Clean",
        musicRights:      getValue(values, ["Music Rights"], 16) || null,
      };

      // Validation
      if (!code.code || !code.brand || !code.spotTitle) {
        errors.push({ row: i + 1, error: "Missing required fields (Code, Client, Spot Title)" });
        continue;
      }

      // Look up brand ID (accepts name, code, or abbreviation)
      const brandId = brandLookup[code.brand.toLowerCase()];
      if (!brandId) {
        errors.push({ row: i + 1, error: `Client "${code.brand}" not found. Add it in Admin, Brand Management.` });
        continue;
      }

      // Look up placement by name or letter. Preflight already surfaced any
      // missing placements, so a miss here means an empty value on this row.
      const placement = placementLookup[String(code.placementRaw || "").trim().toLowerCase()];
      if (!placement) {
        errors.push({ row: i + 1, error: `Placement is required (name or single letter)` });
        continue;
      }

      code.brandId = brandId;
      code.placementId = placement.id;
      delete code.placementRaw;
      importedCodes.push(code);
    }

    if (errors.length > 0 && importedCodes.length === 0) {
      return Response.json({ success: false, errors, message: "All rows failed validation" });
    }

    const now = new Date();

    if (importMode === "replace") {
      // Replace all codes - use transaction for safety
      await prisma.$transaction(async (tx) => {
        // Delete all existing codes
        await tx.iSCICode.deleteMany();

        // Insert all imported codes
        for (const importCode of importedCodes) {
          const { brand, ...codeData } = importCode;
          await tx.iSCICode.create({
            data: {
              id: crypto.randomUUID(),
              ...codeData,
              createdAt: now,
              updatedAt: now,
            },
          });
        }
      });

      return Response.json({
        success: true,
        message: `Replaced all codes with ${importedCodes.length} imported codes`,
        errors: errors.length > 0 ? errors : undefined
      });

    } else if (importMode === "update") {
      // Update existing codes
      let updateCount = 0;

      for (const importCode of importedCodes) {
        const { brand, ...codeData } = importCode;
        const existing = await prisma.iSCICode.findUnique({
          where: { code: importCode.code },
        });

        if (existing) {
          await prisma.iSCICode.update({
            where: { code: importCode.code },
            data: {
              ...codeData,
              updatedAt: now,
            },
          });
          updateCount++;
        }
      }

      return Response.json({
        success: true,
        message: `Updated ${updateCount} codes`,
        errors: errors.length > 0 ? errors : undefined
      });

    } else {
      // Add new codes only (default)
      let addedCount = 0;
      let skippedCount = 0;

      for (const importCode of importedCodes) {
        const { brand, ...codeData } = importCode;
        const existing = await prisma.iSCICode.findUnique({
          where: { code: importCode.code },
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        await prisma.iSCICode.create({
          data: {
            id: crypto.randomUUID(),
            ...codeData,
            createdAt: now,
            updatedAt: now,
          },
        });
        addedCount++;
      }

      return Response.json({
        success: true,
        message: `Added ${addedCount} new codes`,
        skipped: skippedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    }

  } catch (error) {
    console.error("Error importing codes:", error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
