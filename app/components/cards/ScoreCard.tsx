import { useFetcher } from 'react-router';
import { UserCheck, UserX } from 'lucide-react';
import { Card, CardContent, Button, Badge, Select } from '../ui';
import { ScoreValue } from '../dashboard';
import { cn } from '../../lib/cn';

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
  user: { isAdmin: boolean };
  selectedYear: number;
  /** Distinct rounds scheduled this season; used to flag partial participation. */
  roundsScheduled: number;
  /** 1-based leaderboard position, or null when this golfer has no score. */
  rank: number | null;
}

export function ScoreCard({ golfer, user, selectedYear, roundsScheduled, rank }: ScoreCardProps) {
  // Fetchers replace a `deletingId`/`setDeletingId` pair that the route had to
  // own and thread down as props, and fix a real bug: the cabin select called
  // `e.target.form.submit()`, which does NOT fire the submit event, so the
  // onSubmit handler never ran and the disabled state was dead code.
  const cabinFetcher = useFetcher();
  const statusFetcher = useFetcher();

  const isActive = golfer.isActive;
  const playedShortSeason =
    golfer.totalScore !== null && roundsScheduled > 0 && golfer.roundsPlayed < roundsScheduled;

  return (
    <Card className={cn(!isActive && 'opacity-70 border-dashed')}>
      <CardContent className="py-4">
        {/* Stacks below sm: at 390px the old three-column row put the name,
            score and admin toggle in contention for ~340px. */}
        <div className="flex items-start gap-3">
          {/* Rank */}
          <div className="w-8 shrink-0 pt-0.5 text-center">
            {rank !== null ? (
              <span
                className={cn(
                  'text-sm font-bold tabular-nums',
                  rank === 1 ? 'text-amber-600' : 'text-gray-400'
                )}
              >
                {rank === 1 ? '🏆' : rank}
              </span>
            ) : (
              <span className="text-sm text-gray-300">–</span>
            )}
          </div>

          {/* Identity */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900 truncate">{golfer.name}</h3>
              {!isActive && <Badge tone="neutral">Inactive {selectedYear}</Badge>}
            </div>

            <p className="mt-1 text-sm text-gray-600">
              {golfer.cabin ? `Cabin ${golfer.cabin}` : 'No cabin assigned'}
            </p>

            {user.isAdmin && (
              <cabinFetcher.Form method="post" className="mt-2 max-w-40">
                <input type="hidden" name="_action" value="update-golfer-cabin" />
                <input type="hidden" name="golferId" value={golfer.id} />
                <input type="hidden" name="year" value={selectedYear.toString()} />
                <Select
                  name="cabin"
                  defaultValue={golfer.cabin?.toString() ?? ''}
                  aria-label={`Cabin for ${golfer.name}`}
                  disabled={cabinFetcher.state !== 'idle'}
                  // requestSubmit fires the submit event, unlike submit().
                  onChange={(event) => event.currentTarget.form?.requestSubmit()}
                  className="text-sm"
                >
                  <option value="">No cabin</option>
                  <option value="1">Cabin 1</option>
                  <option value="2">Cabin 2</option>
                  <option value="3">Cabin 3</option>
                  <option value="4">Cabin 4</option>
                </Select>
              </cabinFetcher.Form>
            )}
          </div>

          {/* Score */}
          <div className="shrink-0 text-right">
            <div className="text-2xl font-bold tabular-nums">
              <ScoreValue score={golfer.totalScore} />
            </div>
            <p className="mt-0.5 text-xs text-gray-500 whitespace-nowrap">
              {golfer.totalScore !== null
                ? `${golfer.roundsPlayed} of ${roundsScheduled}`
                : 'No rounds'}
            </p>
            {playedShortSeason && (
              // Totals are a plain sum, so playing fewer rounds lowers a score
              // without playing better. Surface it rather than silently ranking.
              <div className="mt-1.5 flex justify-end">
                <Badge
                  tone="warning"
                  title={`Played ${golfer.roundsPlayed} of ${roundsScheduled} rounds, so this total covers fewer rounds than a full season.`}
                >
                  Partial
                </Badge>
              </div>
            )}
          </div>

          {/* Admin status toggle */}
          {user.isAdmin && (
            <statusFetcher.Form method="post" className="shrink-0">
              <input type="hidden" name="_action" value="toggle-golfer-status" />
              <input type="hidden" name="golferId" value={golfer.id} />
              <input type="hidden" name="year" value={selectedYear.toString()} />
              <input type="hidden" name="currentStatus" value={isActive.toString()} />
              <Button
                type="submit"
                variant={isActive ? 'secondary' : 'primary'}
                size="icon"
                loading={statusFetcher.state !== 'idle'}
                aria-label={
                  isActive
                    ? `Mark ${golfer.name} inactive for ${selectedYear}`
                    : `Mark ${golfer.name} active for ${selectedYear}`
                }
                title={isActive ? 'Mark inactive' : 'Mark active'}
              >
                {statusFetcher.state === 'idle' &&
                  (isActive ? <UserX size={16} /> : <UserCheck size={16} />)}
              </Button>
            </statusFetcher.Form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
