import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const count = await prisma.iSCICode.count();
  console.log(`Deleting ${count} ISCI code(s)...`);
  await prisma.iSCICode.deleteMany({});
  console.log("Done. Now run: npx prisma migrate dev --name add_placements");
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
