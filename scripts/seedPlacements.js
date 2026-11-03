import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const DEFAULT_PLACEMENTS = [
  { name: "Broadcast", mediaType: "T" },
  { name: "Digital",   mediaType: "D" },
  { name: "Radio",     mediaType: "R" },
];

async function run() {
  const now = new Date();
  for (const p of DEFAULT_PLACEMENTS) {
    await prisma.placement.upsert({
      where: { name: p.name },
      update: { active: true, updatedAt: now },
      create: {
        id: randomUUID(),
        name: p.name,
        mediaType: p.mediaType,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
  const total = await prisma.placement.count();
  console.log(`Seeded placements. Total in DB: ${total}`);
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
