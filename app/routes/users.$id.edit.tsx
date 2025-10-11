import { useState, useEffect } from 'react';
import { Link, redirect } from 'react-router';
import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, Button, Input, Spinner } from '../components/ui';
import { prisma } from '../lib/db';
import { z } from 'zod';

export function meta() {
  return [
    { title: "Edit User - Scaletta Golf Trip" },
    { name: "description", content: "Edit user details and golfer association" },
  ];
}

const UserEditSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().transform((val) => val.trim() === '' ? undefined : val).optional().refine((val) => {
    if (!val) return true;
    return /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)]/g, ''));
  }, 'Please enter a valid phone number'),
  isAdmin: z.string().optional(),
  associateGolfer: z.string().optional(),
  createNewGolfer: z.string().optional(),
  newGolferName: z.string().optional(),
  newGolferPhone: z.string().transform((val) => val.trim() === '' ? undefined : val).optional().refine((val) => {
    if (!val) return true;
    return /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)]/g, ''));
  }, 'Please enter a valid phone number'),
});

export async function loader({ request, params }: { request: Request, params: any }) {
  try {
    const currentUser = await requireAuth(request);
    
    if (!currentUser.isAdmin) {
      throw redirect('/');
    }
    
    const userId = params.id;
    
    // Get the user to edit
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
          }
        }
      },
    });
    
    if (!user) {
      throw new Response("User not found", { status: 404 });
    }
    
    // Get all golfers that are not already associated with other users
    const golfers = await prisma.golfer.findMany({
      where: {
        user: null
      },
      orderBy: { name: 'asc' }
    });
    
    return { currentUser, user, golfers };
  } catch (response) {
    throw response;
  }
}

export async function action({ request, params }: { request: Request, params: any }) {
  const currentUser = await requireAuth(request);
  
  if (!currentUser.isAdmin) {
    throw new Response("Unauthorized", { status: 403 });
  }
  
  const userId = params.id;
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!existingUser) {
      return { error: "User not found" };
    }
    
    const validatedData = UserEditSchema.parse(data);
    
    // Check if email is already taken by another user
    if (validatedData.email !== existingUser.email) {
      const emailConflict = await prisma.user.findFirst({
        where: { 
          email: validatedData.email,
          id: { not: userId }
        },
      });
      
      if (emailConflict) {
        return { error: `Email ${validatedData.email} is already in use by another user` };
      }
    }
    
    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        isAdmin: validatedData.isAdmin === 'on',
      }
    });
    
    // Handle golfer association
    if (validatedData.createNewGolfer === 'on') {
      // Create new golfer and associate with user
      if (!validatedData.newGolferName) {
        return { error: "Golfer name is required when creating a new golfer" };
      }
      
      const newGolfer = await prisma.golfer.create({
        data: {
          name: validatedData.newGolferName,
          email: validatedData.email,
          phone: validatedData.newGolferPhone || null,
        },
      });
      
      // Update user to associate with new golfer
      await prisma.user.update({
        where: { id: userId },
        data: {
          golferId: newGolfer.id,
        }
      });
    } else if (validatedData.associateGolfer && validatedData.associateGolfer !== '') {
      // Associate with existing golfer
      await prisma.user.update({
        where: { id: userId },
        data: {
          golferId: validatedData.associateGolfer,
        }
      });
    } else {
      // Remove golfer association
      await prisma.user.update({
        where: { id: userId },
        data: {
          golferId: null,
        }
      });
    }
    
    return redirect('/users');
  } catch (error) {
    console.error('Edit user error:', error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update user" };
  }
}

export default function EditUser({ loaderData, actionData }: { loaderData: any, actionData?: any }) {
  const { currentUser, user, golfers } = loaderData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createNewGolfer, setCreateNewGolfer] = useState(false);

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
      <Navigation user={currentUser} />
      
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
            Edit User
          </h1>
          <p className="text-gray-600 mt-2">
            Update {user.name}'s profile and golfer association
          </p>
        </div>

        <div className="space-y-6">
          {/* User Details Card */}
          <Card className="relative">
            {isSubmitting && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Spinner size="lg" />
                  <span className="text-lg font-medium text-gray-700">Updating user...</span>
                </div>
              </div>
            )}
            
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Information</h2>
              
              <form method="post" className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <Input 
                      id="name"
                      name="name" 
                      type="text" 
                      required
                      defaultValue={user.name}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <Input 
                      id="email"
                      name="email" 
                      type="email" 
                      required
                      defaultValue={user.email}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <Input 
                      id="phone"
                      name="phone" 
                      type="tel" 
                      defaultValue={user.phone || ''}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isAdmin"
                        defaultChecked={user.isAdmin}
                        className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Administrator privileges
                      </span>
                    </label>
                  </div>
                </div>

                {/* Golfer Association Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Golfer Association</h3>
                  
                  {user.golfer ? (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                      <h4 className="text-sm font-medium text-green-800 mb-2">Currently Associated Golfer</h4>
                      <p className="text-sm text-green-700">
                        {user.golfer.name}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-4">
                      <p className="text-sm text-orange-700">
                        No golfer is currently associated with this user.
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="associationAction"
                          value="existing"
                          defaultChecked={!createNewGolfer}
                          onChange={() => setCreateNewGolfer(false)}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Associate with existing golfer
                        </span>
                      </label>
                      
                      {!createNewGolfer && (
                        <div className="mt-2 ml-6">
                          <select 
                            name="associateGolfer" 
                            defaultValue={user.golfer?.id || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">No association</option>
                            {user.golfer && (
                              <option key={user.golfer.id} value={user.golfer.id}>
                                {user.golfer.name} (Currently Associated)
                              </option>
                            )}
                            {golfers.map((golfer: any) => (
                              <option key={golfer.id} value={golfer.id}>
                                {golfer.name} ({golfer.email || 'No email'})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="associationAction"
                          value="new"
                          checked={createNewGolfer}
                          onChange={() => setCreateNewGolfer(true)}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Create new golfer for this user
                        </span>
                      </label>
                      
                      {createNewGolfer && (
                        <div className="mt-2 ml-6 space-y-4 bg-gray-50 p-4 rounded-md">
                          <input type="hidden" name="createNewGolfer" value="on" />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Golfer Name *
                              </label>
                              <Input 
                                name="newGolferName" 
                                type="text" 
                                placeholder="Enter golfer name"
                                className="w-full"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Golfer Phone
                              </label>
                              <Input 
                                name="newGolferPhone" 
                                type="tel" 
                                placeholder="Enter phone number"
                                className="w-full"
                              />
                            </div>
                          </div>
                          
                        </div>
                      )}
                    </div>
                  </div>
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
                        Updating User...
                      </div>
                    ) : (
                      'Update User'
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
        </div>
      </main>
    </div>
  );
}