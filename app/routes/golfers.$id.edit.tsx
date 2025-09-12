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
    { title: "Edit Golfer - Scaletta Golf Trip" },
    { name: "description", content: `Edit golfer details` },
  ];
}

const GolferSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  cabin: z.string().optional(),
}).refine((data) => {
  if (data.cabin && data.cabin !== '') {
    const cabinNum = parseInt(data.cabin);
    return !isNaN(cabinNum) && cabinNum >= 1 && cabinNum <= 4;
  }
  return true;
}, {
  message: "Cabin must be a number between 1 and 4",
  path: ["cabin"]
});

export async function loader({ request, params }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    
    if (!user.isAdmin) {
      throw redirect('/golfers');
    }
    
    const golferId = params.id;
    
    // Preserve search parameters from the referring page
    const url = new URL(request.url);
    const sort = url.searchParams.get('sort');
    const order = url.searchParams.get('order');
    const year = url.searchParams.get('year') || '2025';
    const selectedYear = parseInt(year);
    
    // Get the golfer to edit with yearly status
    const golfer = await prisma.golfer.findUnique({
      where: { id: golferId },
      include: {
        yearlyStatus: {
          where: { year: selectedYear }
        }
      }
    });
    
    if (!golfer) {
      throw new Response("Golfer not found", { status: 404 });
    }
    
    // Get or create yearly status for editing
    let yearlyStatus = golfer.yearlyStatus[0];
    if (!yearlyStatus) {
      // Create yearly status if it doesn't exist
      yearlyStatus = await prisma.golferStatus.create({
        data: {
          golferId: golfer.id,
          year: selectedYear,
          isActive: true,
          cabin: null
        }
      });
    }
    
    return { user, golfer, yearlyStatus, sort, order, selectedYear };
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
  const url = new URL(request.url);
  const selectedYear = parseInt(url.searchParams.get('year') || '2025');
  
  const data = {
    name: formData.get('name') as string,
    email: formData.get('email') as string || undefined,
    phone: formData.get('phone') as string || undefined,
    cabin: formData.get('cabin') as string || undefined,
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
    
    // Check for name conflicts (excluding current golfer)
    const conflictingGolfer = await prisma.golfer.findFirst({
      where: {
        name: validatedData.name,
        id: { not: golferId }
      }
    });
    
    if (conflictingGolfer) {
      return { error: `A golfer named "${validatedData.name}" already exists` };
    }
    
    // Update golfer basic info
    await prisma.golfer.update({
      where: { id: golferId },
      data: {
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
      }
    });
    
    // Update or create yearly status for cabin
    await prisma.golferStatus.upsert({
      where: {
        golferId_year: {
          golferId,
          year: selectedYear
        }
      },
      create: {
        golferId,
        year: selectedYear,
        cabin: validatedData.cabin && validatedData.cabin !== '' ? parseInt(validatedData.cabin) : null,
        isActive: true,
      },
      update: {
        cabin: validatedData.cabin && validatedData.cabin !== '' ? parseInt(validatedData.cabin) : null,
      }
    });
    
    // Preserve search parameters when redirecting
    const sort = url.searchParams.get('sort');
    const order = url.searchParams.get('order');
    
    const redirectParams = new URLSearchParams();
    if (sort && sort !== 'createdAt') redirectParams.set('sort', sort);
    if (order && order !== 'desc') redirectParams.set('order', order);
    if (selectedYear !== 2025) redirectParams.set('year', selectedYear.toString());
    
    const redirectUrl = redirectParams.toString() ? `/golfers?${redirectParams.toString()}` : '/golfers';
    return redirect(redirectUrl);
  } catch (error) {
    console.error('Edit golfer error:', error);
    if (error instanceof z.ZodError) {
      console.error('Zod validation errors:', error.errors);
      return { error: error.errors[0].message };
    }
    // Return more detailed error for debugging
    return { error: `Failed to update golfer: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export default function EditGolfer({ loaderData, actionData }: Route.ComponentProps) {
  const { user, golfer, sort, order, selectedYear } = loaderData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Generate back URL with preserved search parameters
  const getBackUrl = () => {
    const params = new URLSearchParams();
    if (sort && sort !== 'createdAt') params.set('sort', sort);
    if (order && order !== 'desc') params.set('order', order);
    if (selectedYear !== 2025) params.set('year', selectedYear.toString());
    const queryString = params.toString();
    return queryString ? `/golfers?${queryString}` : '/golfers';
  };

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
              to={getBackUrl()}
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
              
              <div>
                <label htmlFor="cabin" className="block text-sm font-medium text-gray-700 mb-2">
                  Cabin (Optional)
                </label>
                <select 
                  id="cabin"
                  name="cabin" 
                  defaultValue={loaderData.yearlyStatus?.cabin?.toString() || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select a cabin</option>
                  <option value="1">Cabin 1</option>
                  <option value="2">Cabin 2</option>
                  <option value="3">Cabin 3</option>
                  <option value="4">Cabin 4</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Assign the golfer to a cabin (1-4)
                </p>
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
                <Link to={getBackUrl()}>
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