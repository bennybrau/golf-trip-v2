import { Link } from 'react-router';
import { Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, Button, Badge, ConfirmButton } from '../ui';
import { ScoreValue } from '../dashboard';
import { formatTeeTimeDisplay } from '../../lib/timeUtils';
import { COURSE_LABELS, ROUND_LABELS } from '../../lib/course';

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
  user: { isAdmin: boolean };
  getUrlWithCurrentParams: (path: string) => string;
}

export function FoursomeCard({ foursome, user, getUrlWithCurrentParams }: FoursomeCardProps) {
  // The four denormalized player columns; nulls are legal (a group can be short).
  const players = [foursome.golfer1, foursome.golfer2, foursome.golfer3, foursome.golfer4]
    .filter((g): g is { name: string } => Boolean(g))
    .map((g) => g.name);

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">
                {ROUND_LABELS[foursome.round as keyof typeof ROUND_LABELS] ?? foursome.round}
              </h3>
              <Badge tone={foursome.course === 'BLACK' ? 'dark' : 'silver'}>
                {COURSE_LABELS[foursome.course as keyof typeof COURSE_LABELS] ?? foursome.course}
              </Badge>
            </div>

            <p className="mt-0.5 text-sm text-gray-600">{formatTeeTimeDisplay(foursome.teeTime)}</p>

            {/* One name per line rather than a comma-joined paragraph, which
                wrapped to 3-4 ragged lines on a phone. */}
            {players.length > 0 ? (
              <ul className="mt-2 space-y-0.5">
                {players.map((name) => (
                  <li key={name} className="text-sm text-gray-700 truncate">
                    {name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-400 italic">No players assigned</p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <div className="text-2xl font-bold tabular-nums">
              <ScoreValue score={foursome.score} />
            </div>
            <p className="mt-0.5 text-xs text-gray-500">team score</p>
          </div>
        </div>

        {user.isAdmin && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
            <Link to={getUrlWithCurrentParams(`/foursomes/${foursome.id}/edit`)}>
              <Button variant="secondary" size="icon" aria-label="Edit foursome">
                <Pencil size={16} />
              </Button>
            </Link>
            <ConfirmButton
              fields={{ _action: 'delete-foursome', foursomeId: foursome.id }}
              confirmTitle="Delete this foursome?"
              confirmMessage="The round and its score will be removed."
              aria-label="Delete foursome"
            >
              <Trash2 size={16} />
            </ConfirmButton>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
