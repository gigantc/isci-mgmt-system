-- AlterTable: add mediaType first so the old letter can be mapped before it is dropped
ALTER TABLE "Placement" ADD COLUMN "mediaType" TEXT NOT NULL DEFAULT 'D';

-- Backfill from the old letter: B -> T (broadcast), R -> R (radio), everything else -> D (digital).
-- CTV had letter T and must become D, so this keys off the letter column, not the new value.
UPDATE "Placement" SET "mediaType" = CASE "letter" WHEN 'B' THEN 'T' WHEN 'R' THEN 'R' ELSE 'D' END;

-- DropIndex
DROP INDEX "Placement_letter_key";

-- AlterTable
ALTER TABLE "Placement" DROP COLUMN "letter";
