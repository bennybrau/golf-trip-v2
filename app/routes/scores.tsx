import { useState } from 'react';
import { Link } from 'react-router';
import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, Button } from '../components/ui';
import { ScoreCard } from '../components/cards';
import { prisma } from '../lib/db';
import type { Route } from './+types/scores';

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
    const year = url.searchParams.get('year') || '2025';
    
    // Define valid sort options
    const validSorts = ['name', 'score', 'rounds'];
    const validOrders = ['asc', 'desc'];
    
    const sortBy = validSorts.includes(sort) ? sort : 'score';
    const sortOrder = validOrders.includes(order) ? order : 'asc';
    const selectedYear = parseInt(year);
    
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

      // Find the yearly status record
      const yearlyStatus = await prisma.golferStatus.findUnique({
        where: {
          golferId_year: {
            golferId,
            year
          }
        }
      });

      if (!yearlyStatus) {
        return { error: "Golfer status not found for this year" };
      }

      // Update the yearly status
      await prisma.golferStatus.update({
        where: { id: yearlyStatus.id },
        data: { isActive: !currentStatus }
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
  const { user, golfers, currentSort, currentOrder, selectedYear } = loaderData;
  
  const getSortUrl = (sortBy: string) => {
    const newOrder = currentSort === sortBy && currentOrder === 'asc' ? 'desc' : 'asc';
    const params = new URLSearchParams();
    params.set('sort', sortBy);
    params.set('order', newOrder);
    if (selectedYear !== 2025) params.set('year', selectedYear.toString());
    return `/scores?${params.toString()}`;
  };
  
  const getSortIcon = (sortBy: string) => {
    if (currentSort !== sortBy) {
      return '↕️'; // Both directions when not sorted by this column
    }
    return currentOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tournament Scores
              </h1>
              <p className="text-gray-600">
                View scores and standings for each tournament year
              </p>
            </div>
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
                  window.location.href = `/scores?${params.toString()}`;
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
                  to={getSortUrl('score')}
                  className="text-sm px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 flex items-center gap-1"
                >
                  Score {getSortIcon('score')}
                </Link>
                <Link 
                  to={getSortUrl('rounds')}
                  className="text-sm px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 flex items-center gap-1"
                >
                  Rounds {getSortIcon('rounds')}
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

        {/* Scores List */}
        <div className="grid gap-4">
          {golfers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">
                  No golfers found for {selectedYear}. Add golfers to the tournament to see scores!
                </p>
              </CardContent>
            </Card>
          ) : (
            golfers.map((golfer: any) => (
              <ScoreCard
                key={golfer.id}
                golfer={golfer}
                user={user}
                selectedYear={selectedYear}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}