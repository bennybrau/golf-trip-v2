import { useState, useEffect } from 'react';
import { Link, redirect } from 'react-router';
import { requireAuth } from '../lib/session';
import { PageLayout, PageHeader, Card, CardContent, Button, Input, ActionMessage } from '../components/ui';
import { prisma } from '../lib/db';
import { resolveYear } from '../lib/season';
import { z } from 'zod';
import type { Route } from './+types/golfers.new';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Add New Golfer - Scaletta Golf Trip" },
    { name: "description", content: "Add a new golfer to the system" },
  ];
}

const GolferSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
});

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    
    if (!user.isAdmin) {
      throw redirect('/golfers');
    }
    
    // Preserve search parameters from the referring page
    const url = new URL(request.url);
    const sort = url.searchParams.get('sort');
    const order = url.searchParams.get('order');
    
    return { user, sort, order };
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
  const url = new URL(request.url);
  
  const data = {
    name: formData.get('name') as string,
    email: formData.get('email') as string || undefined,
    phone: formData.get('phone') as string || undefined,
  };

  try {
    const validatedData = GolferSchema.parse(data);
    
    // Check if golfer already exists (unique name constraint)
    const existingGolfer = await prisma.golfer.findUnique({
      where: {
        name: validatedData.name
      }
    });
    
    if (existingGolfer) {
      return { error: `A golfer named "${validatedData.name}" already exists` };
    }
    
    // Create new golfer with default active status for current year
    const newGolfer = await prisma.golfer.create({
      data: {
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
      }
    });
    
    // Put the new golfer on the roster for the season being viewed, not a
    // hardcoded one -- adding a golfer from /golfers?year=2026 previously filed
    // them under 2025, leaving them invisible on the season you were looking at.
    await prisma.golferStatus.create({
      data: {
        golferId: newGolfer.id,
        year: resolveYear(url.searchParams),
        isActive: true,
        cabin: null
      }
    });
    
    // Preserve search parameters when redirecting
    const sort = url.searchParams.get('sort');
    const order = url.searchParams.get('order');
    
    const redirectParams = new URLSearchParams();
    if (sort && sort !== 'name') redirectParams.set('sort', sort);
    if (order && order !== 'asc') redirectParams.set('order', order);
    
    const redirectUrl = redirectParams.toString() ? `/golfers?${redirectParams.toString()}` : '/golfers';
    return redirect(redirectUrl);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create golfer" };
  }
}

export default function NewGolfer({ loaderData, actionData }: Route.ComponentProps) {
  const { user, sort, order } = loaderData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Generate back URL with preserved search parameters
  const getBackUrl = () => {
    const params = new URLSearchParams();
    if (sort && sort !== 'name') params.set('sort', sort);
    if (order && order !== 'asc') params.set('order', order);
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
    <PageLayout user={user} width="form">
      <Link
        to={getBackUrl()}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        &larr; Back to Golfers
      </Link>

      <PageHeader title="Add Golfer" subtitle="Add someone to the master roster" />

      <Card>
        <CardContent className="py-5">
          <form method="post" className="space-y-5" onSubmit={handleSubmit}>
            <Input id="name" name="name" label="Name" required placeholder="Full name" />
            <Input id="email" name="email" type="email" label="Email" placeholder="Optional" />
            <Input id="phone" name="phone" type="tel" label="Phone" placeholder="Optional" />

            <ActionMessage actionData={actionData} className="" />

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Link to={getBackUrl()}>
                <Button type="button" variant="secondary" fullWidth>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={isSubmitting} loadingText="Adding...">
                Add Golfer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
