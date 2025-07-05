-- DropForeignKey
ALTER TABLE "Foursome" DROP CONSTRAINT "Foursome_golfer1Id_fkey";

-- DropForeignKey
ALTER TABLE "Foursome" DROP CONSTRAINT "Foursome_golfer2Id_fkey";

-- DropForeignKey
ALTER TABLE "Foursome" DROP CONSTRAINT "Foursome_golfer3Id_fkey";

-- DropForeignKey
ALTER TABLE "Foursome" DROP CONSTRAINT "Foursome_golfer4Id_fkey";

-- AlterTable
ALTER TABLE "Foursome" ALTER COLUMN "golfer1Id" DROP NOT NULL,
ALTER COLUMN "golfer2Id" DROP NOT NULL,
ALTER COLUMN "golfer3Id" DROP NOT NULL,
ALTER COLUMN "golfer4Id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Foursome" ADD CONSTRAINT "Foursome_golfer1Id_fkey" FOREIGN KEY ("golfer1Id") REFERENCES "Golfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foursome" ADD CONSTRAINT "Foursome_golfer2Id_fkey" FOREIGN KEY ("golfer2Id") REFERENCES "Golfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foursome" ADD CONSTRAINT "Foursome_golfer3Id_fkey" FOREIGN KEY ("golfer3Id") REFERENCES "Golfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foursome" ADD CONSTRAINT "Foursome_golfer4Id_fkey" FOREIGN KEY ("golfer4Id") REFERENCES "Golfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
