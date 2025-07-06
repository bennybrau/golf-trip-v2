import { Card, CardContent } from '../ui';

interface CabinCardProps {
  golfer: {
    cabin: number | null;
  } | null;
}

export function CabinCard({ golfer }: CabinCardProps) {
  return (
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
  );
}