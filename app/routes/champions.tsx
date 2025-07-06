import { useState } from 'react';
import { Link } from 'react-router';
import { Pencil, Trash2 } from 'lucide-react';
import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, Button, Spinner } from '../components/ui';
import { prisma } from '../lib/db';
import { cloudflareImages } from '../lib/cloudflare';
import type { Route } from './+types/champions';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Champions - Scaletta Golf Trip" },
    { name: "description", content: "Past tournament champions" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    
    // Get all champions with golfer information
    const champions = await prisma.champion.findMany({
      include: {
        golfer: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { year: 'desc' },
    });
    
    return { user, champions };
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
  
  if (action === 'delete-champion') {
    const championId = formData.get('championId') as string;
    
    try {
      // Get champion from database
      const champion = await prisma.champion.findUnique({
        where: { id: championId },
      });

      if (!champion) {
        return { error: "Champion not found" };
      }

      // Try to delete from Cloudflare Images if photo exists
      if (champion.cloudflareId) {
        try {
          await cloudflareImages.deleteImage(champion.cloudflareId);
        } catch (cloudflareError) {
          console.warn('Failed to delete from Cloudflare Images:', cloudflareError);
          // Continue with database deletion even if Cloudflare fails
        }
      }
      
      // Delete from database
      await prisma.champion.delete({
        where: { id: championId },
      });
      
      return { success: true, message: 'Champion deleted successfully' };
    } catch (error) {
      console.error('Champion delete error:', error);
      return { error: "Failed to delete champion" };
    }
  }
  
  return { error: "Invalid action" };
}

export default function Champions({ loaderData, actionData }: Route.ComponentProps) {
  const { user, champions = [] } = loaderData;
  const [deletingChampionId, setDeletingChampionId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tournament Champions
              </h1>
              <p className="text-gray-600">
                Past winners of the annual golf tournament
              </p>
            </div>
            
            {/* Add Champion Button (Admin Only) */}
            {user.isAdmin && (
              <Link to="/champions/new">
                <Button>
                  Add Champion
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Champions List */}
        <div className="space-y-6">
          {champions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">
                  No champions recorded yet. Add the first champion to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            champions.map((champion) => (
              <Card key={champion.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Champion Photo */}
                    <div className="flex-shrink-0">
                      {champion.photoUrl ? (
                        <img
                          src={champion.photoUrl}
                          alt={`${champion.displayName || champion.golfer.name} - ${champion.year} Champion`}
                          className="w-48 h-48 object-cover rounded-lg border border-gray-300"
                          onError={(e) => {
                            // Fallback for broken images
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFBob3RvPC90ZXh0Pjwvc3ZnPg==';
                          }}
                        />
                      ) : (
                        <div className="w-48 h-48 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center">
                          <span className="text-gray-400 text-xs text-center">No Photo</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Champion Info */}
                    <div className="flex-grow">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">
                            {champion.year} Champion
                          </h3>
                          <h4 className="text-xl font-semibold text-green-600 mt-1">
                            {champion.displayName || champion.golfer.name}
                          </h4>
                          {champion.golfer.email && (
                            <p className="text-gray-600 mt-1">
                              {champion.golfer.email}
                            </p>
                          )}

                          {/* Q&A Section */}
                          {(champion.motivation || champion.meaning || champion.lifeChange || champion.favoriteQuote) && (
                            <div className="mt-6 space-y-4 border-t pt-4">
                              <h5 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                                Champion Q&A
                              </h5>
                              
                              {champion.motivation && (
                                <div>
                                  <h6 className="text-sm font-medium text-gray-700 mb-1">
                                    What was your motivation?
                                  </h6>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    {champion.motivation}
                                  </p>
                                </div>
                              )}

                              {champion.meaning && (
                                <div>
                                  <h6 className="text-sm font-medium text-gray-700 mb-1">
                                    What does becoming a champion mean to you?
                                  </h6>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    {champion.meaning}
                                  </p>
                                </div>
                              )}

                              {champion.lifeChange && (
                                <div>
                                  <h6 className="text-sm font-medium text-gray-700 mb-1">
                                    How has your life changed since winning?
                                  </h6>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    {champion.lifeChange}
                                  </p>
                                </div>
                              )}

                              {champion.favoriteQuote && (
                                <div>
                                  <h6 className="text-sm font-medium text-gray-700 mb-1">
                                    What is your favorite quote?
                                  </h6>
                                  <blockquote className="text-sm text-gray-600 italic border-l-4 border-green-500 pl-3">
                                    "{champion.favoriteQuote}"
                                  </blockquote>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Edit & Delete Buttons (Admin Only) */}
                        {user.isAdmin && (
                          <div className="flex gap-2">
                            {/* Edit Button */}
                            <Link to={`/champions/${champion.id}/edit`}>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                              >
                                <Pencil size={16} />
                              </Button>
                            </Link>
                            
                            {/* Delete Button */}
                            <form 
                              method="post" 
                              className="inline"
                              onSubmit={(e) => {
                                if (!confirm(`Are you sure you want to delete the ${champion.year} champion record?`)) {
                                  e.preventDefault();
                                  return false;
                                }
                                setDeletingChampionId(champion.id);
                                return true;
                              }}
                            >
                            <input type="hidden" name="_action" value="delete-champion" />
                            <input type="hidden" name="championId" value={champion.id} />
                            <Button
                              type="submit"
                              variant="danger"
                              size="sm"
                              disabled={deletingChampionId === champion.id}
                            >
                              {deletingChampionId === champion.id ? (
                                <div className="flex items-center gap-1">
                                  <Spinner size="sm" />
                                  Deleting...
                                </div>
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </Button>
                          </form>
                          </div>
                        )}
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