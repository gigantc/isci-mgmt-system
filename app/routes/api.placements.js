/**
 * API Route: /api/placements
 *
 * RESTful CRUD for placements. Each placement carries a single uppercase
 * letter that becomes the 4th character of every ISCI code created against it.
 */

import { prisma } from "@/lib/prisma";

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

      const letter = String(data.letter || "").toUpperCase();
      if (!/^[A-Z]$/.test(letter)) {
        return Response.json(
          { success: false, error: "Letter must be a single A–Z character" },
          { status: 400 }
        );
      }

      const existingLetter = await prisma.placement.findUnique({ where: { letter } });
      if (existingLetter) {
        return Response.json(
          { success: false, error: `Letter "${letter}" is already used by ${existingLetter.name}` },
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
          letter,
          active: data.active !== undefined ? data.active : true,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        },
      });

      return Response.json({ success: true, placement });
    }

    if (method === "PUT") {
      const data = await request.json();

      const letter = data.letter ? String(data.letter).toUpperCase() : undefined;
      if (letter !== undefined && !/^[A-Z]$/.test(letter)) {
        return Response.json(
          { success: false, error: "Letter must be a single A–Z character" },
          { status: 400 }
        );
      }

      if (letter) {
        const clash = await prisma.placement.findFirst({
          where: { letter, NOT: { id: data.id } },
        });
        if (clash) {
          return Response.json(
            { success: false, error: `Letter "${letter}" is already used by ${clash.name}` },
            { status: 400 }
          );
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
          ...(letter && { letter }),
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
