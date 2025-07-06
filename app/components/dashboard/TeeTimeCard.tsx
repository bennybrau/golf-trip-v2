import { Card, CardContent } from '../ui';

interface TeeTimeCardProps {
  nextTeeTime: {
    teeTime: string | Date;
    round: string;
  } | null;
}

export function TeeTimeCard({ nextTeeTime }: TeeTimeCardProps) {
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
  );
}