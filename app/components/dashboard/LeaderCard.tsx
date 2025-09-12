import { Card, CardContent } from '../ui';

interface LeaderCardProps {
  tournamentLeader: {
    name: string;
  } | null;
  leaderScore: number | null;
}

export function LeaderCard({ tournamentLeader, leaderScore }: LeaderCardProps) {
  return (
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
            <p className="text-xs mt-1">
              {leaderScore !== null ? (
                <span className={leaderScore < 0 ? 'text-blue-600' : 'text-black'}>
                  {leaderScore > 0 ? '+' : ''}{leaderScore} strokes
                </span>
              ) : (
                <span className="text-yellow-700">No scores yet</span>
              )}
            </p>
          </div>
          <div className="text-yellow-400 text-3xl">🏆</div>
        </div>
      </CardContent>
    </Card>
  );
}