import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const DEFAULT_PLACEMENTS = [
  { name: "Broadcast", letter: "B" },
  { name: "Social",    letter: "S" },
  { name: "Digital",   letter: "D" },
  { name: "Radio",     letter: "R" },
  { name: "Print",     letter: "P" },
  { name: "OOH",       letter: "O" },
  { name: "Cinema",    letter: "C" },
  { name: "Other",     letter: "X" },
];

async function run() {
  const now = new Date();
  for (const p of DEFAULT_PLACEMENTS) {
    await prisma.placement.upsert({
      where: { letter: p.letter },
      update: { name: p.name, active: true, updatedAt: now },
      create: {
        id: randomUUID(),
        name: p.name,
        letter: p.letter,
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
