import { useState } from 'react';
import { Form, useActionData, useLoaderData } from 'react-router';
import { requireAuth } from '../lib/session';
import { updateUser } from '../lib/auth';
import { updateProfileSchema } from '../lib/validation';
import { Navigation } from '../components/Navigation';
import { Button, Input, Card, CardHeader, CardContent, Alert, Avatar } from '../components/ui';
import { z } from 'zod';
import type { Route } from './+types/account';

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const { prisma } = await import('../lib/db');
  
  // Get all users if current user is admin
  const allUsers = user.isAdmin ? await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
    },
    orderBy: { name: 'asc' }
  }) : [];
  
  return { user, allUsers };
}


export async function action({ request }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const actionType = formData.get('_action') as string;
  
  if (actionType === 'toggle-admin') {
    // Only admins can modify admin status
    if (!user.isAdmin) {
      throw new Response("Unauthorized", { status: 403 });
    }
    
    const targetUserId = formData.get('userId') as string;
    const isAdmin = formData.get('isAdmin') === 'true';
    
    // Prevent user from removing their own admin status if they're the only admin
    if (targetUserId === user.id && !isAdmin) {
      const { prisma } = await import('../lib/db');
      const adminCount = await prisma.user.count({ where: { isAdmin: true } });
      if (adminCount === 1) {
        return {
          error: 'Cannot remove admin status from the last admin user',
        };
      }
    }
    
    try {
      const { prisma } = await import('../lib/db');
      await prisma.user.update({
        where: { id: targetUserId },
        data: { isAdmin },
      });
      return { success: true, message: `User admin status ${isAdmin ? 'granted' : 'revoked'} successfully` };
    } catch (error) {
      console.error('Admin toggle error:', error);
      return {
        error: 'Failed to update admin status',
      };
    }
  }

  const data = Object.fromEntries(formData);
  const result = updateProfileSchema.safeParse(data);

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      values: data,
    };
  }

  try {
    const updatedUser = await updateUser(user.id, result.data);
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Profile update error:', error);
    return {
      error: 'Failed to update profile',
      values: data,
    };
  }
}

export default function Account() {
  const { user, allUsers } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const displayUser = actionData?.user || user;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={displayUser} />

      <main className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card className="shadow-xl">
          <CardHeader>
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="mt-2 text-gray-600">Manage your profile information</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {actionData?.success && (
              <Alert variant="success">
                {actionData.message || 'Profile updated successfully!'}
              </Alert>
            )}

            {actionData?.error && (
              <Alert variant="error">
                {actionData.error}
              </Alert>
            )}

            <Form method="post" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    label="Email Address"
                    type="email"
                    value={displayUser.email}
                    disabled
                    className="bg-gray-50 text-gray-500 cursor-not-allowed"
                    helperText="Email cannot be changed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    name="name"
                    label="Full Name"
                    type="text"
                    defaultValue={actionData?.values?.name as string || displayUser.name}
                    placeholder="Enter your full name"
                    error={actionData?.errors?.name?.[0]}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    name="phone"
                    label="Phone Number (optional)"
                    type="tel"
                    defaultValue={actionData?.values?.phone as string || displayUser.phone || ''}
                    placeholder="Enter your phone number"
                    error={actionData?.errors?.phone?.[0]}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    name="avatar"
                    label="Avatar URL (optional)"
                    type="url"
                    defaultValue={actionData?.values?.avatar as string || displayUser.avatar || ''}
                    placeholder="https://example.com/avatar.jpg"
                    error={actionData?.errors?.avatar?.[0]}
                    helperText="Provide a URL to an image for your profile picture"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>

        {user.isAdmin && (
          <Card className="mt-8 shadow-xl">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">User Administration</h2>
              <p className="mt-2 text-gray-600">Manage admin privileges for all users</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{u.name}</h3>
                      <p className="text-sm text-gray-600">{u.email}</p>
                      {u.id === user.id && (
                        <span className="text-xs text-blue-600 font-medium">(You)</span>
                      )}
                    </div>
                    <Form method="post" className="inline">
                      <input type="hidden" name="_action" value="toggle-admin" />
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="isAdmin" value={(!u.isAdmin).toString()} />
                      <Button
                        type="submit"
                        variant={u.isAdmin ? "danger" : "primary"}
                        size="sm"
                      >
                        {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                    </Form>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8 shadow-xl">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Profile Preview</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar src={displayUser.avatar} alt={displayUser.name} name={displayUser.name} size="lg" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">{displayUser.name}</h3>
                <p className="text-gray-600">{displayUser.email}</p>
                {displayUser.phone && (
                  <p className="text-gray-600">{displayUser.phone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}