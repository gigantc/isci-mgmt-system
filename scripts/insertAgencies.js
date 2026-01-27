import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";

const prisma = new PrismaClient();

async function run() {
  const agencies = JSON.parse(await fs.readFile("data/agencies.json", "utf-8"));
  console.log("📝 Inserting", agencies.length, "agencies...");

  for (const agency of agencies) {
    await prisma.agency.create({
      data: {
        id: agency.id,
        name: agency.name,
        isDefault: agency.isDefault,
        active: agency.active,
        createdAt: new Date(agency.createdAt),
        updatedAt: new Date(agency.updatedAt),
      },
    });
  }

  console.log("✅ Migrated", agencies.length, "agencies");
  await prisma.$disconnect();
}

run().catch(console.error);
