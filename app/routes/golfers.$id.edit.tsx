import { useState, useEffect } from 'react';
import { Link, redirect } from 'react-router';
import { requireAuth } from '../lib/session';
import { PageLayout, PageHeader, Card, CardContent, Button, Input, Select, ActionMessage } from '../components/ui';
import { prisma } from '../lib/db';
import { appendYear, resolveYear } from '../lib/season';
import { getAvailableYears } from '../lib/season.server';
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
    const availableYears = await getAvailableYears();
    const selectedYear = resolveYear(url.searchParams, availableYears);

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

    // Read-only: a loader must never mutate. This previously CREATED the missing
    // GolferStatus row, so merely opening this page (or a link prefetch, or a
    // crawler) put the golfer on that season's roster. Since /golfers does not
    // thread ?year= into its Edit links, that also meant every edit-page visit
    // silently wrote a row for the default season. Absence is now reported to the
    // component, which offers an explicit "add to roster" action instead.
    const yearlyStatus = golfer.yearlyStatus[0] ?? null;

    return { user, golfer, yearlyStatus, sort, order, selectedYear, availableYears };
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
  const selectedYear = resolveYear(url.searchParams);

  // Explicit replacement for the loader's former side-effecting create.
  if (formData.get('_action') === 'add-to-roster') {
    const golfer = await prisma.golfer.findUnique({ where: { id: golferId } });
    if (!golfer) {
      return { error: "Golfer not found" };
    }

    await prisma.golferStatus.upsert({
      where: { golferId_year: { golferId, year: selectedYear } },
      create: { golferId, year: selectedYear, isActive: true, cabin: null },
      update: { isActive: true },
    });

    return { success: true, message: `${golfer.name} added to the ${selectedYear} roster` };
  }

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
    appendYear(redirectParams, selectedYear);

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
  const { user, golfer, yearlyStatus, sort, order, selectedYear } = loaderData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isOnRoster = yearlyStatus !== null;

  // Generate back URL with preserved search parameters
  const getBackUrl = () => {
    const params = new URLSearchParams();
    if (sort && sort !== 'createdAt') params.set('sort', sort);
    if (order && order !== 'desc') params.set('order', order);
    appendYear(params, selectedYear);
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

      <PageHeader title="Edit Golfer" subtitle={`Update ${golfer.name}’s details`} />

      {!isOnRoster && (
        <div className="mb-6 rounded-control border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            <span className="font-medium">
              {golfer.name} isn&rsquo;t on the {selectedYear} roster.
            </span>{' '}
            Cabin assignment is unavailable until they are added, and they won&rsquo;t appear on the{' '}
            {selectedYear} scoreboard or in foursome pickers.
          </p>
          <form method="post" className="mt-3">
            <input type="hidden" name="_action" value="add-to-roster" />
            <Button type="submit" size="sm">
              Add to {selectedYear} roster
            </Button>
          </form>
        </div>
      )}

      <ActionMessage actionData={actionData} />

      <Card>
        <CardContent className="py-5">
          <form method="post" className="space-y-5" onSubmit={handleSubmit}>
            <Input id="name" name="name" label="Name" required defaultValue={golfer.name} />
            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              defaultValue={golfer.email ?? ''}
              placeholder="Optional"
            />
            <Input
              id="phone"
              name="phone"
              type="tel"
              label="Phone"
              defaultValue={golfer.phone ?? ''}
              placeholder="Optional"
            />

            <Select
              id="cabin"
              name="cabin"
              label={`Cabin for ${selectedYear}`}
              defaultValue={yearlyStatus?.cabin?.toString() ?? ''}
              disabled={!isOnRoster}
              helperText={
                isOnRoster
                  ? 'Cabins are assigned per season.'
                  : `Add ${golfer.name} to the ${selectedYear} roster first.`
              }
            >
              <option value="">No cabin</option>
              <option value="1">Cabin 1</option>
              <option value="2">Cabin 2</option>
              <option value="3">Cabin 3</option>
              <option value="4">Cabin 4</option>
            </Select>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Link to={getBackUrl()}>
                <Button type="button" variant="secondary" fullWidth>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={isSubmitting} loadingText="Saving...">
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
