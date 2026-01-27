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

const parseEditHistory = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

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
      editHistory: parseEditHistory(code.editHistory),
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
          { success: false, error: "Client not found" },
          { status: 400 }
        );
      }

      const isciCode = await prisma.iSCICode.create({
        data: {
          id: data.id,
          code: data.code,
          brandId: data.brandId,
          campaignName: data.campaignName || null,
          jobNumber: data.jobNumber || null,
          spotTitle: data.spotTitle,
          spotLength: parseSpotLength(data.spotLength),
          description: data.description || null,
          language: data.language || "English",
          closedCaptioning: data.closedCaptioning || "No",
          audio: data.audio || "Stereo LR",
          fileFormat: data.fileFormat || "Pro Res",
          airDate: data.airDate || null,
          aspectRatio: data.aspectRatio || "16:9",
          channel: data.channel || "Broadcast",
          agency: data.agency || null,
          market: data.market || null,
          createdBy: data.createdBy || null,
          updatedBy: data.updatedBy || null,
          editHistory: JSON.stringify(Array.isArray(data.editHistory) ? data.editHistory : []),
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
      if (data.campaignName !== undefined) updateData.campaignName = data.campaignName || null;
      if (data.jobNumber !== undefined) updateData.jobNumber = data.jobNumber || null;
      if (data.spotTitle !== undefined) updateData.spotTitle = data.spotTitle;
      if (data.spotLength !== undefined) updateData.spotLength = parseSpotLength(data.spotLength);
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.language !== undefined) updateData.language = data.language;
      if (data.closedCaptioning !== undefined) updateData.closedCaptioning = data.closedCaptioning;
      if (data.audio !== undefined) updateData.audio = data.audio;
      if (data.fileFormat !== undefined) updateData.fileFormat = data.fileFormat;
      if (data.airDate !== undefined) updateData.airDate = data.airDate || null;
      if (data.aspectRatio !== undefined) updateData.aspectRatio = data.aspectRatio;
      if (data.channel !== undefined) updateData.channel = data.channel;
      if (data.agency !== undefined) updateData.agency = data.agency || null;
      if (data.market !== undefined) updateData.market = data.market || null;
      if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy || null;
      if (data.completedAt !== undefined) {
        updateData.completedAt = data.completedAt ? new Date(data.completedAt) : null;
      }

      if (data.updatedBy) {
        const existing = await prisma.iSCICode.findUnique({
          where: { id: data.id },
          select: { editHistory: true },
        });
        let history = [];
        if (existing && existing.editHistory) {
          try {
            const parsed = JSON.parse(existing.editHistory);
            history = Array.isArray(parsed) ? parsed : [];
          } catch {
            history = [];
          }
        }
        history.push({
          user: data.updatedBy,
          timestamp: new Date().toISOString(),
        });
        updateData.editHistory = JSON.stringify(history);
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
        editHistory: parseEditHistory(isciCode.editHistory),
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
