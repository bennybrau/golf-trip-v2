import { Link } from 'react-router';
import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, Button } from '../components/ui';
import { prisma } from '../lib/db';
import type { Route } from './+types/golfers';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Scaletta Golf - Golfers" },
    { name: "description", content: "Manage golfers in your system" },
  ];
}


export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    const golfers = await prisma.golfer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { user, golfers };
  } catch (response) {
    throw response;
  }
}


export default function Golfers({ loaderData }: Route.ComponentProps) {
  const { user, golfers } = loaderData;

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
              <Link to="/golfers/new">
                <Button>
                  Add Golfer
                </Button>
              </Link>
            )}
          </div>
        </div>


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
                      </div>
                    </div>
                    
                    {/* Edit Button (Admin Only) */}
                    {user.isAdmin && (
                      <Link to={`/golfers/${golfer.id}/edit`}>
                        <Button 
                          size="sm"
                          variant="secondary"
                        >
                          Edit
                        </Button>
                      </Link>
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