-- Reconciles drift introduced by out-of-band `prisma db push` usage.
--
-- Every statement is idempotent (IF NOT EXISTS / DROP DEFAULT) because production
-- already has GolferStatus.cabin from a push, while a freshly migrated database
-- does not. This migration must be a recorded no-op on production and corrective
-- on a fresh database.
--
-- NOTE: `Golfer.cabin` (added by 20250706023006_migrate_cabin, since removed from
-- schema.prisma) is deliberately NOT dropped here. That is the only irreversible
-- operation in this effort and lives in its own separately-reviewed migration,
-- gated on confirming no non-null values remain. Prisma ignores columns absent
-- from the schema, so leaving it costs nothing.

-- 1. GolferStatus.cabin exists in schema.prisma but was never created by a
--    migration -- 20250912030336_add_golfer_yearly_status omits it. Without this,
--    the cabin upserts in scores.tsx and golfers.$id.edit.tsx fail on any
--    freshly-migrated database.
ALTER TABLE "GolferStatus" ADD COLUMN IF NOT EXISTS "cabin" INTEGER;

-- 2. Foursome.year defaulted to 2024, which silently files any row created
--    without an explicit year under the wrong season. Every application write
--    path supplies year explicitly, so removing the default is safe.
ALTER TABLE "Foursome" ALTER COLUMN "year" DROP DEFAULT;

-- 3. PasswordResetToken is declared in schema.prisma and used by app/lib/auth.ts
--    (createPasswordResetToken / validatePasswordResetToken / resetPassword) but
--    NO migration has ever created it. On a freshly-migrated database the entire
--    password-reset flow fails: /forgot-password and /reset-password/:token both
--    query a table that does not exist. Production has it via `db push`.
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key"
    ON "PasswordResetToken"("token");

-- ADD CONSTRAINT has no IF NOT EXISTS form, so guard on the catalog.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PasswordResetToken_userId_fkey'
    ) THEN
        ALTER TABLE "PasswordResetToken"
            ADD CONSTRAINT "PasswordResetToken_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 4. Golfer.name is declared @unique in schema.prisma but no migration creates
--    the index. golfers.new.tsx does an application-level duplicate check, which
--    is racy without the constraint backing it.
--
--    NOTE: this fails if duplicate golfer names already exist. Production should
--    already have the index from `db push`, making this a no-op there. If it does
--    fail, resolve the duplicates first:
--      SELECT name, count(*) FROM "Golfer" GROUP BY name HAVING count(*) > 1;
CREATE UNIQUE INDEX IF NOT EXISTS "Golfer_name_key" ON "Golfer"("name");

-- 5. Photo.year enables per-season gallery filtering, matching how foursomes,
--    golfer status and champions are already scoped. Nullable so existing rows
--    remain valid; backfilled by the next migration.
ALTER TABLE "Photo" ADD COLUMN IF NOT EXISTS "year" INTEGER;

CREATE INDEX IF NOT EXISTS "Photo_year_idx" ON "Photo"("year");
