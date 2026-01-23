/**
 * API Route: /api/users
 *
 * RESTful CRUD operations for users (admin management).
 * - GET: Fetch all users
 * - POST: Create a new user
 * - PUT: Update an existing user
 * - DELETE: Delete a user
 */

import { prisma } from "@/lib/prisma";

/**
 * loader function - GET /api/users
 * Fetches all users
 */
export async function loader() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Parse recentlyViewed from JSON string to array
    return Response.json(
      users.map((user) => ({
        ...user,
        recentlyViewed: JSON.parse(user.recentlyViewed || "[]"),
      }))
    );
  } catch (error) {
    console.error("Error reading users:", error);
    return Response.json([], { status: 500 });
  }
}

/**
 * action function - POST/PUT/DELETE /api/users
 * Handles create, update, and delete operations
 */
export async function action({ request }) {
  const method = request.method;

  try {
    // CREATE - POST /api/users
    if (method === "POST") {
      const data = await request.json();
      console.log("📝 Creating new user:", data.email);

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        return Response.json(
          { success: false, error: "Email already exists" },
          { status: 400 }
        );
      }

      const user = await prisma.user.create({
        data: {
          id: data.id,
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          userType: data.userType || "editor",
          recentlyViewed: JSON.stringify(data.recentlyViewed || []),
          profileImage: data.profileImage || null,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
          profileUpdatedAt: data.profileUpdatedAt ? new Date(data.profileUpdatedAt) : null,
        },
      });

      // Return user with parsed recentlyViewed
      const userWithArray = {
        ...user,
        recentlyViewed: JSON.parse(user.recentlyViewed || "[]"),
      };

      console.log("✅ Created user:", user.email);
      return Response.json({ success: true, user: userWithArray });
    }

    // UPDATE - PUT /api/users
    if (method === "PUT") {
      const data = await request.json();
      console.log("📝 Updating user:", data.id);

      // Check if email is taken by another user
      if (data.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: data.email,
            NOT: { id: data.id },
          },
        });
        if (existingUser) {
          return Response.json(
            { success: false, error: "Email already exists" },
            { status: 400 }
          );
        }
      }

      // Build update data object, only including fields that are provided
      const updateData = {
        updatedAt: new Date(),
      };
      if (data.email !== undefined) updateData.email = data.email;
      if (data.password !== undefined) updateData.password = data.password;
      if (data.firstName !== undefined) updateData.firstName = data.firstName;
      if (data.lastName !== undefined) updateData.lastName = data.lastName;
      if (data.userType !== undefined) updateData.userType = data.userType;
      if (data.recentlyViewed !== undefined) {
        updateData.recentlyViewed = JSON.stringify(data.recentlyViewed);
      }
      if (data.profileImage !== undefined) updateData.profileImage = data.profileImage;

      const user = await prisma.user.update({
        where: { id: data.id },
        data: updateData,
      });

      // Return user with parsed recentlyViewed
      const userWithArray = {
        ...user,
        recentlyViewed: JSON.parse(user.recentlyViewed || "[]"),
      };

      console.log("✅ Updated user:", user.email);
      return Response.json({ success: true, user: userWithArray });
    }

    // DELETE - DELETE /api/users
    if (method === "DELETE") {
      const data = await request.json();
      console.log("🗑️ Deleting user:", data.id);

      await prisma.user.delete({
        where: { id: data.id },
      });

      console.log("✅ Deleted user:", data.id);
      return Response.json({ success: true });
    }

    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    console.error("❌ Error in users API:", error);
    console.error("Error details:", error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
