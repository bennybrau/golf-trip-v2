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
import { FoursomeCard } from '../components/cards';
import { prisma } from '../lib/db';
import { appendYear, resolveYear } from '../lib/season';
import { getAvailableYears } from '../lib/season.server';
import { ROUND_LABELS } from '../lib/course';
import type { Route } from './+types/foursomes';

const SORT_OPTIONS: readonly SortOption[] = [
  { value: 'teeTime', label: 'Tee time' },
  { value: 'score', label: 'Score' },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Foursomes - Scaletta Golf Trip" },
    { name: "description", content: "Manage foursomes for each round" },
  ];
}


export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    
    // Get parameters from URL
    const url = new URL(request.url);
    const sort = url.searchParams.get('sort') || 'teeTime';
    const order = url.searchParams.get('order') || 'asc';

    // Define valid sort options
    const validSorts = ['teeTime', 'score', 'createdAt'];
    const validOrders = ['asc', 'desc'];

    const sortBy = validSorts.includes(sort) ? sort : 'teeTime';
    const sortOrder = validOrders.includes(order) ? order : 'asc';
    const availableYears = await getAvailableYears();
    const selectedYear = resolveYear(url.searchParams, availableYears);

    const foursomes = await prisma.foursome.findMany({
      where: {
        year: selectedYear
      },
      include: {
        golfer1: true,
        golfer2: true,
        golfer3: true,
        golfer4: true,
      },
      orderBy: { [sortBy]: sortOrder }
    });
    
    return { user, foursomes, currentSort: sortBy, currentOrder: sortOrder, selectedYear, availableYears };
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
  
  if (action === 'delete-foursome') {
    const foursomeId = formData.get('foursomeId') as string;
    
    try {
      // Check if foursome exists
      const foursome = await prisma.foursome.findUnique({
        where: { id: foursomeId },
      });

      if (!foursome) {
        return { error: "Foursome not found" };
      }
      
      // Delete the foursome
      await prisma.foursome.delete({
        where: { id: foursomeId },
      });
      
      return { success: true, message: 'Foursome deleted successfully' };
    } catch (error) {
      console.error('Foursome delete error:', error);
      return { error: "Failed to delete foursome" };
    }
  }
  
  return { error: "Invalid action" };
}


const roundLabels = {
  FRIDAY_MORNING: 'Friday Morning',
  FRIDAY_AFTERNOON: 'Friday Afternoon',
  SATURDAY_MORNING: 'Saturday Morning',
  SATURDAY_AFTERNOON: 'Saturday Afternoon',
};


export default function Foursomes({ loaderData, actionData }: Route.ComponentProps) {
  const { user, foursomes, currentSort, currentOrder, selectedYear, availableYears } = loaderData;

  const getUrlWithCurrentParams = (basePath: string) => {
    const params = new URLSearchParams();
    if (currentSort !== 'teeTime') params.set('sort', currentSort);
    if (currentOrder !== 'asc') params.set('order', currentOrder);
    appendYear(params, selectedYear);
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  const sortedFoursomes = [...foursomes].sort((a, b) => {
    if (currentSort === 'score') {
      return currentOrder === 'asc' ? a.score - b.score : b.score - a.score;
    }
    const aTime = new Date(a.teeTime).getTime();
    const bTime = new Date(b.teeTime).getTime();
    return currentOrder === 'asc' ? aTime - bTime : bTime - aTime;
  });

  // Group by round so the page reads as "the schedule" rather than a flat list.
  const byRound = new Map<string, typeof sortedFoursomes>();
  for (const foursome of sortedFoursomes) {
    const list = byRound.get(foursome.round) ?? [];
    list.push(foursome);
    byRound.set(foursome.round, list);
  }
  const roundOrder = Object.keys(ROUND_LABELS).filter((round) => byRound.has(round));

  return (
    <PageLayout user={user}>
      <PageHeader
        title="Foursomes"
        subtitle={`Tee times and groups for the ${selectedYear} trip`}
        actions={
          user.isAdmin ? (
            <Link to={getUrlWithCurrentParams('/foursomes/new')}>
              <Button>Add Foursome</Button>
            </Link>
          ) : undefined
        }
        controls={
          <>
            <YearSelect years={availableYears} value={selectedYear} />
            {foursomes.length > 0 && (
              <SortChips
                options={SORT_OPTIONS}
                currentSort={currentSort}
                currentOrder={currentOrder}
                defaultSort="teeTime"
              />
            )}
          </>
        }
      />

      <ActionMessage actionData={actionData} />

      {sortedFoursomes.length === 0 ? (
        <EmptyState
          icon="⛳"
          title={`No foursomes for ${selectedYear}`}
          description={
            user.isAdmin
              ? 'Add a foursome for each round. Golfers must be on this season’s roster before they can be picked.'
              : 'Groups for this season have not been posted yet.'
          }
          action={
            user.isAdmin ? (
              <Link to={getUrlWithCurrentParams('/foursomes/new')}>
                <Button size="sm">Add Foursome</Button>
              </Link>
            ) : undefined
          }
        />
      ) : currentSort === 'teeTime' ? (
        <div className="space-y-6">
          {roundOrder.map((round) => (
            <section key={round} aria-labelledby={`round-${round}`}>
              <h2
                id={`round-${round}`}
                className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500"
              >
                {ROUND_LABELS[round as keyof typeof ROUND_LABELS]}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {byRound.get(round)!.map((foursome) => (
                  <FoursomeCard
                    key={foursome.id}
                    foursome={foursome as any}
                    user={user}
                    getUrlWithCurrentParams={getUrlWithCurrentParams}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sortedFoursomes.map((foursome) => (
            <FoursomeCard
              key={foursome.id}
              foursome={foursome as any}
              user={user}
              getUrlWithCurrentParams={getUrlWithCurrentParams}
            />
          ))}
        </div>
      )}
    </PageLayout>
  );
}
