import { Card, CardContent } from '../ui';

interface ScoreCardProps {
  totalScore: number | null;
  golfer: {
    name: string;
  } | null;
}

export function ScoreCard({ totalScore, golfer }: ScoreCardProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-600 mb-1">
              Your Score
            </h3>
            <div className="text-3xl font-bold">
              {totalScore !== null ? (
                <span className={totalScore < 0 ? 'text-blue-600' : 'text-black'}>
                  {totalScore > 0 ? '+' : ''}{totalScore}
                </span>
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
  );
}