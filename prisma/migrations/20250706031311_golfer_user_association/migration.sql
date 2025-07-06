/*
  Warnings:

  - A unique constraint covering the columns `[golferId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "golferId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_golferId_key" ON "User"("golferId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_golferId_fkey" FOREIGN KEY ("golferId") REFERENCES "Golfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
