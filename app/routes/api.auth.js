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

      // Parse recentlyViewed from JSON string to array
      const userWithArray = {
        ...user,
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
