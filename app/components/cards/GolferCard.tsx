import { useState } from 'react';
import { Link } from 'react-router';
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, Button, Spinner } from '../ui';

interface GolferCardProps {
  golfer: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  user: {
    isAdmin: boolean;
  };
  deletingGolferId: string | null;
  setDeletingGolferId: (id: string | null) => void;
  getUrlWithCurrentParams: (path: string) => string;
}

export function GolferCard({ 
  golfer, 
  user, 
  deletingGolferId, 
  setDeletingGolferId, 
  getUrlWithCurrentParams
}: GolferCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {golfer.name}
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
            </div>
          </div>
          
          {/* Action Buttons (Admin Only) */}
          {user.isAdmin && (
            <div className="flex gap-2">              
              {/* Edit Button */}
              <Link to={getUrlWithCurrentParams(`/golfers/${golfer.id}/edit`)}>
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
                  if (!confirm(`Are you sure you want to delete ${golfer.name}? This action cannot be undone.`)) {
                    e.preventDefault();
                    return false;
                  }
                  setDeletingGolferId(golfer.id);
                  return true;
                }}
              >
                <input type="hidden" name="_action" value="delete-golfer" />
                <input type="hidden" name="golferId" value={golfer.id} />
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={deletingGolferId === golfer.id}
                >
                  {deletingGolferId === golfer.id ? (
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
        </div>
      </CardContent>
    </Card>
  );
}