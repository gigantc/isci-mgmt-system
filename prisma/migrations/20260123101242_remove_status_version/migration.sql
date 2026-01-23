-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ISCICode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "assignedEditor" TEXT,
    "campaignName" TEXT,
    "jobNumber" TEXT,
    "spotTitle" TEXT NOT NULL,
    "spotLength" INTEGER,
    "description" TEXT,
    "language" TEXT NOT NULL DEFAULT 'English',
    "closedCaptioning" TEXT NOT NULL DEFAULT 'No',
    "audio" TEXT NOT NULL DEFAULT 'Stereo LR',
    "airDate" TEXT,
    "aspectRatio" TEXT NOT NULL DEFAULT '16:9',
    "channel" TEXT NOT NULL DEFAULT 'Broadcast',
    "agency" TEXT,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "ISCICode_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ISCICode" ("agency", "airDate", "aspectRatio", "assignedEditor", "audio", "brandId", "campaignName", "channel", "closedCaptioning", "code", "completedAt", "createdAt", "description", "id", "jobNumber", "language", "spotLength", "spotTitle", "updatedAt") SELECT "agency", "airDate", "aspectRatio", "assignedEditor", "audio", "brandId", "campaignName", "channel", "closedCaptioning", "code", "completedAt", "createdAt", "description", "id", "jobNumber", "language", "spotLength", "spotTitle", "updatedAt" FROM "ISCICode";
DROP TABLE "ISCICode";
ALTER TABLE "new_ISCICode" RENAME TO "ISCICode";
CREATE UNIQUE INDEX "ISCICode_code_key" ON "ISCICode"("code");
CREATE INDEX "ISCICode_brandId_idx" ON "ISCICode"("brandId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
