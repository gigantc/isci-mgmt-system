/**
 * API Route: /api/agencies
 *
 * RESTful CRUD operations for agencies.
 * - GET: Fetch all agencies
 * - POST: Create a new agency
 * - PUT: Update an existing agency
 * - DELETE: Delete an agency
 */

import { prisma } from "@/lib/prisma";

/**
 * loader function - GET /api/agencies
 * Fetches all agencies
 */
export async function loader() {
  try {
    const agencies = await prisma.agency.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json(agencies);
  } catch (error) {
    console.error("Error reading agencies:", error);
    return Response.json([], { status: 500 });
  }
}

/**
 * action function - POST/PUT/DELETE /api/agencies
 * Handles create, update, and delete operations
 */
export async function action({ request }) {
  const method = request.method;

  try {
    // CREATE - POST /api/agencies
    if (method === "POST") {
      const data = await request.json();
      console.log("📝 Creating new agency:", data.name);

      const agency = await prisma.agency.create({
        data: {
          id: data.id,
          name: data.name,
          isDefault: data.isDefault || false,
          active: data.active !== undefined ? data.active : true,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        },
      });

      console.log("✅ Created agency:", agency.name);
      return Response.json({ success: true, agency });
    }

    // UPDATE - PUT /api/agencies
    if (method === "PUT") {
      const data = await request.json();
      console.log("📝 Updating agency:", data.id);

      const agency = await prisma.agency.update({
        where: { id: data.id },
        data: {
          name: data.name,
          isDefault: data.isDefault,
          active: data.active,
          updatedAt: new Date(),
        },
      });

      console.log("✅ Updated agency:", agency.name);
      return Response.json({ success: true, agency });
    }

    // DELETE - DELETE /api/agencies
    if (method === "DELETE") {
      const data = await request.json();
      console.log("🗑️ Deleting agency:", data.id);

      await prisma.agency.delete({
        where: { id: data.id },
      });

      console.log("✅ Deleted agency:", data.id);
      return Response.json({ success: true });
    }

    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    console.error("❌ Error in agencies API:", error);
    console.error("Error details:", error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
