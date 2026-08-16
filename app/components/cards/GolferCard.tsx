import { Link } from 'react-router';
import { Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, Button, Badge, ConfirmButton, Avatar } from '../ui';

interface GolferCardProps {
  golfer: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    onRoster?: boolean;
    isActiveThisYear?: boolean;
  };
  user: { isAdmin: boolean };
  selectedYear: number;
  getUrlWithCurrentParams: (path: string) => string;
}

export function GolferCard({ golfer, user, selectedYear, getUrlWithCurrentParams }: GolferCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="py-4 h-full flex flex-col">
        <div className="flex items-start gap-3">
          <Avatar name={golfer.name} alt="" size="md" />
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-gray-900 truncate">{golfer.name}</h3>
            {/* break-all so long addresses wrap instead of forcing the card wide. */}
            {golfer.email && (
              <p className="mt-0.5 text-sm text-gray-600 break-all">{golfer.email}</p>
            )}
            {golfer.phone && <p className="text-sm text-gray-600">{golfer.phone}</p>}
          </div>
        </div>

        {/* Season membership: the signal that tells an admin whether a rollover
            missed this person. */}
        <div className="mt-3">
          {golfer.onRoster ? (
            golfer.isActiveThisYear ? (
              <Badge tone="brand">On {selectedYear} roster</Badge>
            ) : (
              <Badge tone="neutral">Inactive for {selectedYear}</Badge>
            )
          ) : (
            <Badge tone="warning">Not on {selectedYear} roster</Badge>
          )}
        </div>

        {user.isAdmin && (
          <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 mt-3">
            <Link to={getUrlWithCurrentParams(`/golfers/${golfer.id}/edit`)}>
              <Button variant="secondary" size="icon" aria-label={`Edit ${golfer.name}`}>
                <Pencil size={16} />
              </Button>
            </Link>
            <ConfirmButton
              fields={{ _action: 'delete-golfer', golferId: golfer.id }}
              confirmTitle={`Delete ${golfer.name}?`}
              confirmMessage="Only possible if they have no foursomes or championships."
              aria-label={`Delete ${golfer.name}`}
            >
              <Trash2 size={16} />
            </ConfirmButton>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
