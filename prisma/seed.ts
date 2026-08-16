/**
 * Development seed.
 *
 * The repo previously had no way to produce a working local database. The
 * local_data.sql dump it shipped instead predated Foursome.year and contained
 * zero GolferStatus and zero Champion rows, so restoring it yielded a database
 * where every golfer was invisible on every year's pages; it has been deleted
 * in favour of this file.
 *
 * This seeds a realistic 2025 season so the 2026 rollover has something to roll
 * over from. Safe to re-run: every write is an upsert keyed on a unique field.
 *
 * Run with `npm run db:seed` (or `npx prisma db seed`).
 */

import { PrismaClient, Round, Course } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEED_YEAR = 2025;

// Scramble teams rotate between rounds, which is what makes an individual
// ranking meaningful: each golfer accumulates a different set of team scores.
const GOLFER_NAMES = [
  'Jon Arme', 'Paul Scaletta', 'John Scaletta', 'Mike Bivens',
  'Brad Quigley', 'Ryan Fisher', 'Dave Miller', 'Tom Anderson',
  'Chris Walker', 'Steve Harris', 'Kevin Doyle', 'Mark Sullivan',
  'Greg Peterson', 'Nick Barrett', 'Alex Rowan', 'Pete Cassidy',
];

/** Cabin assignments for the seeded year: 4 golfers per cabin, 1-4. */
function cabinFor(index: number): number {
  return Math.floor(index / 4) + 1;
}

/**
 * Tee times are stored UTC and displayed in America/New_York (see
 * app/lib/timeUtils.ts). 13:00Z = 9:00am ET, 18:00Z = 2:00pm ET.
 */
const ROUNDS: Array<{ round: Round; course: Course; teeTime: Date; scores: number[] }> = [
  { round: Round.FRIDAY_MORNING,     course: Course.BLACK,  teeTime: new Date('2025-09-26T13:00:00Z'), scores: [-4, -2, 1, 3] },
  { round: Round.FRIDAY_AFTERNOON,   course: Course.SILVER, teeTime: new Date('2025-09-26T18:00:00Z'), scores: [-3, 0, 2, 5] },
  { round: Round.SATURDAY_MORNING,   course: Course.BLACK,  teeTime: new Date('2025-09-27T13:00:00Z'), scores: [-5, -1, 2, 4] },
  { round: Round.SATURDAY_AFTERNOON, course: Course.SILVER, teeTime: new Date('2025-09-27T18:00:00Z'), scores: [-2, -1, 3, 6] },
];

/**
 * Rotates the roster between rounds so no two golfers share a team every round.
 * Round N shifts the roster by N groups, which keeps groups of 4 intact while
 * changing who is paired with whom.
 */
function groupsForRound(golferIds: string[], roundIndex: number): string[][] {
  const shift = roundIndex * 5; // coprime with 16, so pairings differ each round
  const rotated = golferIds.map((_, i) => golferIds[(i + shift) % golferIds.length]);
  const groups: string[][] = [];
  for (let i = 0; i < rotated.length; i += 4) groups.push(rotated.slice(i, i + 4));
  return groups;
}

async function main() {
  console.log('🌱 Seeding...');

  const password = await bcrypt.hash('password123', 10);

  const golfers = [];
  for (const name of GOLFER_NAMES) {
    golfers.push(
      await prisma.golfer.upsert({
        where: { name },
        update: {},
        create: { name, email: null, phone: null },
      })
    );
  }
  console.log(`  ✓ ${golfers.length} golfers`);

  for (const [i, golfer] of golfers.entries()) {
    await prisma.golferStatus.upsert({
      where: { golferId_year: { golferId: golfer.id, year: SEED_YEAR } },
      update: {},
      create: { golferId: golfer.id, year: SEED_YEAR, isActive: true, cabin: cabinFor(i) },
    });
  }
  console.log(`  ✓ ${golfers.length} GolferStatus rows for ${SEED_YEAR}`);

  // Admin is linked to a golfer so the dashboard's "your score" path is exercised.
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { isAdmin: true },
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password,
      isAdmin: true,
      golferId: golfers[0].id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'golfer@example.com' },
    update: {},
    create: {
      email: 'golfer@example.com',
      name: 'Regular Golfer',
      password,
      isAdmin: false,
      golferId: golfers[1].id,
    },
  });
  console.log('  ✓ 2 users (admin@example.com / golfer@example.com, password123)');

  // Foursomes are keyed on nothing unique, so clear the seeded year first to
  // keep re-runs idempotent rather than accumulating duplicate groups.
  await prisma.foursome.deleteMany({ where: { year: SEED_YEAR } });

  let foursomeCount = 0;
  for (const [roundIndex, spec] of ROUNDS.entries()) {
    const groups = groupsForRound(golfers.map((g) => g.id), roundIndex);
    for (const [groupIndex, group] of groups.entries()) {
      await prisma.foursome.create({
        data: {
          round: spec.round,
          course: spec.course,
          teeTime: new Date(spec.teeTime.getTime() + groupIndex * 10 * 60 * 1000),
          year: SEED_YEAR,
          score: spec.scores[groupIndex] ?? 0,
          golfer1Id: group[0] ?? null,
          golfer2Id: group[1] ?? null,
          golfer3Id: group[2] ?? null,
          golfer4Id: group[3] ?? null,
        },
      });
      foursomeCount++;
    }
  }
  console.log(`  ✓ ${foursomeCount} foursomes across ${ROUNDS.length} rounds`);

  await prisma.champion.upsert({
    where: { year: SEED_YEAR - 1 },
    update: {},
    create: {
      year: SEED_YEAR - 1,
      golferId: golfers[0].id,
      createdBy: admin.id,
      displayName: null,
      motivation: 'Bragging rights for a whole year.',
      meaning: 'It means the guys have to listen to me until next September.',
      lifeChange: 'I bought a new putter I did not need.',
      favoriteQuote: 'Drive for show, putt for dough.',
    },
  });
  console.log(`  ✓ 1 champion (${SEED_YEAR - 1})`);

  console.log('🌱 Done.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
