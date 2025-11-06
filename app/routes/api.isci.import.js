import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ISCI_FILE = path.join(__dirname, "../../data/isci-codes.json");

// POST /api/isci/import - Import ISCI codes from CSV data
export async function action({ request }) {
  try {
    const { csvData, importMode } = await request.json();

    // Parse CSV data
    const lines = csvData.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());

    const importedCodes = [];
    const errors = [];

    // Process each row (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Simple CSV parsing (handles quoted fields)
      const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g).map(v => v.replace(/^"|"$/g, "").trim());

      const code = {
        code: values[0],
        brand: values[1],
        campaignName: values[2],
        spotTitle: values[3],
        spotLength: values[4] ? parseInt(values[4]) : null,
        assignedEditor: values[5],
        status: values[6],
        channel: values[7],
        aspectRatio: values[8],
        version: values[9],
        language: values[10],
        closedCaptioning: values[11],
        audio: values[12],
        airDate: values[13],
        description: values[14]
      };

      // Validation
      if (!code.code || !code.brand || !code.spotTitle) {
        errors.push({ row: i + 1, error: "Missing required fields (Code, Brand, Spot Title)" });
        continue;
      }

      importedCodes.push(code);
    }

    if (errors.length > 0 && importedCodes.length === 0) {
      return { success: false, errors, message: "All rows failed validation" };
    }

    // Read existing codes
    const data = await readFile(ISCI_FILE, "utf-8");
    const existingCodes = JSON.parse(data);

    let finalCodes;
    const now = new Date().toISOString();

    if (importMode === "replace") {
      // Replace all codes
      finalCodes = importedCodes.map((code, index) => ({
        id: (index + 1).toString(),
        ...code,
        brandId: "", // Will need to be mapped
        createdAt: now,
        updatedAt: now
      }));
    } else if (importMode === "update") {
      // Update existing codes
      const updatedCodes = [...existingCodes];
      let updateCount = 0;

      importedCodes.forEach(importCode => {
        const existingIndex = updatedCodes.findIndex(c => c.code === importCode.code);
        if (existingIndex !== -1) {
          updatedCodes[existingIndex] = {
            ...updatedCodes[existingIndex],
            ...importCode,
            updatedAt: now
          };
          updateCount++;
        }
      });

      finalCodes = updatedCodes;
      return {
        success: true,
        message: `Updated ${updateCount} codes`,
        errors: errors.length > 0 ? errors : undefined
      };
    } else {
      // Add new codes only (default)
      const newCodes = importedCodes.filter(
        importCode => !existingCodes.some(c => c.code === importCode.code)
      );

      const maxId = existingCodes.reduce((max, c) => Math.max(max, parseInt(c.id) || 0), 0);

      const codesToAdd = newCodes.map((code, index) => ({
        id: (maxId + index + 1).toString(),
        ...code,
        brandId: "",
        createdAt: now,
        updatedAt: now
      }));

      finalCodes = [...existingCodes, ...codesToAdd];

      return {
        success: true,
        message: `Added ${codesToAdd.length} new codes`,
        skipped: importedCodes.length - codesToAdd.length,
        errors: errors.length > 0 ? errors : undefined
      };
    }

    // Save to file
    await writeFile(ISCI_FILE, JSON.stringify(finalCodes, null, 2));

    return {
      success: true,
      message: `Import complete. ${importedCodes.length} codes processed.`,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    console.error("Error importing codes:", error);
    return { success: false, message: error.message };
  }
}
