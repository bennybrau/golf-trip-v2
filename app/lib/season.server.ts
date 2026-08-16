/**
 * Server-only season helpers. Imports prisma, so this must never be reachable
 * from a component -- see the note in ./season.ts.
 */

import { prisma } from './db';
import { CURRENT_YEAR } from './season';

/**
 * Every season the app knows about, newest first.
 *
 * CURRENT_YEAR is always included even when it has no data yet. That is load
 * bearing: a brand-new season must be selectable *before* any rows exist for it,
 * otherwise there is no way to navigate to it in order to run the rollover that
 * creates those rows.
 *
 * Three grouped reads over small tables; a hand-written UNION would not be
 * meaningfully faster and would lose Prisma's typing.
 */
export async function getAvailableYears(): Promise<number[]> {
  const [foursomes, statuses, champions, photos] = await Promise.all([
    prisma.foursome.groupBy({ by: ['year'] }),
    prisma.golferStatus.groupBy({ by: ['year'] }),
    prisma.champion.groupBy({ by: ['year'] }),
    prisma.photo.groupBy({ by: ['year'], where: { year: { not: null } } }),
  ]);

  const years = new Set<number>([CURRENT_YEAR]);
  for (const row of foursomes) years.add(row.year);
  for (const row of statuses) years.add(row.year);
  for (const row of champions) years.add(row.year);
  for (const row of photos) if (row.year != null) years.add(row.year);

  return [...years].sort((a, b) => b - a);
}

/**
 * Counts what a rollover from `sourceYear` into `targetYear` would create,
 * without writing anything. Backs the confirmation step on /admin/season.
 */
export async function previewRollover(
  sourceYear: number,
  targetYear: number,
  includeInactive = false
): Promise<{ sourceRoster: number; alreadyPresent: number; willCreate: number }> {
  const sourceRows = await prisma.golferStatus.findMany({
    where: { year: sourceYear, ...(includeInactive ? {} : { isActive: true }) },
    select: { golferId: true },
  });

  if (sourceRows.length === 0) {
    return { sourceRoster: 0, alreadyPresent: 0, willCreate: 0 };
  }

  const golferIds = sourceRows.map((r) => r.golferId);
  const existing = await prisma.golferStatus.count({
    where: { year: targetYear, golferId: { in: golferIds } },
  });

  return {
    sourceRoster: sourceRows.length,
    alreadyPresent: existing,
    willCreate: sourceRows.length - existing,
  };
}

/**
 * Copies a season's roster forward.
 *
 * Idempotent by construction: GolferStatus is unique on [golferId, year], so
 * `skipDuplicates` makes a second run a no-op rather than an error. Cabins are
 * NOT copied by default -- they are reassigned annually, and a copied cabin
 * looks authoritative while being wrong.
 */
export async function runRollover(
  sourceYear: number,
  targetYear: number,
  options: { includeInactive?: boolean; copyCabins?: boolean } = {}
): Promise<{ created: number; skipped: number; total: number }> {
  const { includeInactive = false, copyCabins = false } = options;

  const sourceRows = await prisma.golferStatus.findMany({
    where: { year: sourceYear, ...(includeInactive ? {} : { isActive: true }) },
    select: { golferId: true, cabin: true },
  });

  if (sourceRows.length === 0) {
    return { created: 0, skipped: 0, total: 0 };
  }

  const result = await prisma.golferStatus.createMany({
    data: sourceRows.map((row) => ({
      golferId: row.golferId,
      year: targetYear,
      isActive: true,
      cabin: copyCabins ? row.cabin : null,
    })),
    skipDuplicates: true,
  });

  return {
    created: result.count,
    skipped: sourceRows.length - result.count,
    total: sourceRows.length,
  };
}
