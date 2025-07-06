import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent } from '../components/ui';
import { prisma } from '../lib/db';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home - Scaletta Golf Trip" },
    { name: "description", content: "Your premier golf experience" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    
    // Get user with their associated golfer
    const userWithGolfer = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        golfer: {
          include: {
            foursomesAsPlayer1: true,
            foursomesAsPlayer2: true,
            foursomesAsPlayer3: true,
            foursomesAsPlayer4: true,
          }
        }
      }
    });
    
    let totalScore = null;
    
    if (userWithGolfer?.golfer) {
      // Aggregate scores from all foursomes where this golfer participates
      const allFoursomes = [
        ...userWithGolfer.golfer.foursomesAsPlayer1,
        ...userWithGolfer.golfer.foursomesAsPlayer2,
        ...userWithGolfer.golfer.foursomesAsPlayer3,
        ...userWithGolfer.golfer.foursomesAsPlayer4,
      ];
      
      if (allFoursomes.length > 0) {
        totalScore = allFoursomes.reduce((sum, foursome) => sum + foursome.score, 0);
      }
    }
    
    return { user, golfer: userWithGolfer?.golfer || null, totalScore };
  } catch (response) {
    // If authentication fails, the requireAuth function throws a redirect response
    throw response;
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user, golfer, totalScore } = loaderData;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Hello, {golfer ? golfer.name : user.name}!
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Your premier golf experience awaits
          </p>
          
          <div className="grid gap-6 max-w-4xl mx-auto">
            {/* Cabin Card */}
            {golfer && (
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Your Cabin Assignment
                  </h2>
                  <div className="text-center">
                    {golfer.cabin ? (
                      <>
                        <div className="text-6xl font-bold text-blue-600 mb-2">
                          {golfer.cabin}
                        </div>
                        <p className="text-gray-600">
                          You are assigned to Cabin {golfer.cabin}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Playing as: {golfer.name}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-gray-400 mb-2">
                          No Assignment
                        </div>
                        <p className="text-gray-600">
                          You don't have a cabin assignment yet
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Playing as: {golfer.name}
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Score Card */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Your Tournament Score
                </h2>
                <div className="text-center">
                  <div className="text-6xl font-bold text-green-600 mb-2">
                    {totalScore !== null ? totalScore : 'N/A'}
                  </div>
                  <p className="text-gray-600">
                    {!golfer 
                      ? 'No golfer profile associated with your account'
                      : totalScore === null
                      ? 'You haven\'t participated in any foursomes yet'
                      : 'Total score across all foursomes'
                    }
                  </p>
                  {golfer && (
                    <p className="text-sm text-gray-500 mt-2">
                      Playing as: {golfer.name}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
