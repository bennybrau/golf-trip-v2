-- CreateEnum
CREATE TYPE "Round" AS ENUM ('FRIDAY_MORNING', 'FRIDAY_AFTERNOON', 'SATURDAY_MORNING', 'SATURDAY_AFTERNOON');

-- CreateTable
CREATE TABLE "Foursome" (
    "id" TEXT NOT NULL,
    "round" "Round" NOT NULL,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "golfer1Id" TEXT NOT NULL,
    "golfer2Id" TEXT NOT NULL,
    "golfer3Id" TEXT NOT NULL,
    "golfer4Id" TEXT NOT NULL,

    CONSTRAINT "Foursome_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Foursome" ADD CONSTRAINT "Foursome_golfer1Id_fkey" FOREIGN KEY ("golfer1Id") REFERENCES "Golfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foursome" ADD CONSTRAINT "Foursome_golfer2Id_fkey" FOREIGN KEY ("golfer2Id") REFERENCES "Golfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foursome" ADD CONSTRAINT "Foursome_golfer3Id_fkey" FOREIGN KEY ("golfer3Id") REFERENCES "Golfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foursome" ADD CONSTRAINT "Foursome_golfer4Id_fkey" FOREIGN KEY ("golfer4Id") REFERENCES "Golfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
