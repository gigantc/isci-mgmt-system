/**
 * API Route: /api/isci
 *
 * RESTful CRUD operations for ISCI codes.
 * - GET: Fetch all ISCI codes with brand names
 * - POST: Create a new ISCI code
 * - PUT: Update an existing ISCI code
 * - DELETE: Delete an ISCI code
 */

import { prisma } from "@/lib/prisma";

/**
 * loader function - GET /api/isci
 * Fetches all ISCI codes with their brand relationship
 */
export async function loader() {
  try {
    const codes = await prisma.iSCICode.findMany({
      include: { brand: true },
      orderBy: { createdAt: "desc" },
    });

    // Denormalize brand name for frontend compatibility
    const codesWithBrandName = codes.map((code) => ({
      ...code,
      brand: code.brand.name,
    }));

    return Response.json(codesWithBrandName);
  } catch (error) {
    console.error("Error reading ISCI codes:", error);
    return Response.json([], { status: 500 });
  }
}

/**
 * Helper function to convert spotLength to int or null
 */
function parseSpotLength(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = parseInt(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * action function - POST/PUT/DELETE /api/isci
 * Handles create, update, and delete operations
 */
export async function action({ request }) {
  const method = request.method;

  try {
    // CREATE - POST /api/isci
    if (method === "POST") {
      const data = await request.json();
      console.log("📝 Creating new ISCI code:", data.code);

      // Check if code already exists
      const existingCode = await prisma.iSCICode.findUnique({
        where: { code: data.code },
      });
      if (existingCode) {
        return Response.json(
          { success: false, error: "ISCI code already exists" },
          { status: 400 }
        );
      }

      // Verify brand exists
      const brand = await prisma.brand.findUnique({
        where: { id: data.brandId },
      });
      if (!brand) {
        return Response.json(
          { success: false, error: "Brand not found" },
          { status: 400 }
        );
      }

      const isciCode = await prisma.iSCICode.create({
        data: {
          id: data.id,
          code: data.code,
          brandId: data.brandId,
          assignedEditor: data.assignedEditor || null,
          campaignName: data.campaignName || null,
          spotTitle: data.spotTitle,
          spotLength: parseSpotLength(data.spotLength),
          description: data.description || null,
          language: data.language || "English",
          closedCaptioning: data.closedCaptioning || "No",
          audio: data.audio || "Stereo LR",
          airDate: data.airDate || null,
          aspectRatio: data.aspectRatio || "16:9",
          version: data.version || "A",
          channel: data.channel || "Broadcast",
          status: data.status || "pending",
          agency: data.agency || null,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
          completedAt: data.completedAt ? new Date(data.completedAt) : null,
        },
        include: { brand: true },
      });

      // Return with denormalized brand name
      const result = {
        ...isciCode,
        brand: isciCode.brand.name,
      };

      console.log("✅ Created ISCI code:", isciCode.code);
      return Response.json({ success: true, isciCode: result });
    }

    // UPDATE - PUT /api/isci
    if (method === "PUT") {
      const data = await request.json();
      console.log("📝 Updating ISCI code:", data.id);

      // Check if code is taken by another ISCI code
      if (data.code) {
        const existingCode = await prisma.iSCICode.findFirst({
          where: {
            code: data.code,
            NOT: { id: data.id },
          },
        });
        if (existingCode) {
          return Response.json(
            { success: false, error: "ISCI code already exists" },
            { status: 400 }
          );
        }
      }

      // Build update data
      const updateData = {
        updatedAt: new Date(),
      };
      if (data.code !== undefined) updateData.code = data.code;
      if (data.brandId !== undefined) updateData.brandId = data.brandId;
      if (data.assignedEditor !== undefined) updateData.assignedEditor = data.assignedEditor || null;
      if (data.campaignName !== undefined) updateData.campaignName = data.campaignName || null;
      if (data.spotTitle !== undefined) updateData.spotTitle = data.spotTitle;
      if (data.spotLength !== undefined) updateData.spotLength = parseSpotLength(data.spotLength);
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.language !== undefined) updateData.language = data.language;
      if (data.closedCaptioning !== undefined) updateData.closedCaptioning = data.closedCaptioning;
      if (data.audio !== undefined) updateData.audio = data.audio;
      if (data.airDate !== undefined) updateData.airDate = data.airDate || null;
      if (data.aspectRatio !== undefined) updateData.aspectRatio = data.aspectRatio;
      if (data.version !== undefined) updateData.version = data.version;
      if (data.channel !== undefined) updateData.channel = data.channel;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.agency !== undefined) updateData.agency = data.agency || null;
      if (data.completedAt !== undefined) {
        updateData.completedAt = data.completedAt ? new Date(data.completedAt) : null;
      }

      const isciCode = await prisma.iSCICode.update({
        where: { id: data.id },
        data: updateData,
        include: { brand: true },
      });

      // Return with denormalized brand name
      const result = {
        ...isciCode,
        brand: isciCode.brand.name,
      };

      console.log("✅ Updated ISCI code:", isciCode.code);
      return Response.json({ success: true, isciCode: result });
    }

    // DELETE - DELETE /api/isci
    if (method === "DELETE") {
      const data = await request.json();
      console.log("🗑️ Deleting ISCI code:", data.id);

      await prisma.iSCICode.delete({
        where: { id: data.id },
      });

      console.log("✅ Deleted ISCI code:", data.id);
      return Response.json({ success: true });
    }

    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    console.error("❌ Error in ISCI API:", error);
    console.error("Error details:", error.message);
    return Response.json(
      { success: false, error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
