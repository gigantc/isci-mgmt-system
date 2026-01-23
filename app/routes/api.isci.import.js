/**
 * API Route: /api/isci/import
 *
 * Handles bulk import of ISCI codes from CSV data.
 * Supports three modes: add, update, replace
 */

import { prisma } from "@/lib/prisma";

/**
 * POST /api/isci/import - Import ISCI codes from CSV data
 */
export async function action({ request }) {
  try {
    const { csvData, importMode } = await request.json();

    // Parse CSV data
    const lines = csvData.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());

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

      // Simple CSV parsing (handles quoted fields)
      const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, "").trim()) || [];

      const code = {
        code: values[0],
        brand: values[1],
        campaignName: values[2] || null,
        spotTitle: values[3],
        spotLength: values[4] ? parseInt(values[4]) : null,
        assignedEditor: values[5] || null,
        status: values[6] || "pending",
        channel: values[7] || "Broadcast",
        aspectRatio: values[8] || "16:9",
        version: values[9] || "A",
        language: values[10] || "English",
        closedCaptioning: values[11] || "No",
        audio: values[12] || "Stereo LR",
        airDate: values[13] || null,
        description: values[14] || null,
        agency: values[15] || null
      };

      // Validation
      if (!code.code || !code.brand || !code.spotTitle) {
        errors.push({ row: i + 1, error: "Missing required fields (Code, Brand, Spot Title)" });
        continue;
      }

      // Look up brand ID
      const brandId = brandNameToId[code.brand.toLowerCase()];
      if (!brandId) {
        errors.push({ row: i + 1, error: `Brand "${code.brand}" not found` });
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
