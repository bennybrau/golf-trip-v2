import { useState } from 'react';
import { Form, useActionData, useLoaderData } from 'react-router';
import { requireAuth } from '../lib/session';
import { updateUser, createUser } from '../lib/auth';
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

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  isAdmin: z.boolean().optional(),
});

export async function action({ request }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const actionType = formData.get('_action') as string;
  
  if (actionType === 'create-user') {
    // Only admins can create users
    if (!user.isAdmin) {
      throw new Response("Unauthorized", { status: 403 });
    }
    
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      isAdmin: formData.get('isAdmin') === 'on',
    };
    
    const result = createUserSchema.safeParse(data);
    
    if (!result.success) {
      return {
        error: result.error.errors[0].message,
        createUserErrors: result.error.flatten().fieldErrors,
        createUserValues: data,
      };
    }
    
    try {
      const { prisma } = await import('../lib/db');
      
      // Check if user with email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: result.data.email },
      });
      
      if (existingUser) {
        return {
          error: 'A user with this email already exists',
          createUserValues: data,
        };
      }
      
      await createUser(result.data.email, result.data.password, result.data.name, result.data.isAdmin || false);
      return { success: true, message: 'User created successfully' };
    } catch (error) {
      console.error('User creation error:', error);
      return {
        error: 'Failed to create user',
        createUserValues: data,
      };
    }
  }
  
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
  const [showCreateUser, setShowCreateUser] = useState(false);

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
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">User Administration</h2>
                  <p className="mt-2 text-gray-600">Manage admin privileges for all users</p>
                </div>
                <Button 
                  onClick={() => setShowCreateUser(!showCreateUser)}
                  variant="primary"
                  size="sm"
                >
                  {showCreateUser ? 'Cancel' : 'Create User'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showCreateUser && (
                <Card className="mb-6 border-2 border-blue-200">
                  <CardContent className="p-4">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Create New User</h3>
                    <Form method="post" className="space-y-4">
                      <input type="hidden" name="_action" value="create-user" />
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <Input
                            name="name"
                            label="Full Name"
                            type="text"
                            required
                            defaultValue={actionData?.createUserValues?.name as string || ''}
                            placeholder="Enter full name"
                            error={actionData?.createUserErrors?.name?.[0]}
                          />
                        </div>
                        
                        <div>
                          <Input
                            name="email"
                            label="Email Address"
                            type="email"
                            required
                            defaultValue={actionData?.createUserValues?.email as string || ''}
                            placeholder="Enter email address"
                            error={actionData?.createUserErrors?.email?.[0]}
                          />
                        </div>
                        
                        <div>
                          <Input
                            name="password"
                            label="Password"
                            type="password"
                            required
                            placeholder="Enter password (min 6 characters)"
                            error={actionData?.createUserErrors?.password?.[0]}
                          />
                        </div>
                        
                        <div className="flex items-center mt-6">
                          <input
                            type="checkbox"
                            name="isAdmin"
                            id="isAdmin"
                            defaultChecked={actionData?.createUserValues?.isAdmin as boolean || false}
                            className="mr-2"
                          />
                          <label htmlFor="isAdmin" className="text-sm font-medium text-gray-700">
                            Make this user an admin
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button type="submit" variant="primary">
                          Create User
                        </Button>
                        <Button 
                          type="button" 
                          variant="secondary"
                          onClick={() => setShowCreateUser(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </Form>
                  </CardContent>
                </Card>
              )}
              
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