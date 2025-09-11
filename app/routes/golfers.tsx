import { useState } from 'react';
import { Link } from 'react-router';
import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, Button } from '../components/ui';
import { GolferCard } from '../components/cards';
import { prisma } from '../lib/db';
import type { Route } from './+types/golfers';

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
    const sort = url.searchParams.get('sort') || 'score';
    const order = url.searchParams.get('order') || 'asc';
    const year = url.searchParams.get('year') || '2024';
    
    // Define valid sort options
    const validSorts = ['name', 'createdAt', 'score'];
    const validOrders = ['asc', 'desc'];
    
    const sortBy = validSorts.includes(sort) ? sort : 'score';
    const sortOrder = validOrders.includes(order) ? order : 'asc';
    const selectedYear = parseInt(year);
    
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
      },
      orderBy: sortBy !== 'score' ? { [sortBy]: sortOrder } : { createdAt: 'desc' }
    });

    // Calculate total scores for each golfer
    const golfersWithScores = golfers.map(golfer => {
      const allFoursomes = [
        ...golfer.foursomesAsPlayer1,
        ...golfer.foursomesAsPlayer2,
        ...golfer.foursomesAsPlayer3,
        ...golfer.foursomesAsPlayer4,
      ];
      
      const totalScore = allFoursomes.length > 0 
        ? allFoursomes.reduce((sum, foursome) => sum + foursome.score, 0)
        : null;
      
      return {
        ...golfer,
        totalScore,
        roundsPlayed: allFoursomes.length
      };
    });

    // Sort by score if requested (since we can't sort calculated fields in DB)
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
    }
    
    return { user, golfers: golfersWithScores, currentSort: sortBy, currentOrder: sortOrder, selectedYear };
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
  const { user, golfers, currentSort, currentOrder, selectedYear } = loaderData;
  const [deletingGolferId, setDeletingGolferId] = useState<string | null>(null);
  
  const getSortUrl = (sortBy: string) => {
    const newOrder = currentSort === sortBy && currentOrder === 'asc' ? 'desc' : 'asc';
    const params = new URLSearchParams();
    params.set('sort', sortBy);
    params.set('order', newOrder);
    if (selectedYear !== 2024) params.set('year', selectedYear.toString());
    return `/golfers?${params.toString()}`;
  };
  
  const getSortIcon = (sortBy: string) => {
    if (currentSort !== sortBy) {
      return '↕️'; // Both directions when not sorted by this column
    }
    return currentOrder === 'asc' ? '↑' : '↓';
  };
  
  // Generate URL with current search parameters
  const getUrlWithCurrentParams = (basePath: string) => {
    const params = new URLSearchParams();
    if (currentSort !== 'score') params.set('sort', currentSort);
    if (currentOrder !== 'asc') params.set('order', currentOrder);
    if (selectedYear !== 2024) params.set('year', selectedYear.toString());
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Golfers
              </h1>
              <p className="text-gray-600">
                Manage golfers in your system
              </p>
            </div>
            
            {/* Add Golfer Button (Admin Only) */}
            {user.isAdmin && (
              <Link to={getUrlWithCurrentParams('/golfers/new')}>
                <Button>
                  Add Golfer
                </Button>
              </Link>
            )}
          </div>
          
          {/* Year and Sort Controls */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Year Selector */}
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-800 font-medium">Year:</span>
              <select 
                value={selectedYear}
                onChange={(e) => {
                  const newYear = e.target.value;
                  const params = new URLSearchParams();
                  params.set('year', newYear);
                  if (currentSort !== 'score') params.set('sort', currentSort);
                  if (currentOrder !== 'asc') params.set('order', currentOrder);
                  window.location.href = `/golfers?${params.toString()}`;
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
            
            {/* Sort Controls */}
            {golfers.length > 0 && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-800 font-medium">Sort by:</span>
                <Link 
                  to={getSortUrl('name')}
                  className="text-sm px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 flex items-center gap-1"
                >
                  Name {getSortIcon('name')}
                </Link>
                <Link 
                  to={getSortUrl('createdAt')}
                  className="text-sm px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 flex items-center gap-1"
                >
                  Date Added {getSortIcon('createdAt')}
                </Link>
                <Link 
                  to={getSortUrl('score')}
                  className="text-sm px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 flex items-center gap-1"
                >
                  Score {getSortIcon('score')}
                </Link>
              </div>
            )}
          </div>
        </div>


        {/* Action Messages */}
        {actionData?.error && (
          <div className="mb-6 text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
            {actionData.error}
          </div>
        )}
        
        {actionData?.success && (
          <div className="mb-6 text-green-600 text-sm bg-green-50 border border-green-200 rounded-md p-3">
            {actionData.message}
          </div>
        )}

        {/* Golfers List */}
        <div className="grid gap-4">
          {golfers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">
                  No golfers found. Add your first golfer to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            golfers.map((golfer: any) => (
              <GolferCard
                key={golfer.id}
                golfer={golfer}
                user={user}
                deletingGolferId={deletingGolferId}
                setDeletingGolferId={setDeletingGolferId}
                getUrlWithCurrentParams={getUrlWithCurrentParams}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}