-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "recentlyViewed" TEXT NOT NULL DEFAULT '[]',
    "profileImage" TEXT,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "profileUpdatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ISCICode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "assignedEditor" TEXT,
    "campaignName" TEXT,
    "spotTitle" TEXT NOT NULL,
    "spotLength" INTEGER,
    "description" TEXT,
    "language" TEXT NOT NULL DEFAULT 'English',
    "closedCaptioning" TEXT NOT NULL DEFAULT 'No',
    "audio" TEXT NOT NULL DEFAULT 'Stereo LR',
    "airDate" TEXT,
    "aspectRatio" TEXT NOT NULL DEFAULT '16:9',
    "version" TEXT NOT NULL DEFAULT 'A',
    "channel" TEXT NOT NULL DEFAULT 'Broadcast',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "agency" TEXT,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "ISCICode_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_code_key" ON "Brand"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ISCICode_code_key" ON "ISCICode"("code");

-- CreateIndex
CREATE INDEX "ISCICode_brandId_idx" ON "ISCICode"("brandId");
