/*
  Warnings:

  - Made the column `score` on table `Foursome` required. This step will fail if there are existing NULL values in that column.
  - Made the column `teeTime` on table `Foursome` required. This step will fail if there are existing NULL values in that column.
  - Made the column `course` on table `Foursome` required. This step will fail if there are existing NULL values in that column.

*/
-- Update existing NULL values before making columns required
UPDATE "Foursome" SET "score" = 0 WHERE "score" IS NULL;
UPDATE "Foursome" SET "course" = 'BLACK' WHERE "course" IS NULL;
UPDATE "Foursome" SET "teeTime" = NOW() WHERE "teeTime" IS NULL;

-- AlterTable
ALTER TABLE "Foursome" ALTER COLUMN "score" SET NOT NULL,
ALTER COLUMN "score" SET DEFAULT 0,
ALTER COLUMN "teeTime" SET NOT NULL,
ALTER COLUMN "course" SET NOT NULL;
