import { Link } from 'react-router';
import { Card, CardContent } from '../ui';

interface ChampionCardProps {
  champion: {
    golfer: {
      name: string;
    };
    displayName?: string | null;
    photoUrl?: string | null;
    year: number;
  } | null;
}

export function ChampionCard({ champion }: ChampionCardProps) {
  const championName = champion?.displayName || champion?.golfer?.name;
  
  return (
    <Link to="/champions" className="block">
      <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-emerald-200 col-span-full hover:from-green-100 hover:to-emerald-200 transition-colors cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-emerald-300 flex items-center justify-center bg-emerald-200">
                {champion?.photoUrl ? (
                  <img
                    src={champion.photoUrl}
                    alt={`${championName} photo`}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-emerald-600 text-2xl">🏌️</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-800 mb-1">
                  🏆 {champion?.year || new Date().getFullYear()} Champion
                </h3>
                <div className="text-xl font-bold text-emerald-900">
                  {championName || 'TBD'}
                </div>
                <p className="text-emerald-700 mt-1">
                  Congrats to this year's champion. See you all next year!
                </p>
              </div>
            </div>
            <div className="text-emerald-400 text-4xl">👑</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}