import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent } from '../components/ui';
import { ScoreCard, CabinCard, LeaderCard, TeeTimeCard, WeatherCard, WeekendMenuCard } from '../components/dashboard';
import { InstallPromptSimple } from '../components/InstallPromptSimple';
import { prisma } from '../lib/db';
import { getWeatherForPlymouth } from '../lib/weather';
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
    
    // Get year parameter from URL
    const url = new URL(request.url);
    const year = url.searchParams.get('year') || '2024';
    const selectedYear = parseInt(year);
    
    // Get user with their associated golfer
    const userWithGolfer = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        golfer: {
          include: {
            foursomesAsPlayer1: { 
              where: { year: selectedYear },
              orderBy: { teeTime: 'asc' } 
            },
            foursomesAsPlayer2: { 
              where: { year: selectedYear },
              orderBy: { teeTime: 'asc' } 
            },
            foursomesAsPlayer3: { 
              where: { year: selectedYear },
              orderBy: { teeTime: 'asc' } 
            },
            foursomesAsPlayer4: { 
              where: { year: selectedYear },
              orderBy: { teeTime: 'asc' } 
            },
          }
        }
      }
    });
    
    let totalScore = null;
    let nextTeeTime = null;
    
    // Fetch weather data for Plymouth, IN
    const weather = await getWeatherForPlymouth();
    
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
      leaderScore,
      weather,
      selectedYear
    };
  } catch (response) {
    // If authentication fails, the requireAuth function throws a redirect response
    throw response;
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user, golfer, totalScore, nextTeeTime, tournamentLeader, leaderScore, weather } = loaderData;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <InstallPromptSimple />
        
        <div className="mb-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {golfer ? golfer.name : user.name}!
            </h1>
            <p className="text-gray-600">
              Here's your golf trip dashboard
            </p>
          </div>
          <div className="w-full lg:w-80 flex-shrink-0">
            <WeatherCard weather={weather} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <ScoreCard totalScore={totalScore} golfer={golfer} />
          <CabinCard golfer={golfer} />
          <LeaderCard tournamentLeader={tournamentLeader} leaderScore={leaderScore} />
          <TeeTimeCard nextTeeTime={nextTeeTime} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <WeekendMenuCard />
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
