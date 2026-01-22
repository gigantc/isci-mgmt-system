import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log("🚀 Starting JSON → Database migration...\n");

    // Load JSON files
    const brandsPath = path.join(__dirname, "../data/brands.json");
    const usersPath = path.join(__dirname, "../data/users.json");
    const isciCodesPath = path.join(__dirname, "../data/isci-codes.json");

    const brandsJson = JSON.parse(await fs.readFile(brandsPath, "utf-8"));
    const usersJson = JSON.parse(await fs.readFile(usersPath, "utf-8"));
    const isciCodesJson = JSON.parse(await fs.readFile(isciCodesPath, "utf-8"));

    // 1. Migrate Brands
    console.log("📦 Migrating brands...");
    for (const brand of brandsJson) {
      await prisma.brand.create({
        data: {
          id: brand.id,
          name: brand.name,
          code: brand.code,
          active: brand.active,
          createdAt: new Date(brand.createdAt),
          updatedAt: new Date(brand.updatedAt),
        },
      });
    }
    console.log(`✅ Migrated ${brandsJson.length} brands\n`);

    // 2. Migrate Users
    console.log("👥 Migrating users...");
    for (const user of usersJson) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          recentlyViewed: JSON.stringify(user.recentlyViewed || []),
          profileImage: user.profileImage,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.profileUpdatedAt || user.createdAt),
          profileUpdatedAt: user.profileUpdatedAt
            ? new Date(user.profileUpdatedAt)
            : null,
        },
      });
    }
    console.log(`✅ Migrated ${usersJson.length} users\n`);

    // 3. Migrate ISCI Codes
    console.log("📝 Migrating ISCI codes...");
    for (const code of isciCodesJson) {
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
    console.log(`✅ Migrated ${isciCodesJson.length} ISCI codes\n`);

    console.log("🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
