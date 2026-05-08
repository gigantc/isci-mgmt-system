/**
 * API Route: /api/brands
 *
 * RESTful CRUD operations for brands.
 * - GET: Fetch all brands
 * - POST: Create a new brand
 * - PUT: Update an existing brand
 * - DELETE: Delete a brand
 */

import { prisma } from "@/lib/prisma";

/**
 * loader function - GET /api/brands
 * Fetches all brands
 */
export async function loader() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json(brands);
  } catch (error) {
    console.error("Error reading brands:", error);
    return Response.json([], { status: 500 });
  }
}

/**
 * action function - POST/PUT/DELETE /api/brands
 * Handles create, update, and delete operations
 */
export async function action({ request }) {
  const method = request.method;

  try {
    // CREATE - POST /api/brands
    if (method === "POST") {
      const data = await request.json();
      console.log("📝 Creating new brand:", data.name);

      // Check if code already exists
      const existingBrand = await prisma.brand.findUnique({
        where: { code: data.code },
      });
      if (existingBrand) {
        return Response.json(
          { success: false, error: "Client code already exists" },
          { status: 400 }
        );
      }

      const brand = await prisma.brand.create({
        data: {
          id: data.id,
          name: data.name,
          code: data.code,
          color: data.color || null,
          active: data.active !== undefined ? data.active : true,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        },
      });

      console.log("✅ Created brand:", brand.name);
      return Response.json({ success: true, brand });
    }

    // UPDATE - PUT /api/brands
    if (method === "PUT") {
      const data = await request.json();
      console.log("📝 Updating brand:", data.id);

      // Check if code is taken by another brand
      if (data.code) {
        const existingBrand = await prisma.brand.findFirst({
          where: {
            code: data.code,
            NOT: { id: data.id },
          },
        });
        if (existingBrand) {
          return Response.json(
            { success: false, error: "Client code already exists" },
            { status: 400 }
          );
        }
      }

      const brand = await prisma.brand.update({
        where: { id: data.id },
        data: {
          name: data.name,
          code: data.code,
          color: data.color ?? null,
          active: data.active,
          updatedAt: new Date(),
        },
      });

      console.log("✅ Updated brand:", brand.name);
      return Response.json({ success: true, brand });
    }

    // DELETE - DELETE /api/brands
    if (method === "DELETE") {
      const data = await request.json();
      console.log("🗑️ Deleting brand:", data.id);

      // Check if brand has ISCI codes
      const codeCount = await prisma.iSCICode.count({
        where: { brandId: data.id },
      });
      if (codeCount > 0) {
        return Response.json(
          { success: false, error: `Cannot delete brand with ${codeCount} ISCI codes` },
          { status: 400 }
        );
      }

      await prisma.brand.delete({
        where: { id: data.id },
      });

      console.log("✅ Deleted brand:", data.id);
      return Response.json({ success: true });
    }

    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    console.error("❌ Error in brands API:", error);
    console.error("Error details:", error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
