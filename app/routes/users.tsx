import { useState } from 'react';
import { Link } from 'react-router';
import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, Button, Spinner } from '../components/ui';
import { prisma } from '../lib/db';

export function meta() {
  return [
    { title: "Users - Scaletta Golf Trip" },
    { name: "description", content: "Manage users in your system" },
  ];
}

export async function loader({ request }: { request: Request }) {
  try {
    const user = await requireAuth(request);
    
    if (!user.isAdmin) {
      throw new Response("Unauthorized", { status: 403 });
    }
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isAdmin: true,
        createdAt: true,
        golfer: {
          select: {
            id: true,
            name: true,
            cabin: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const golfers = await prisma.golfer.findMany();
    
    return { user, users, golfers };
  } catch (response) {
    throw response;
  }
}

export async function action({ request }: { request: Request }) {
  const user = await requireAuth(request);
  
  if (!user.isAdmin) {
    throw new Response("Unauthorized", { status: 403 });
  }
  
  const formData = await request.formData();
  const action = formData.get('_action') as string;
  
  if (action === 'delete-user') {
    const userId = formData.get('userId') as string;
    
    try {
      // Check if user exists
      const userToDelete = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          champions: true,
          photos: true,
          sessions: true,
        },
      });

      if (!userToDelete) {
        return { error: "User not found" };
      }

      // Prevent deleting the current admin user
      if (userToDelete.id === user.id) {
        return { error: "Cannot delete your own account" };
      }

      // Check if user has associated records
      const hasRecords = userToDelete.champions.length > 0 || userToDelete.photos.length > 0;
      
      if (hasRecords) {
        return { error: "Cannot delete user. They have associated champions or photos." };
      }
      
      // Delete the user (sessions will be deleted automatically due to cascade)
      await prisma.user.delete({
        where: { id: userId },
      });
      
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('User delete error:', error);
      return { error: "Failed to delete user" };
    }
  }
  
  return { error: "Invalid action" };
}

export default function Users({ loaderData, actionData }: { loaderData: any, actionData?: any }) {
  const { user, users } = loaderData;
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Users
              </h1>
              <p className="text-gray-600">
                Manage user accounts and their golfer associations
              </p>
            </div>
          </div>
        </div>

        {/* Action Messages */}
        {actionData?.error && (
          <div className="mb-6 text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
            {actionData.error}
          </div>
        )}
        
        {actionData?.success && (
          <div className="mb-6 text-green-600 text-sm bg-green-50 border border-green-200 rounded-md p-3">
            {actionData.message}
          </div>
        )}

        {/* Users List */}
        <div className="grid gap-4">
          {users.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">
                  No users found.
                </p>
              </CardContent>
            </Card>
          ) : (
            users.map((userItem: any) => (
              <Card key={userItem.id}>
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
                      
                      {/* Delete Button (Admin Only, not for current user) */}
                      {userItem.id !== user.id && (
                        <form 
                          method="post" 
                          className="inline ml-4"
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
                              'Delete'
                            )}
                          </Button>
                        </form>
                      )}
                    </div>
                    {/* Golfer Association Status */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
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
                        <Link to={`/users/${userItem.id}/edit`}>
                          <Button size="sm" variant="secondary">
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}