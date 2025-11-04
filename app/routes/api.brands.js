import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BRANDS_FILE = path.join(__dirname, "../../data/brands.json");

// GET /api/brands - Returns all brands
export async function loader() {
  try {
    const data = await readFile(BRANDS_FILE, "utf-8");
    const brands = JSON.parse(data);
    return brands;
  } catch (error) {
    console.error("Error reading brands:", error);
    return [];
  }
}

// POST /api/brands - Save brands
export async function action({ request }) {
  try {
    const brands = await request.json();
    await writeFile(BRANDS_FILE, JSON.stringify(brands, null, 2));
    return { success: true };
  } catch (error) {
    console.error("Error saving brands:", error);
    return { success: false, error: error.message };
  }
}
