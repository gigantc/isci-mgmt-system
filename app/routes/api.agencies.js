import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AGENCIES_FILE = path.join(__dirname, "../../data/agencies.json");

// GET /api/agencies - Returns all agencies
export async function loader() {
  try {
    const data = await readFile(AGENCIES_FILE, "utf-8");
    const agencies = JSON.parse(data);
    return agencies;
  } catch (error) {
    console.error("Error reading agencies:", error);
    return [];
  }
}

// POST /api/agencies - Save agencies
export async function action({ request }) {
  try {
    const agencies = await request.json();
    await writeFile(AGENCIES_FILE, JSON.stringify(agencies, null, 2));
    return { success: true };
  } catch (error) {
    console.error("Error saving agencies:", error);
    return { success: false, error: error.message };
  }
}
