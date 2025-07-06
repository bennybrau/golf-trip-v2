import { useState, useEffect } from 'react';
import { Link, redirect } from 'react-router';
import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, Button, Input, Spinner } from '../components/ui';
import { prisma } from '../lib/db';
import { z } from 'zod';
import type { Route } from './+types/golfers.$id.edit';

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: "Edit Golfer - Scaletta Golf" },
    { name: "description", content: `Edit golfer details` },
  ];
}

const GolferSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
});

export async function loader({ request, params }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    
    if (!user.isAdmin) {
      throw redirect('/golfers');
    }
    
    const golferId = params.id;
    
    // Get the golfer to edit
    const golfer = await prisma.golfer.findUnique({
      where: { id: golferId },
    });
    
    if (!golfer) {
      throw new Response("Golfer not found", { status: 404 });
    }
    
    return { user, golfer };
  } catch (response) {
    throw response;
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireAuth(request);
  
  if (!user.isAdmin) {
    throw new Response("Unauthorized", { status: 403 });
  }
  
  const golferId = params.id;
  const formData = await request.formData();
  const data = {
    name: formData.get('name') as string,
    email: formData.get('email') as string || undefined,
    phone: formData.get('phone') as string || undefined,
  };

  try {
    // Check if golfer exists
    const existingGolfer = await prisma.golfer.findUnique({
      where: { id: golferId },
    });
    
    if (!existingGolfer) {
      return { error: "Golfer not found" };
    }
    
    const validatedData = GolferSchema.parse(data);
    
    await prisma.golfer.update({
      where: { id: golferId },
      data: {
        ...validatedData,
        email: validatedData.email || null,
      }
    });
    
    return redirect('/golfers');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update golfer" };
  }
}

export default function EditGolfer({ loaderData, actionData }: Route.ComponentProps) {
  const { user, golfer } = loaderData;
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
              to="/golfers"
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              ← Back to Golfers
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Golfer
          </h1>
          <p className="text-gray-600 mt-2">
            Update {golfer.name}'s profile
          </p>
        </div>

        <Card className="relative">
          {isSubmitting && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
              <div className="flex items-center gap-3">
                <Spinner size="lg" />
                <span className="text-lg font-medium text-gray-700">Updating golfer...</span>
              </div>
            </div>
          )}
          
          <CardContent className="p-6">
            <form method="post" className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <Input 
                  id="name"
                  name="name" 
                  type="text" 
                  required
                  defaultValue={golfer.name}
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input 
                  id="email"
                  name="email" 
                  type="email" 
                  defaultValue={golfer.email || ''}
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <Input 
                  id="phone"
                  name="phone" 
                  type="tel" 
                  defaultValue={golfer.phone || ''}
                  className="w-full"
                />
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
                      Updating Golfer...
                    </div>
                  ) : (
                    'Update Golfer'
                  )}
                </Button>
                <Link to="/golfers">
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