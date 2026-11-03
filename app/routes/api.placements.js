/**
 * API Route: /api/placements
 *
 * RESTful CRUD for placements. Each placement carries a media type (T, D or R)
 * that becomes the 4th character of every ISCI code created against it.
 */

import { prisma } from "@/lib/prisma";
import { MEDIA_TYPES } from "@/utils/isci";

const isMediaType = (value) => MEDIA_TYPES.some((m) => m.value === value);

export async function loader() {
  try {
    const placements = await prisma.placement.findMany({
      orderBy: { name: "asc" },
    });
    return Response.json(placements);
  } catch (error) {
    console.error("Error reading placements:", error);
    return Response.json([], { status: 500 });
  }
}

export async function action({ request }) {
  const method = request.method;

  try {
    if (method === "POST") {
      const data = await request.json();

      const mediaType = String(data.mediaType || "").toUpperCase();
      if (!isMediaType(mediaType)) {
        return Response.json(
          { success: false, error: "Media type must be Broadcast, Digital or Radio" },
          { status: 400 }
        );
      }

      const existingName = await prisma.placement.findUnique({ where: { name: data.name } });
      if (existingName) {
        return Response.json(
          { success: false, error: "Placement name already exists" },
          { status: 400 }
        );
      }

      const placement = await prisma.placement.create({
        data: {
          id: data.id,
          name: data.name,
          mediaType,
          active: data.active !== undefined ? data.active : true,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        },
      });

      return Response.json({ success: true, placement });
    }

    if (method === "PUT") {
      const data = await request.json();

      const mediaType = data.mediaType ? String(data.mediaType).toUpperCase() : undefined;
      if (mediaType !== undefined && !isMediaType(mediaType)) {
        return Response.json(
          { success: false, error: "Media type must be Broadcast, Digital or Radio" },
          { status: 400 }
        );
      }

      // Existing codes carry the media type, so it is locked once any reference the placement.
      if (mediaType) {
        const current = await prisma.placement.findUnique({ where: { id: data.id } });
        if (current && current.mediaType !== mediaType) {
          const codeCount = await prisma.iSCICode.count({ where: { placementId: data.id } });
          if (codeCount > 0) {
            return Response.json(
              { success: false, error: `Cannot change the media type: ${codeCount} ISCI codes use this placement` },
              { status: 400 }
            );
          }
        }
      }

      if (data.name) {
        const clash = await prisma.placement.findFirst({
          where: { name: data.name, NOT: { id: data.id } },
        });
        if (clash) {
          return Response.json(
            { success: false, error: "Placement name already exists" },
            { status: 400 }
          );
        }
      }

      const placement = await prisma.placement.update({
        where: { id: data.id },
        data: {
          name: data.name,
          ...(mediaType && { mediaType }),
          active: data.active,
          updatedAt: new Date(),
        },
      });

      return Response.json({ success: true, placement });
    }

    if (method === "DELETE") {
      const data = await request.json();

      const codeCount = await prisma.iSCICode.count({
        where: { placementId: data.id },
      });
      if (codeCount > 0) {
        return Response.json(
          { success: false, error: `Cannot delete placement with ${codeCount} ISCI codes` },
          { status: 400 }
        );
      }

      await prisma.placement.delete({ where: { id: data.id } });
      return Response.json({ success: true });
    }

    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    console.error("Error in placements API:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
