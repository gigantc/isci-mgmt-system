-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" TIMESTAMP(3),
    "recentlyViewed" TEXT NOT NULL DEFAULT '[]',
    "profileImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profileUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "code" TEXT NOT NULL,
    "color" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Placement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "letter" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Placement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ISCICode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
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
    "musicRights" TEXT,
    "agency" TEXT,
    "market" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "editHistory" TEXT DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ISCICode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_code_key" ON "Brand"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_name_key" ON "Agency"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Placement_name_key" ON "Placement"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Placement_letter_key" ON "Placement"("letter");

-- CreateIndex
CREATE UNIQUE INDEX "ISCICode_code_key" ON "ISCICode"("code");

-- CreateIndex
CREATE INDEX "ISCICode_brandId_idx" ON "ISCICode"("brandId");

-- CreateIndex
CREATE INDEX "ISCICode_placementId_idx" ON "ISCICode"("placementId");

-- AddForeignKey
ALTER TABLE "ISCICode" ADD CONSTRAINT "ISCICode_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ISCICode" ADD CONSTRAINT "ISCICode_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "Placement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
