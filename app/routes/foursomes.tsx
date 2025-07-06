import { useState } from 'react';
import { Link } from 'react-router';
import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, Button, Spinner } from '../components/ui';
import { prisma } from '../lib/db';
import type { Route } from './+types/foursomes';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Foursomes - Scaletta Golf Trip" },
    { name: "description", content: "Manage foursomes for each round" },
  ];
}


export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    
    // Get sort parameter from URL
    const url = new URL(request.url);
    const sort = url.searchParams.get('sort') || 'teeTime';
    const order = url.searchParams.get('order') || 'asc';
    
    // Define valid sort options
    const validSorts = ['teeTime', 'score', 'createdAt'];
    const validOrders = ['asc', 'desc'];
    
    const sortBy = validSorts.includes(sort) ? sort : 'teeTime';
    const sortOrder = validOrders.includes(order) ? order : 'asc';
    
    const foursomes = await prisma.foursome.findMany({
      include: {
        golfer1: true,
        golfer2: true,
        golfer3: true,
        golfer4: true,
      },
      orderBy: { [sortBy]: sortOrder }
    });
    
    return { user, foursomes, currentSort: sortBy, currentOrder: sortOrder };
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

const getCourseBadgeClasses = (course: string) => {
  const courseLower = course.toLowerCase();
  if (courseLower === 'black') {
    return 'bg-black text-white';
  } else if (courseLower === 'silver') {
    return 'bg-gray-400 text-black';
  }
  return 'bg-blue-500 text-white'; // Default for other courses
};

const formatTeeTime = (teeTime: string) => {
  const date = new Date(teeTime);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = dayNames[date.getDay()];
  const time = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
  return `${day} ${time}`;
};

export default function Foursomes({ loaderData, actionData }: Route.ComponentProps) {
  const { user, foursomes, currentSort, currentOrder } = loaderData;
  const [deletingFoursomeId, setDeletingFoursomeId] = useState<string | null>(null);
  
  const getSortUrl = (sortBy: string) => {
    const newOrder = currentSort === sortBy && currentOrder === 'asc' ? 'desc' : 'asc';
    return `/foursomes?sort=${sortBy}&order=${newOrder}`;
  };
  
  const getSortIcon = (sortBy: string) => {
    if (currentSort !== sortBy) {
      return '↕️';
    }
    return currentOrder === 'asc' ? '↑' : '↓';
  };
  
  // Generate URL with current search parameters
  const getUrlWithCurrentParams = (basePath: string) => {
    const params = new URLSearchParams();
    if (currentSort !== 'teeTime') params.set('sort', currentSort);
    if (currentOrder !== 'asc') params.set('order', currentOrder);
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  const sortedFoursomes = [...foursomes].sort((a, b) => {
    if (currentSort === 'teeTime') {
      const aTime = new Date(a.teeTime).getTime();
      const bTime = new Date(b.teeTime).getTime();
      return currentOrder === 'asc' ? aTime - bTime : bTime - aTime;
    } else if (currentSort === 'score') {
      const aScore = a.score;
      const bScore = b.score;
      return currentOrder === 'asc' ? aScore - bScore : bScore - aScore;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Foursomes
              </h1>
              <p className="text-gray-600">
                Manage foursomes for each round
              </p>
            </div>
            
            {/* Add Foursome Button (Admin Only) */}
            {user.isAdmin && (
              <Link to={getUrlWithCurrentParams('/foursomes/new')}>
                <Button>
                  Add Foursome
                </Button>
              </Link>
            )}
          </div>
          
          {/* Sort Controls */}
          {foursomes.length > 0 && (
            <div className="mt-4 flex gap-2 items-center">
              <span className="text-sm text-gray-600">Sort by:</span>
              <Link 
                to={getSortUrl('teeTime')}
                className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50 flex items-center gap-1"
              >
                Tee Time {getSortIcon('teeTime')}
              </Link>
              <Link 
                to={getSortUrl('score')}
                className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50 flex items-center gap-1"
              >
                Score {getSortIcon('score')}
              </Link>
            </div>
          )}
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

        {/* Foursomes List */}
        <div className="grid gap-4">
          {sortedFoursomes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">
                  No foursomes found. Create your first foursome to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            sortedFoursomes.map((foursome: any) => (
              <Card key={foursome.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatTeeTime(foursome.teeTime)}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCourseBadgeClasses(foursome.course)}`}>
                          {foursome.course}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          <strong>Round:</strong> {roundLabels[foursome.round as keyof typeof roundLabels]}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Players:</strong> {[foursome.golfer1?.name, foursome.golfer2?.name, foursome.golfer3?.name, foursome.golfer4?.name].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {/* Edit & Delete Buttons (Admin Only) */}
                      {user.isAdmin && (
                        <div className="flex gap-2">
                          {/* Edit Button */}
                          <Link to={getUrlWithCurrentParams(`/foursomes/${foursome.id}/edit`)}>
                            <Button 
                              size="sm"
                              variant="secondary"
                            >
                              Edit
                            </Button>
                          </Link>
                          
                          {/* Delete Button */}
                          <form 
                            method="post" 
                            className="inline"
                            onSubmit={(e) => {
                              const roundName = roundLabels[foursome.round as keyof typeof roundLabels];
                              if (!confirm(`Are you sure you want to delete the ${roundName} foursome? This action cannot be undone.`)) {
                                e.preventDefault();
                                return false;
                              }
                              setDeletingFoursomeId(foursome.id);
                              return true;
                            }}
                          >
                            <input type="hidden" name="_action" value="delete-foursome" />
                            <input type="hidden" name="foursomeId" value={foursome.id} />
                            <Button
                              type="submit"
                              variant="danger"
                              size="sm"
                              disabled={deletingFoursomeId === foursome.id}
                            >
                              {deletingFoursomeId === foursome.id ? (
                                <div className="flex items-center gap-1">
                                  <Spinner size="sm" />
                                  Deleting...
                                </div>
                              ) : (
                                'Delete'
                              )}
                            </Button>
                          </form>
                        </div>
                      )}
                      <div className="text-2xl font-bold text-gray-900">
                        {foursome.score > 0 ? '+' : ''}{foursome.score}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}