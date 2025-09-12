-- CreateTable
CREATE TABLE "GolferStatus" (
    "id" TEXT NOT NULL,
    "golferId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GolferStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GolferStatus_golferId_year_key" ON "GolferStatus"("golferId", "year");

-- AddForeignKey
ALTER TABLE "GolferStatus" ADD CONSTRAINT "GolferStatus_golferId_fkey" FOREIGN KEY ("golferId") REFERENCES "Golfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
