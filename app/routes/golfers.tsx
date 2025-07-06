import { useState } from 'react';
import { Link } from 'react-router';
import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, Button, Spinner } from '../components/ui';
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
    
    // Get sort parameter from URL
    const url = new URL(request.url);
    const sort = url.searchParams.get('sort') || 'createdAt';
    const order = url.searchParams.get('order') || 'desc';
    
    // Define valid sort options
    const validSorts = ['name', 'createdAt'];
    const validOrders = ['asc', 'desc'];
    
    const sortBy = validSorts.includes(sort) ? sort : 'createdAt';
    const sortOrder = validOrders.includes(order) ? order : 'desc';
    
    const golfers = await prisma.golfer.findMany({
      orderBy: { [sortBy]: sortOrder }
    });
    
    return { user, golfers, currentSort: sortBy, currentOrder: sortOrder };
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
  const { user, golfers, currentSort, currentOrder } = loaderData;
  const [deletingGolferId, setDeletingGolferId] = useState<string | null>(null);
  
  const getSortUrl = (sortBy: string) => {
    const newOrder = currentSort === sortBy && currentOrder === 'asc' ? 'desc' : 'asc';
    return `/golfers?sort=${sortBy}&order=${newOrder}`;
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
    if (currentSort !== 'createdAt') params.set('sort', currentSort);
    if (currentOrder !== 'desc') params.set('order', currentOrder);
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
          
          {/* Sort Controls */}
          {golfers.length > 0 && (
            <div className="mt-4 flex gap-2 items-center">
              <span className="text-sm text-gray-600">Sort by:</span>
              <Link 
                to={getSortUrl('name')}
                className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50 flex items-center gap-1"
              >
                Name {getSortIcon('name')}
              </Link>
              <Link 
                to={getSortUrl('createdAt')}
                className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50 flex items-center gap-1"
              >
                Date Added {getSortIcon('createdAt')}
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
              <Card key={golfer.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {golfer.name}
                      </h3>
                      <div className="mt-2 space-y-1">
                        {golfer.email && (
                          <p className="text-sm text-gray-600">
                            Email: {golfer.email}
                          </p>
                        )}
                        {golfer.phone && (
                          <p className="text-sm text-gray-600">
                            Phone: {golfer.phone}
                          </p>
                        )}
                        {golfer.cabin && (
                          <p className="text-sm text-gray-600">
                            <strong>Cabin:</strong> {golfer.cabin}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Edit & Delete Buttons (Admin Only) */}
                    {user.isAdmin && (
                      <div className="flex gap-2">
                        {/* Edit Button */}
                        <Link to={getUrlWithCurrentParams(`/golfers/${golfer.id}/edit`)}>
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
                            if (!confirm(`Are you sure you want to delete ${golfer.name}? This action cannot be undone.`)) {
                              e.preventDefault();
                              return false;
                            }
                            setDeletingGolferId(golfer.id);
                            return true;
                          }}
                        >
                          <input type="hidden" name="_action" value="delete-golfer" />
                          <input type="hidden" name="golferId" value={golfer.id} />
                          <Button
                            type="submit"
                            variant="danger"
                            size="sm"
                            disabled={deletingGolferId === golfer.id}
                          >
                            {deletingGolferId === golfer.id ? (
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