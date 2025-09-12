import { Link } from 'react-router';
import { Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, Button, Spinner } from '../ui';

interface FoursomeCardProps {
  foursome: {
    id: string;
    teeTime: string;
    course: string;
    round: string;
    score: number;
    golfer1?: { name: string } | null;
    golfer2?: { name: string } | null;
    golfer3?: { name: string } | null;
    golfer4?: { name: string } | null;
  };
  user: {
    isAdmin: boolean;
  };
  deletingFoursomeId: string | null;
  setDeletingFoursomeId: (id: string | null) => void;
  getUrlWithCurrentParams: (path: string) => string;
  roundLabels: Record<string, string>;
}

const getCourseBadgeClasses = (course: string) => {
  const courseLower = course.toLowerCase();
  if (courseLower === 'black') {
    return 'bg-black text-white';
  } else if (courseLower === 'silver') {
    return 'bg-gray-400 text-black';
  }
  return 'bg-blue-500 text-white'; // Default for other courses
};

const formatTeeTime = (teeTime: string) => {
  const date = new Date(teeTime);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = dayNames[date.getDay()];
  const time = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
  return `${day} ${time}`;
};

export function FoursomeCard({ 
  foursome, 
  user, 
  deletingFoursomeId, 
  setDeletingFoursomeId, 
  getUrlWithCurrentParams,
  roundLabels
}: FoursomeCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {formatTeeTime(foursome.teeTime)}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCourseBadgeClasses(foursome.course)}`}>
                {foursome.course}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                <strong>Round:</strong> {roundLabels[foursome.round as keyof typeof roundLabels]}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Players:</strong> {[foursome.golfer1?.name, foursome.golfer2?.name, foursome.golfer3?.name, foursome.golfer4?.name].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* Edit & Delete Buttons (Admin Only) */}
            {user.isAdmin && (
              <div className="flex gap-2">
                {/* Edit Button */}
                <Link to={getUrlWithCurrentParams(`/foursomes/${foursome.id}/edit`)}>
                  <Button 
                    size="sm"
                    variant="secondary"
                  >
                    <Pencil size={16} />
                  </Button>
                </Link>
                
                {/* Delete Button */}
                <form 
                  method="post" 
                  className="inline"
                  onSubmit={(e) => {
                    const roundName = roundLabels[foursome.round as keyof typeof roundLabels];
                    if (!confirm(`Are you sure you want to delete the ${roundName} foursome? This action cannot be undone.`)) {
                      e.preventDefault();
                      return false;
                    }
                    setDeletingFoursomeId(foursome.id);
                    return true;
                  }}
                >
                  <input type="hidden" name="_action" value="delete-foursome" />
                  <input type="hidden" name="foursomeId" value={foursome.id} />
                  <Button
                    type="submit"
                    variant="danger"
                    size="sm"
                    disabled={deletingFoursomeId === foursome.id}
                  >
                    {deletingFoursomeId === foursome.id ? (
                      <div className="flex items-center gap-1">
                        <Spinner size="sm" />
                        Deleting...
                      </div>
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </Button>
                </form>
              </div>
            )}
            <div className="text-2xl font-bold">
              <span className={foursome.score < 0 ? 'text-blue-600' : 'text-black'}>
                {foursome.score > 0 ? '+' : ''}{foursome.score}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}