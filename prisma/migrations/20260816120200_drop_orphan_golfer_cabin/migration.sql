-- Drops the orphaned Golfer.cabin column.
--
-- History: 20250706023006_migrate_cabin added `cabin` to Golfer. Cabin
-- assignment later moved to GolferStatus.cabin (per-season, since cabins are
-- reassigned each year), and `cabin` was removed from Golfer in schema.prisma --
-- but no migration ever dropped the column.
--
-- SAFETY: verified against production before writing this. The column does NOT
-- exist there; it was already removed out of band by a `db push`. So this is a
-- no-op in production and merely brings a freshly-migrated database in line with
-- both production and schema.prisma. On a fresh database the column is created
-- by 20250706023006 and never written to by any application code path, so there
-- is no data to lose.
--
-- IF EXISTS keeps this idempotent in both directions.

ALTER TABLE "Golfer" DROP COLUMN IF EXISTS "cabin";
