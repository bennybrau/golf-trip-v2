import { useState, useEffect } from 'react';
import { Link, redirect } from 'react-router';
import { requireAuth } from '../lib/session';
import { createUser } from '../lib/auth';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, Button, Input, Spinner } from '../components/ui';
import { z } from 'zod';
import type { Route } from './+types/users.new';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create New User - Scaletta Golf Trip" },
    { name: "description", content: "Create a new user account" },
  ];
}

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  isAdmin: z.boolean().optional(),
});

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    
    if (!user.isAdmin) {
      throw redirect('/users');
    }
    
    return { user };
  } catch (response) {
    throw response;
  }
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireAuth(request);
  
  if (!user.isAdmin) {
    throw new Response("Unauthorized", { status: 403 });
  }
  
  const formData = await request.formData();
  const data = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    isAdmin: formData.get('isAdmin') === 'on',
  };

  try {
    const validatedData = createUserSchema.parse(data);
    const { prisma } = await import('../lib/db');
    
    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    
    if (existingUser) {
      return {
        error: 'A user with this email already exists',
        values: data,
      };
    }
    
    await createUser(validatedData.email, validatedData.password, validatedData.name, validatedData.isAdmin || false);
    
    return redirect('/users');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.errors[0].message,
        errors: error.flatten().fieldErrors,
        values: data,
      };
    }
    console.error('User creation error:', error);
    return {
      error: 'Failed to create user',
      values: data,
    };
  }
}

export default function NewUser({ loaderData, actionData }: Route.ComponentProps) {
  const { user } = loaderData;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
  };

  // Reset loading state on error
  useEffect(() => {
    if (actionData?.error) {
      setIsSubmitting(false);
    }
  }, [actionData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              to="/users"
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              ← Back to Users
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Create New User
          </h1>
          <p className="text-gray-600 mt-2">
            Add a new user account to the system
          </p>
        </div>

        <Card className="relative">
          {isSubmitting && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
              <div className="flex items-center gap-3">
                <Spinner size="lg" />
                <span className="text-lg font-medium text-gray-700">Creating user...</span>
              </div>
            </div>
          )}
          
          <CardContent className="p-6">
            <form method="post" className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    name="name"
                    label="Full Name"
                    type="text"
                    required
                    defaultValue={actionData?.values?.name as string || ''}
                    placeholder="Enter full name"
                    error={actionData?.errors?.name?.[0]}
                  />
                </div>
                
                <div>
                  <Input
                    name="email"
                    label="Email Address"
                    type="email"
                    required
                    defaultValue={actionData?.values?.email as string || ''}
                    placeholder="Enter email address"
                    error={actionData?.errors?.email?.[0]}
                  />
                </div>
              </div>
              
              <div>
                <Input
                  name="password"
                  label="Password"
                  type="password"
                  required
                  placeholder="Enter password (min 6 characters)"
                  error={actionData?.errors?.password?.[0]}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isAdmin"
                  id="isAdmin"
                  defaultChecked={actionData?.values?.isAdmin as boolean || false}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-900">
                  Make this user an admin
                </label>
              </div>

              {actionData?.error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                  {actionData.error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Spinner size="sm" />
                      Creating User...
                    </div>
                  ) : (
                    'Create User'
                  )}
                </Button>
                <Link to="/users">
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}