-- CreateTable
CREATE TABLE "Champion" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "golferId" TEXT NOT NULL,
    "photoUrl" TEXT,
    "cloudflareId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Champion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Champion_year_key" ON "Champion"("year");

-- AddForeignKey
ALTER TABLE "Champion" ADD CONSTRAINT "Champion_golferId_fkey" FOREIGN KEY ("golferId") REFERENCES "Golfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Champion" ADD CONSTRAINT "Champion_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
