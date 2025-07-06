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
            foursomesAsPlayer1: { orderBy: { teeTime: 'asc' } },
            foursomesAsPlayer2: { orderBy: { teeTime: 'asc' } },
            foursomesAsPlayer3: { orderBy: { teeTime: 'asc' } },
            foursomesAsPlayer4: { orderBy: { teeTime: 'asc' } },
          }
        }
      }
    });
    
    let totalScore = null;
    let nextTeeTime = null;
    
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
        
        // Find next tee time (first future tee time)
        const now = new Date();
        const futureFoursomes = allFoursomes.filter(f => new Date(f.teeTime) > now);
        if (futureFoursomes.length > 0) {
          futureFoursomes.sort((a, b) => new Date(a.teeTime).getTime() - new Date(b.teeTime).getTime());
          nextTeeTime = futureFoursomes[0];
        }
      }
    }
    
    // Get tournament leader (golfer with lowest total score)
    const allGolfers = await prisma.golfer.findMany({
      include: {
        foursomesAsPlayer1: true,
        foursomesAsPlayer2: true,
        foursomesAsPlayer3: true,
        foursomesAsPlayer4: true,
      }
    });
    
    let tournamentLeader = null;
    let leaderScore = null;
    
    for (const golfer of allGolfers) {
      const golferFoursomes = [
        ...golfer.foursomesAsPlayer1,
        ...golfer.foursomesAsPlayer2,
        ...golfer.foursomesAsPlayer3,
        ...golfer.foursomesAsPlayer4,
      ];
      
      if (golferFoursomes.length > 0) {
        const golferScore = golferFoursomes.reduce((sum, foursome) => sum + foursome.score, 0);
        
        if (leaderScore === null || golferScore < leaderScore) {
          leaderScore = golferScore;
          tournamentLeader = golfer;
        }
      }
    }
    
    return { 
      user, 
      golfer: userWithGolfer?.golfer || null, 
      totalScore, 
      nextTeeTime,
      tournamentLeader,
      leaderScore
    };
  } catch (response) {
    // If authentication fails, the requireAuth function throws a redirect response
    throw response;
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user, golfer, totalScore, nextTeeTime, tournamentLeader, leaderScore } = loaderData;

  const formatTeeTime = (teeTime: string | Date) => {
    const date = typeof teeTime === 'string' ? new Date(teeTime) : teeTime;
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };
  };

  const getRoundLabel = (round: string) => {
    const labels = {
      'FRIDAY_MORNING': 'Friday Morning',
      'FRIDAY_AFTERNOON': 'Friday Afternoon',
      'SATURDAY_MORNING': 'Saturday Morning',
      'SATURDAY_AFTERNOON': 'Saturday Afternoon'
    };
    return labels[round as keyof typeof labels] || round;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {golfer ? golfer.name : user.name}!
          </h1>
          <p className="text-gray-600">
            Here's your golf trip dashboard
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Your Score Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-blue-600 mb-1">
                    Your Score
                  </h3>
                  <div className="text-3xl font-bold text-blue-900">
                    {totalScore !== null ? (
                      <span>{totalScore > 0 ? '+' : ''}{totalScore}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    {!golfer 
                      ? 'No golfer profile'
                      : totalScore === null
                      ? 'No rounds played'
                      : 'Total tournament score'
                    }
                  </p>
                </div>
                <div className="text-blue-400 text-3xl">🏌️</div>
              </div>
            </CardContent>
          </Card>

          {/* Cabin Assignment Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-green-600 mb-1">
                    Your Cabin
                  </h3>
                  <div className="text-3xl font-bold text-green-900">
                    {golfer?.cabin || '-'}
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    {golfer?.cabin ? `Cabin ${golfer.cabin}` : 'No assignment'}
                  </p>
                </div>
                <div className="text-green-400 text-3xl">🏠</div>
              </div>
            </CardContent>
          </Card>

          {/* Tournament Leader Card */}
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-yellow-600 mb-1">
                    Tournament Leader
                  </h3>
                  <div className="text-lg font-bold text-yellow-900 truncate">
                    {tournamentLeader?.name || 'TBD'}
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    {leaderScore !== null ? (
                      <span>{leaderScore > 0 ? '+' : ''}{leaderScore} strokes</span>
                    ) : (
                      'No scores yet'
                    )}
                  </p>
                </div>
                <div className="text-yellow-400 text-3xl">🏆</div>
              </div>
            </CardContent>
          </Card>

          {/* Next Tee Time Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-purple-600 mb-1">
                    Next Tee Time
                  </h3>
                  {nextTeeTime ? (
                    <>
                      <div className="text-lg font-bold text-purple-900">
                        {formatTeeTime(nextTeeTime.teeTime).time}
                      </div>
                      <p className="text-xs text-purple-700 mt-1">
                        {formatTeeTime(nextTeeTime.teeTime).date}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        {getRoundLabel(nextTeeTime.round)}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-bold text-gray-400">
                        None scheduled
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        No upcoming rounds
                      </p>
                    </>
                  )}
                </div>
                <div className="text-purple-400 text-3xl">⏰</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info Section */}
        {golfer && (
          <div className="mt-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Playing as: {golfer.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {golfer.email && `Email: ${golfer.email}`}
                      {golfer.phone && ` • Phone: ${golfer.phone}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Good luck on the course!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
