import { useState } from 'react';
import { UserCheck, UserX, Home } from 'lucide-react';
import { Card, CardContent, Button, Spinner } from '../ui';

interface ScoreCardProps {
  golfer: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    cabin?: number | null;
    totalScore: number | null;
    roundsPlayed: number;
    isActive: boolean;
  };
  user: {
    isAdmin: boolean;
  };
  selectedYear: number;
}

export function ScoreCard({ 
  golfer, 
  user, 
  selectedYear
}: ScoreCardProps) {
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [updatingCabin, setUpdatingCabin] = useState(false);
  
  const isActive = golfer.isActive;
  
  return (
    <Card className={!isActive ? "opacity-60 border-dashed" : ""}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {golfer.name}
              {!isActive && (
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                  Inactive {selectedYear}
                </span>
              )}
            </h3>
            <div className="mt-2 space-y-1">
              {golfer.email && (
                <p className="text-sm text-gray-600">
                  Email: {golfer.email}
                </p>
              )}
              {golfer.phone && (
                <p className="text-sm text-gray-600">
                  Phone: {golfer.phone}
                </p>
              )}
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">
                  <strong>Cabin:</strong> {golfer.cabin || 'Not assigned'}
                </p>
                {user.isAdmin && (
                  <form 
                    method="post" 
                    className="inline"
                    onSubmit={(e) => {
                      setUpdatingCabin(true);
                    }}
                  >
                    <input type="hidden" name="_action" value="update-golfer-cabin" />
                    <input type="hidden" name="golferId" value={golfer.id} />
                    <input type="hidden" name="year" value={selectedYear.toString()} />
                    <select 
                      name="cabin"
                      defaultValue={golfer.cabin?.toString() || ''}
                      onChange={(e) => e.target.form?.submit()}
                      disabled={updatingCabin}
                      className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="">No cabin</option>
                      <option value="1">Cabin 1</option>
                      <option value="2">Cabin 2</option>
                      <option value="3">Cabin 3</option>
                      <option value="4">Cabin 4</option>
                    </select>
                  </form>
                )}
              </div>
            </div>
          </div>
          
          {/* Tournament Score Section */}
          <div className="text-right">
            <div className="text-2xl font-bold">
              {golfer.totalScore !== null ? (
                <span className={golfer.totalScore < 0 ? 'text-blue-600' : 'text-black'}>
                  {golfer.totalScore > 0 ? '+' : ''}{golfer.totalScore}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {golfer.totalScore !== null 
                ? `${golfer.roundsPlayed} round${golfer.roundsPlayed !== 1 ? 's' : ''} played`
                : 'No rounds played'
              }
            </p>
          </div>

          {/* Status Toggle Button (Admin Only) */}
          {user.isAdmin && (
            <div className="ml-4">
              <form 
                method="post" 
                className="inline"
                onSubmit={(e) => {
                  setTogglingStatus(true);
                  // Form will submit normally
                }}
              >
                <input type="hidden" name="_action" value="toggle-golfer-status" />
                <input type="hidden" name="golferId" value={golfer.id} />
                <input type="hidden" name="year" value={selectedYear.toString()} />
                <input type="hidden" name="currentStatus" value={isActive.toString()} />
                <Button
                  type="submit"
                  variant={isActive ? "secondary" : "secondary"}
                  size="sm"
                  disabled={togglingStatus}
                  title={isActive ? `Deactivate for ${selectedYear}` : `Activate for ${selectedYear}`}
                >
                  {togglingStatus ? (
                    <div className="flex items-center gap-1">
                      <Spinner size="sm" />
                    </div>
                  ) : isActive ? (
                    <UserCheck size={16} />
                  ) : (
                    <UserX size={16} />
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}