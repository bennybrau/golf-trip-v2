import { Link } from 'react-router';
import { Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, Button, Spinner } from '../ui';

interface UserCardProps {
  userItem: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    isAdmin: boolean;
    createdAt: string;
    golfer?: {
      name: string;
      cabin?: number | null;
    } | null;
  };
  currentUser: {
    id: string;
  };
  deletingUserId: string | null;
  setDeletingUserId: (id: string | null) => void;
}

export function UserCard({ 
  userItem, 
  currentUser, 
  deletingUserId, 
  setDeletingUserId 
}: UserCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {userItem.name}
              </h3>
              {userItem.isAdmin && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Admin
                </span>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                <strong>Email:</strong> {userItem.email}
              </p>
              {userItem.phone && (
                <p className="text-sm text-gray-600">
                  <strong>Phone:</strong> {userItem.phone}
                </p>
              )}
              <p className="text-sm text-gray-600">
                <strong>Joined:</strong> {new Date(userItem.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-4">
            <Link to={`/users/${userItem.id}/edit`}>
              <Button size="sm" variant="secondary">
                <Pencil size={16} />
              </Button>
            </Link>
            
            {/* Delete Button (Admin Only, not for current user) */}
            {userItem.id !== currentUser.id && (
              <form 
                method="post" 
                className="inline"
                onSubmit={(e) => {
                  if (!confirm(`Are you sure you want to delete ${userItem.name}? This action cannot be undone.`)) {
                    e.preventDefault();
                    return false;
                  }
                  setDeletingUserId(userItem.id);
                  return true;
                }}
              >
                <input type="hidden" name="_action" value="delete-user" />
                <input type="hidden" name="userId" value={userItem.id} />
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={deletingUserId === userItem.id}
                >
                  {deletingUserId === userItem.id ? (
                    <div className="flex items-center gap-1">
                      <Spinner size="sm" />
                      Deleting...
                    </div>
                  ) : (
                    <Trash2 size={16} />
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
        
        {/* Golfer Association Status */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Golfer Association</h4>
            {userItem.golfer ? (
              <p className="text-sm text-green-600">
                ✓ Associated with golfer: {userItem.golfer.name}
                {userItem.golfer.cabin && ` (Cabin ${userItem.golfer.cabin})`}
              </p>
            ) : (
              <p className="text-sm text-orange-600">
                ⚠ No associated golfer found
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}