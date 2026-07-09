/**
 * API Route: /api/isci/languages
 *
 * Returns the distinct set of language values currently used across all
 * ISCI codes. Used by ISCIForm to build the language dropdown so that
 * custom languages entered via the "Other" option persist and become
 * selectable for future codes.
 */

import { prisma } from "@/lib/prisma";

export async function loader() {
  try {
    const rows = await prisma.iSCICode.findMany({
      distinct: ["language"],
      select: { language: true },
    });

    const languages = rows
      .map((r) => r.language)
      .filter((l) => typeof l === "string" && l.trim().length > 0);

    return Response.json({ languages });
  } catch (error) {
    console.error("Error loading distinct languages:", error);
    return Response.json({ languages: [] }, { status: 500 });
  }
}
