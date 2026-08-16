import { Link } from 'react-router';
import { requireAuth } from '../lib/session';
import {
  PageLayout,
  PageHeader,
  Button,
  YearSelect,
  SortChips,
  ActionMessage,
  EmptyState,
  type SortOption,
} from '../components/ui';
import { ScoreCard } from '../components/cards';
import { prisma } from '../lib/db';
import { appendYear, resolveYear } from '../lib/season';
import { getAvailableYears } from '../lib/season.server';
import type { Route } from './+types/scores';

const SORT_OPTIONS: readonly SortOption[] = [
  { value: 'score', label: 'Score' },
  { value: 'name', label: 'Name' },
  { value: 'rounds', label: 'Rounds' },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Scores - Scaletta Golf Trip" },
    { name: "description", content: "View tournament scores by year" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    
    // Get parameters from URL
    const url = new URL(request.url);
    const sort = url.searchParams.get('sort') || 'score';
    const order = url.searchParams.get('order') || 'asc';

    // Define valid sort options
    const validSorts = ['name', 'score', 'rounds'];
    const validOrders = ['asc', 'desc'];

    const sortBy = validSorts.includes(sort) ? sort : 'score';
    const sortOrder = validOrders.includes(order) ? order : 'asc';
    const availableYears = await getAvailableYears();
    const selectedYear = resolveYear(url.searchParams, availableYears);
    
    // Get golfers with their yearly status and foursomes for the selected year
    const golfers = await prisma.golfer.findMany({
      include: {
        foursomesAsPlayer1: {
          where: { year: selectedYear }
        },
        foursomesAsPlayer2: {
          where: { year: selectedYear }
        },
        foursomesAsPlayer3: {
          where: { year: selectedYear }
        },
        foursomesAsPlayer4: {
          where: { year: selectedYear }
        },
        yearlyStatus: {
          where: { year: selectedYear }
        },
      },
      orderBy: sortBy !== 'score' && sortBy !== 'rounds' ? { [sortBy]: sortOrder } : { name: 'asc' }
    });

    // Filter golfers who have yearly status for this year
    const activeGolfers = golfers.filter(golfer => {
      const yearStatus = golfer.yearlyStatus[0];
      if (!yearStatus) return false;
      
      // Admins see all golfers for the year, non-admins only see active golfers
      return user.isAdmin || yearStatus.isActive;
    });

    const golfersWithScores = activeGolfers.map(golfer => {
      const allFoursomes = [
        ...golfer.foursomesAsPlayer1,
        ...golfer.foursomesAsPlayer2,
        ...golfer.foursomesAsPlayer3,
        ...golfer.foursomesAsPlayer4,
      ];
      
      const totalScore = allFoursomes.length > 0 
        ? allFoursomes.reduce((sum, foursome) => sum + foursome.score, 0)
        : null;
      
      const yearStatus = golfer.yearlyStatus[0];
      
      return {
        ...golfer,
        totalScore,
        roundsPlayed: allFoursomes.length,
        cabin: yearStatus?.cabin,
        isActive: yearStatus?.isActive ?? false
      };
    });

    // Sort by score or rounds if requested (since we can't sort calculated fields in DB)
    if (sortBy === 'score') {
      golfersWithScores.sort((a, b) => {
        // Handle null scores (golfers with no rounds)
        if (a.totalScore === null && b.totalScore === null) return 0;
        if (a.totalScore === null) return 1; // Put null scores at the end
        if (b.totalScore === null) return -1; // Put null scores at the end
        
        // Sort by score (ascending = best score first, descending = worst score first)
        const scoreComparison = sortOrder === 'asc' 
          ? a.totalScore - b.totalScore 
          : b.totalScore - a.totalScore;
        
        return scoreComparison;
      });
    } else if (sortBy === 'rounds') {
      golfersWithScores.sort((a, b) => {
        const roundsComparison = sortOrder === 'asc' 
          ? a.roundsPlayed - b.roundsPlayed 
          : b.roundsPlayed - a.roundsPlayed;
        
        return roundsComparison;
      });
    }
    
    // Rounds actually scheduled for this season, so the scoreboard can flag
    // golfers who played fewer -- with a plain sum, missing a round quietly
    // flatters a player's total.
    const roundsThisYear = await prisma.foursome.findMany({
      where: { year: selectedYear },
      select: { round: true },
      distinct: ['round'],
    });

    return {
      user,
      golfers: golfersWithScores,
      currentSort: sortBy,
      currentOrder: sortOrder,
      selectedYear,
      availableYears,
      roundsScheduled: roundsThisYear.length,
    };
  } catch (response) {
    throw response;
  }
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireAuth(request);
  
  if (!user.isAdmin) {
    throw new Response("Unauthorized", { status: 403 });
  }
  
  const formData = await request.formData();
  const action = formData.get('_action') as string;
  
  if (action === 'toggle-golfer-status') {
    const golferId = formData.get('golferId') as string;
    const year = parseInt(formData.get('year') as string);
    const currentStatus = formData.get('currentStatus') === 'true';
    
    try {
      // Check if golfer exists
      const golfer = await prisma.golfer.findUnique({
        where: { id: golferId },
      });

      if (!golfer) {
        return { error: "Golfer not found" };
      }

      // Upsert rather than update: a golfer with no status row for this year is
      // simply not on that year's roster yet, and toggling them active is the
      // natural way to add them. This previously errored with "Golfer status not
      // found for this year", which left admins with no in-app remedy -- the
      // only workaround was opening the golfer's edit page, whose loader created
      // the row as a side effect of a GET.
      await prisma.golferStatus.upsert({
        where: {
          golferId_year: {
            golferId,
            year
          }
        },
        create: {
          golferId,
          year,
          isActive: !currentStatus,
          cabin: null
        },
        update: { isActive: !currentStatus }
      });

      const newStatus = !currentStatus;
      const statusText = newStatus ? 'activated' : 'deactivated';
      return { success: true, message: `Golfer ${statusText} for ${year}` };
    } catch (error) {
      console.error('Golfer status toggle error:', error);
      return { error: "Failed to toggle golfer status" };
    }
  }
  
  if (action === 'update-golfer-cabin') {
    const golferId = formData.get('golferId') as string;
    const year = parseInt(formData.get('year') as string);
    const cabin = formData.get('cabin') as string;
    
    try {
      // Check if golfer exists
      const golfer = await prisma.golfer.findUnique({
        where: { id: golferId },
      });

      if (!golfer) {
        return { error: "Golfer not found" };
      }

      // Parse cabin value (empty string means no cabin)
      const cabinNumber = cabin && cabin !== '' ? parseInt(cabin) : null;
      
      // Validate cabin number
      if (cabinNumber !== null && (isNaN(cabinNumber) || cabinNumber < 1 || cabinNumber > 4)) {
        return { error: "Cabin must be a number between 1 and 4" };
      }

      // Update or create the yearly status record with the new cabin assignment
      await prisma.golferStatus.upsert({
        where: {
          golferId_year: {
            golferId,
            year
          }
        },
        create: {
          golferId,
          year,
          cabin: cabinNumber,
          isActive: true,
        },
        update: {
          cabin: cabinNumber,
        }
      });
      
      const cabinText = cabinNumber ? `Cabin ${cabinNumber}` : 'No cabin';
      return { success: true, message: `Updated ${golfer.name}'s cabin assignment to: ${cabinText}` };
    } catch (error) {
      console.error('Cabin update error:', error);
      return { error: "Failed to update cabin assignment" };
    }
  }
  
  return { error: "Invalid action" };
}

