/**
 * API Route: /api/isci/channels
 *
 * Returns the distinct set of channel (placement) values currently used
 * across all ISCI codes. Used by ISCIForm to build the placement dropdown
 * so that custom placements entered via the "Other" option persist and
 * become selectable for future codes.
 */

import { prisma } from "@/lib/prisma";

export async function loader() {
  try {
    const rows = await prisma.iSCICode.findMany({
      distinct: ["channel"],
      select: { channel: true },
    });

    const channels = rows
      .map((r) => r.channel)
      .filter((c) => typeof c === "string" && c.trim().length > 0);

    return Response.json({ channels });
  } catch (error) {
    console.error("Error loading distinct channels:", error);
    return Response.json({ channels: [] }, { status: 500 });
  }
}
