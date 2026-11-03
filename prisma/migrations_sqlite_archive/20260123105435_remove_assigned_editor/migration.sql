-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ISCICode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "campaignName" TEXT,
    "jobNumber" TEXT,
    "spotTitle" TEXT NOT NULL,
    "spotLength" INTEGER,
    "description" TEXT,
    "language" TEXT NOT NULL DEFAULT 'English',
    "closedCaptioning" TEXT NOT NULL DEFAULT 'Clean',
    "audio" TEXT NOT NULL DEFAULT 'Stereo LR',
    "fileFormat" TEXT NOT NULL DEFAULT 'Pro Res',
    "airDate" TEXT,
    "aspectRatio" TEXT NOT NULL DEFAULT '16:9',
    "channel" TEXT NOT NULL DEFAULT 'Broadcast',
    "agency" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "editHistory" TEXT DEFAULT '[]',
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "ISCICode_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ISCICode" ("agency", "airDate", "aspectRatio", "audio", "brandId", "campaignName", "channel", "closedCaptioning", "code", "completedAt", "createdAt", "createdBy", "description", "editHistory", "fileFormat", "id", "jobNumber", "language", "spotLength", "spotTitle", "updatedAt", "updatedBy") SELECT "agency", "airDate", "aspectRatio", "audio", "brandId", "campaignName", "channel", "closedCaptioning", "code", "completedAt", "createdAt", "createdBy", "description", "editHistory", "fileFormat", "id", "jobNumber", "language", "spotLength", "spotTitle", "updatedAt", "updatedBy" FROM "ISCICode";
DROP TABLE "ISCICode";
ALTER TABLE "new_ISCICode" RENAME TO "ISCICode";
CREATE UNIQUE INDEX "ISCICode_code_key" ON "ISCICode"("code");
CREATE INDEX "ISCICode_brandId_idx" ON "ISCICode"("brandId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
