import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";

const prisma = new PrismaClient();

async function run() {
  const codes = JSON.parse(await fs.readFile("data/isci-codes.json", "utf-8"));
  console.log("📝 Inserting", codes.length, "ISCI codes...");

  for (const code of codes) {
    await prisma.iSCICode.create({
      data: {
        id: code.id,
        code: code.code,
        brandId: code.brandId,
        assignedEditor: code.assignedEditor || null,
        campaignName: code.campaignName || null,
        spotTitle: code.spotTitle,
        spotLength: code.spotLength && code.spotLength !== "" ? parseInt(code.spotLength) : null,
        description: code.description || null,
        language: code.language,
        closedCaptioning: code.closedCaptioning,
        audio: code.audio,
        airDate: code.airDate || null,
        aspectRatio: code.aspectRatio,
        version: code.version,
        channel: code.channel,
        status: code.status,
        agency: code.agency || null,
        createdAt: new Date(code.createdAt),
        updatedAt: new Date(code.updatedAt),
        completedAt: code.completedAt ? new Date(code.completedAt) : null,
      },
    });
  }

  console.log("✅ Migrated", codes.length, "ISCI codes");
  await prisma.$disconnect();
}

run().catch(console.error);
