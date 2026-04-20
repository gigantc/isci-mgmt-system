import { prisma } from "@/lib/prisma";

/**
 * Authentication API Endpoint
 *
 * Handles user login by checking credentials against database
 * WARNING: This is a POC - passwords are plain text, no encryption
 */

export async function action({ request }) {
  if (request.method === "POST") {
    try {
      const formData = await request.json();
      const { email, password } = formData;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

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

      // Block deactivated users (only if the column exists; undefined = old schema)
      if (user.active === false) {
        return Response.json(
          { success: false, message: "This account has been deactivated." },
          { status: 401 }
        );
      }

      // Stamp last-active timestamp. Tolerate pre-migration schemas where
      // lastActiveAt doesn't exist yet.
      const now = new Date();
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastActiveAt: now },
        });
      } catch (err) {
        console.warn("Could not stamp lastActiveAt (column may not exist yet):", err.message);
      }

      // Parse recentlyViewed from JSON string to array
      const userWithArray = {
        ...user,
        lastActiveAt: now,
        recentlyViewed: JSON.parse(user.recentlyViewed || "[]"),
      };

      // Login successful - return user data without password
      const { password: _, ...userWithoutPassword } = userWithArray;

      return Response.json({
        success: true,
        user: userWithoutPassword,
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
