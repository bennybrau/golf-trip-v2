import { Link } from 'react-router';
import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, Button } from '../components/ui';
import { prisma } from '../lib/db';
import type { Route } from './+types/foursomes';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Scaletta Golf - Foursomes" },
    { name: "description", content: "Manage foursomes for each round" },
  ];
}


export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    const foursomes = await prisma.foursome.findMany({
      include: {
        golfer1: true,
        golfer2: true,
        golfer3: true,
        golfer4: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return { user, foursomes };
  } catch (response) {
    throw response;
  }
}


const roundLabels = {
  FRIDAY_MORNING: 'Friday Morning',
  FRIDAY_AFTERNOON: 'Friday Afternoon',
  SATURDAY_MORNING: 'Saturday Morning',
  SATURDAY_AFTERNOON: 'Saturday Afternoon',
};

export default function Foursomes({ loaderData }: Route.ComponentProps) {
  const { user, foursomes } = loaderData;

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
              <Link to="/foursomes/new">
                <Button>
                  Add Foursome
                </Button>
              </Link>
            )}
          </div>
        </div>


        {/* Foursomes List */}
        <div className="grid gap-4">
          {foursomes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">
                  No foursomes found. Create your first foursome to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            foursomes.map((foursome: any) => (
              <Card key={foursome.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {roundLabels[foursome.round as keyof typeof roundLabels]}
                      </h3>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          <strong>Course:</strong> {foursome.course}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Tee Time:</strong> {new Date(foursome.teeTime).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Players:</strong> {[foursome.golfer1?.name, foursome.golfer2?.name, foursome.golfer3?.name, foursome.golfer4?.name].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {/* Edit Button (Admin Only) */}
                      {user.isAdmin && (
                        <Link to={`/foursomes/${foursome.id}/edit`}>
                          <Button 
                            size="sm"
                            variant="secondary"
                          >
                            Edit
                          </Button>
                        </Link>
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