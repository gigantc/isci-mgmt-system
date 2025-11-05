import { readFile } from "fs/promises";
import { join } from "path";

const USERS_FILE = join(process.cwd(), "data", "users.json");

/**
 * Authentication API Endpoint
 *
 * Handles user login by checking credentials against users.json
 * WARNING: This is a POC - passwords are plain text, no encryption
 */

export async function action({ request }) {
  if (request.method === "POST") {
    try {
      const formData = await request.json();
      const { email, password } = formData;

      // Load users from JSON file
      const fileContent = await readFile(USERS_FILE, "utf-8");
      const users = JSON.parse(fileContent);

      // Find user by email
      const user = users.find(u => u.email === email);

      if (!user) {
        return Response.json(
          { success: false, message: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Check password (plain text comparison - POC only!)
      if (user.password !== password) {
        return Response.json(
          { success: false, message: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Login successful - return user data without password
      const { password: _, ...userWithoutPassword } = user;

      return Response.json({
        success: true,
        user: userWithoutPassword
      });

    } catch (error) {
      console.error("Authentication error:", error);
      return Response.json(
        { success: false, message: "Authentication failed" },
        { status: 500 }
      );
    }
  }

  return Response.json(
    { message: "Method not allowed" },
    { status: 405 }
  );
}
