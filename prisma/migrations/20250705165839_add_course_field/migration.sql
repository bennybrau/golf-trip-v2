-- CreateEnum
CREATE TYPE "Course" AS ENUM ('BLACK', 'SILVER');

-- AlterTable
ALTER TABLE "Foursome" ADD COLUMN     "course" "Course";
