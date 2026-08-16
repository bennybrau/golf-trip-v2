import { Link } from 'react-router';
import { requireAuth } from '../lib/session';
import {
  PageLayout,
  PageHeader,
  Button,
  SortChips,
  ActionMessage,
  EmptyState,
  YearSelect,
  type SortOption,
} from '../components/ui';
import { GolferCard } from '../components/cards';
import { prisma } from '../lib/db';
import { resolveYear } from '../lib/season';
import { getAvailableYears } from '../lib/season.server';
import type { Route } from './+types/golfers';

const SORT_OPTIONS: readonly SortOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Date added' },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Golfers - Scaletta Golf Trip" },
    { name: "description", content: "Manage golfers in your system" },
  ];
}


export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    
    // Get parameters from URL
    const url = new URL(request.url);
    const sort = url.searchParams.get('sort') || 'name';
    const order = url.searchParams.get('order') || 'asc';
    
    // Define valid sort options (removed score since it's not on this page)
    const validSorts = ['name', 'createdAt'];
    const validOrders = ['asc', 'desc'];
    
    const sortBy = validSorts.includes(sort) ? sort : 'name';
    const sortOrder = validOrders.includes(order) ? order : 'asc';
    
    // Deliberately NOT year-scoped: this is the master roster, and an admin
    // needs to see golfers who are *not* on a season in order to notice that a
    // rollover missed someone. The per-season membership is surfaced as a badge
    // instead, driven by the ?year= param.
    const availableYears = await getAvailableYears();
    const selectedYear = resolveYear(url.searchParams, availableYears);

    const golfers = await prisma.golfer.findMany({
      orderBy: { [sortBy]: sortOrder },
      include: {
        yearlyStatus: { where: { year: selectedYear } },
      },
    });

    const golfersWithRoster = golfers.map((golfer) => ({
      ...golfer,
      onRoster: golfer.yearlyStatus.length > 0,
      isActiveThisYear: golfer.yearlyStatus[0]?.isActive ?? false,
    }));

    return {
      user,
      golfers: golfersWithRoster,
      currentSort: sortBy,
      currentOrder: sortOrder,
      selectedYear,
      availableYears,
      rosterCount: golfersWithRoster.filter((g) => g.onRoster).length,
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
  
  if (action === 'delete-golfer') {
    const golferId = formData.get('golferId') as string;
    
    try {
      // Check if golfer exists
      const golfer = await prisma.golfer.findUnique({
        where: { id: golferId },
        include: {
          championships: true,
          foursomesAsPlayer1: true,
          foursomesAsPlayer2: true,
          foursomesAsPlayer3: true,
          foursomesAsPlayer4: true,
        },
      });

      if (!golfer) {
        return { error: "Golfer not found" };
      }

      // Check if golfer has associated records
      const hasChampionships = golfer.championships.length > 0;
      const hasForusomes = golfer.foursomesAsPlayer1.length > 0 || 
                           golfer.foursomesAsPlayer2.length > 0 || 
                           golfer.foursomesAsPlayer3.length > 0 || 
                           golfer.foursomesAsPlayer4.length > 0;
      
      if (hasChampionships || hasForusomes) {
        return { error: "Cannot delete golfer. They have associated championships or foursome records." };
      }
      
      // Delete the golfer
      await prisma.golfer.delete({
        where: { id: golferId },
      });
      
      return { success: true, message: 'Golfer deleted successfully' };
    } catch (error) {
      console.error('Golfer delete error:', error);
      return { error: "Failed to delete golfer" };
    }
  }

  
  return { error: "Invalid action" };
}


export default function Golfers({ loaderData, actionData }: Route.ComponentProps) {
  const { user, golfers, currentSort, currentOrder, selectedYear, availableYears, rosterCount } =
    loaderData;

  const getUrlWithCurrentParams = (basePath: string) => {
    const params = new URLSearchParams();
    if (currentSort !== 'name') params.set('sort', currentSort);
    if (currentOrder !== 'asc') params.set('order', currentOrder);
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  const missingFromRoster = golfers.length - rosterCount;

  return (
    <PageLayout user={user}>
      <PageHeader
        title="Golfers"
        subtitle={`${golfers.length} golfer${golfers.length === 1 ? '' : 's'} on record · ${rosterCount} on the ${selectedYear} roster`}
        actions={
          user.isAdmin ? (
            <Link to={getUrlWithCurrentParams('/golfers/new')}>
              <Button>Add Golfer</Button>
            </Link>
          ) : undefined
        }
        controls={
          <>
            <YearSelect years={availableYears} value={selectedYear} />
            {golfers.length > 0 && (
              <SortChips
                options={SORT_OPTIONS}
                currentSort={currentSort}
                currentOrder={currentOrder}
                defaultSort="name"
              />
            )}
          </>
        }
      />

      <ActionMessage actionData={actionData} />

      {user.isAdmin && missingFromRoster > 0 && golfers.length > 0 && (
        <div className="mb-6 rounded-control border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p>
            <span className="font-medium">
              {missingFromRoster} golfer{missingFromRoster === 1 ? ' is' : 's are'} not on the{' '}
              {selectedYear} roster.
            </span>{' '}
            They will not appear on the {selectedYear} scoreboard or in foursome pickers.
          </p>
          <Link to="/admin/season" className="mt-2 inline-block font-medium underline underline-offset-2">
            Set up the {selectedYear} season &rarr;
          </Link>
        </div>
      )}

      {golfers.length === 0 ? (
        <EmptyState
          icon="⛳"
          title="No golfers yet"
          description="Add the people who come on the trip. They can then be put on a season roster and into foursomes."
          action={
            user.isAdmin ? (
              <Link to={getUrlWithCurrentParams('/golfers/new')}>
                <Button size="sm">Add Golfer</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {golfers.map((golfer: any) => (
            <GolferCard
              key={golfer.id}
              golfer={golfer}
              user={user}
              selectedYear={selectedYear}
              getUrlWithCurrentParams={getUrlWithCurrentParams}
            />
          ))}
        </div>
      )}
    </PageLayout>
  );
}