export default function Scores({ loaderData, actionData }: Route.ComponentProps) {
  const { user, golfers, currentSort, currentOrder, selectedYear, availableYears, roundsScheduled } =
    loaderData;

  // Leaderboard rank is by score regardless of the active sort, so switching to
  // sort-by-name does not renumber people into a meaningless order.
  const rankByGolferId = new Map<string, number>();
  [...golfers]
    .filter((g: any) => g.totalScore !== null)
    .sort((a: any, b: any) => a.totalScore - b.totalScore)
    .forEach((g: any, index: number) => rankByGolferId.set(g.id, index + 1));

  const scoredCount = rankByGolferId.size;

  return (
    <PageLayout user={user}>
      <PageHeader
        title="Tournament Scores"
        subtitle={
          scoredCount > 0
            ? `${scoredCount} of ${golfers.length} golfers have played. Lowest total wins.`
            : `Standings for the ${selectedYear} trip. Lowest total wins.`
        }
        controls={
          <>
            <YearSelect years={availableYears} value={selectedYear} />
            {golfers.length > 0 && (
              <SortChips
                options={SORT_OPTIONS}
                currentSort={currentSort}
                currentOrder={currentOrder}
                defaultSort="score"
              />
            )}
          </>
        }
      />

      <ActionMessage actionData={actionData} />

      {golfers.length === 0 ? (
        <EmptyState
          icon="⛳"
          title={`No golfers on the ${selectedYear} roster`}
          description={
            user.isAdmin
              ? `Set up the ${selectedYear} season to copy last year's roster forward, then scores will appear here.`
              : `The ${selectedYear} roster hasn't been set up yet. Check back soon.`
          }
          action={
            user.isAdmin ? (
              <Link to="/admin/season">
                <Button size="sm">Set up {selectedYear}</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-3">
            {golfers.map((golfer: any) => (
              <ScoreCard
                key={golfer.id}
                golfer={golfer}
                user={user}
                selectedYear={selectedYear}
                roundsScheduled={roundsScheduled}
                rank={rankByGolferId.get(golfer.id) ?? null}
              />
            ))}
          </div>

          <p className="mt-6 text-xs text-gray-500">
            Each foursome plays as a team, so a round&rsquo;s score counts for every player in that
            group. Players rotate groups between rounds, so totals still differ.
          </p>
        </>
      )}
    </PageLayout>
  );
}
