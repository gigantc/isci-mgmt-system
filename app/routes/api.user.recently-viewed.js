import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, "../../data/users.json");

// POST /api/user/recently-viewed - Add an ISCI code to user's recently viewed list
export async function action({ request }) {
  try {
    const { userId, isciCode } = await request.json();

    if (!userId || !isciCode) {
      return { success: false, message: "Missing userId or isciCode" };
    }

    // Read all users
    const data = await readFile(USERS_FILE, "utf-8");
    const users = JSON.parse(data);

    // Find the user
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, message: "User not found" };
    }

    const user = users[userIndex];

    // Initialize recentlyViewed if it doesn't exist
    if (!user.recentlyViewed) {
      user.recentlyViewed = [];
    }

    // Remove the code if it already exists (to avoid duplicates)
    user.recentlyViewed = user.recentlyViewed.filter(code => code !== isciCode);

    // Add the code to the beginning of the array
    user.recentlyViewed.unshift(isciCode);

    // Keep only the last 10 items
    user.recentlyViewed = user.recentlyViewed.slice(0, 10);

    // Update the user in the array
    users[userIndex] = user;

    // Save back to file
    await writeFile(USERS_FILE, JSON.stringify(users, null, 2));

    return { success: true, recentlyViewed: user.recentlyViewed };
  } catch (error) {
    console.error("Error updating recently viewed:", error);
    return { success: false, message: error.message };
  }
}
