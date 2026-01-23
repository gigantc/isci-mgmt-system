import { writeFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";

const UPLOADS_DIR = join(process.cwd(), "public", "uploads", "profiles");

/**
 * User API Endpoint
 *
 * Handles user profile updates including profile image uploads
 * WARNING: This is a POC - passwords are plain text, no encryption
 */

export async function action({ request }) {
  if (request.method === "PUT") {
    try {
      const formData = await request.formData();
      const id = formData.get("id");
      const firstName = formData.get("firstName");
      const lastName = formData.get("lastName");
      const email = formData.get("email");
      const password = formData.get("password");
      const currentPassword = formData.get("currentPassword");
      const profileImage = formData.get("profileImage"); // File or null

      // Find user by ID
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return Response.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      // If changing password, verify current password
      if (password && password !== user.password) {
        if (!currentPassword || currentPassword !== user.password) {
          return Response.json(
            { success: false, message: "Current password is incorrect" },
            { status: 401 }
          );
        }
      }

      // Check if email is being changed and if it's already in use
      if (email !== user.email) {
        const emailExists = await prisma.user.findFirst({
          where: {
            email,
            NOT: { id },
          },
        });
        if (emailExists) {
          return Response.json(
            { success: false, message: "Email is already in use" },
            { status: 400 }
          );
        }
      }

      // Handle profile image upload
      let profileImagePath = user.profileImage || null;
      if (profileImage && profileImage.size > 0) {
        // Validate file type
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        if (!validTypes.includes(profileImage.type)) {
          return Response.json(
            { success: false, message: "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image." },
            { status: 400 }
          );
        }

        // Validate file size (5MB max)
        if (profileImage.size > 5 * 1024 * 1024) {
          return Response.json(
            { success: false, message: "File too large. Maximum size is 5MB." },
            { status: 400 }
          );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const extension = profileImage.name.split(".").pop();
        const filename = `user-${id}-${timestamp}.${extension}`;
        const filepath = join(UPLOADS_DIR, filename);

        // Save file to disk
        const buffer = Buffer.from(await profileImage.arrayBuffer());
        await writeFile(filepath, buffer);

        // Store relative path for serving
        profileImagePath = `/uploads/profiles/${filename}`;
      }

      // Update user data
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          firstName,
          lastName,
          email,
          password: password || user.password, // Keep old password if not changing
          profileImage: profileImagePath,
          profileUpdatedAt: new Date(),
        },
      });

      // Parse recentlyViewed from JSON string to array
      const userWithArray = {
        ...updatedUser,
        recentlyViewed: JSON.parse(updatedUser.recentlyViewed || "[]"),
      };

      // Return updated user without password
      const { password: _, ...userWithoutPassword } = userWithArray;

      return Response.json({
        success: true,
        user: userWithoutPassword,
      });

    } catch (error) {
      console.error("User update error:", error);
      return Response.json(
        { success: false, message: "Failed to update profile" },
        { status: 500 }
      );
    }
  }

  return Response.json(
    { message: "Method not allowed" },
    { status: 405 }
  );
}
