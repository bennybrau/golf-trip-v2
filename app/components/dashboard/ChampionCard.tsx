import { Link } from 'react-router';
import { Card, CardContent } from '../ui';

interface ChampionCardProps {
  champion: {
    golfer: { name: string };
    displayName?: string | null;
    photoUrl?: string | null;
    year: number;
  } | null;
}

/** Reigning champion banner, linking through to the champions archive. */
export function ChampionCard({ champion }: ChampionCardProps) {
  const championName = champion?.displayName || champion?.golfer?.name;

  return (
    <Link to="/champions" className="block">
      <Card variant="accent" interactive className="bg-brand-50 border-brand-200">
        <CardContent className="py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-full border-2 border-brand-300 bg-brand-100 flex items-center justify-center">
              {champion?.photoUrl ? (
                <img
                  src={champion.photoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl" aria-hidden="true">🏌️</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
                {champion ? `${champion.year} Champion` : 'Champion'}
              </p>
              <p className="mt-0.5 text-lg font-bold text-gray-900 truncate">
                {championName ?? 'Not yet crowned'}
              </p>
              <p className="text-sm text-brand-800">
                {champion ? 'View the champions archive →' : 'The title is still up for grabs'}
              </p>
            </div>

            <span className="text-3xl shrink-0 hidden sm:block" aria-hidden="true">👑</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
