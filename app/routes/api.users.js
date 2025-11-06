import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, "../../data/users.json");

// GET /api/users - Returns all users
export async function loader() {
  try {
    const data = await readFile(USERS_FILE, "utf-8");
    const users = JSON.parse(data);
    return users;
  } catch (error) {
    console.error("Error reading users:", error);
    return [];
  }
}

// POST /api/users - Save users
export async function action({ request }) {
  try {
    const users = await request.json();
    await writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    return { success: true };
  } catch (error) {
    console.error("Error saving users:", error);
    return { success: false, error: error.message };
  }
}
