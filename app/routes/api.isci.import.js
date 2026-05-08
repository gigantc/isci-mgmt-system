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
 * File Format, Channel, Audio, Accessibility, Music Rights, Created At, Updated At
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

    // Load all brands for name-to-id mapping
    const brands = await prisma.brand.findMany();
    const brandNameToId = {};
    brands.forEach(brand => {
      brandNameToId[brand.name.toLowerCase()] = brand.id;
    });

    // Process each row (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = parseCSVLine(line);

      const rawSpotLength = getValue(values, ["Spot Length"], 10);
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
        channel:          getValue(values, ["Channel", "Placement"], 13) || "Broadcast",
        audio:            getValue(values, ["Audio"], 14) || "Stereo LR",
        closedCaptioning: getValue(values, ["Accessibility", "Closed Captioning"], 15) || "Clean",
        musicRights:      getValue(values, ["Music Rights"], 16) || null,
      };

      // Validation
      if (!code.code || !code.brand || !code.spotTitle) {
        errors.push({ row: i + 1, error: "Missing required fields (Code, Client, Spot Title)" });
        continue;
      }

      // Look up brand ID
      const brandId = brandNameToId[code.brand.toLowerCase()];
      if (!brandId) {
        errors.push({ row: i + 1, error: `Client "${code.brand}" not found` });
        continue;
      }

      code.brandId = brandId;
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
