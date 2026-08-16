import { useState, useEffect } from 'react';
import { Link, redirect } from 'react-router';
import { requireAuth } from '../lib/session';
import {
  PageLayout,
  PageHeader,
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Label,
  ActionMessage,
  YearSelect,
} from '../components/ui';
import { prisma } from '../lib/db';
import { appendYear, resolveYear } from '../lib/season';
import { getAvailableYears } from '../lib/season.server';
import { ROUND_LABELS, COURSES } from '../lib/course';
import { z } from 'zod';
import type { Route } from './+types/foursomes.new';
import { parseDateTimeLocal } from '../lib/timeUtils';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create New Foursome - Scaletta Golf Trip" },
    { name: "description", content: "Create a new foursome for a round" },
  ];
}

const FoursomeSchema = z.object({
  round: z.enum(['FRIDAY_MORNING', 'FRIDAY_AFTERNOON', 'SATURDAY_MORNING', 'SATURDAY_AFTERNOON']),
  course: z.enum(['BLACK', 'SILVER']),
  teeTime: z.string().min(1, "Tee time is required"),
  year: z.string().min(1, "Year is required"),
  golfer1Id: z.string().optional(),
  golfer2Id: z.string().optional(),
  golfer3Id: z.string().optional(),
  golfer4Id: z.string().optional(),
  score: z.string().optional(),
}).refine((data) => {
  const golfers = [data.golfer1Id, data.golfer2Id, data.golfer3Id, data.golfer4Id].filter(Boolean);
  return golfers.length > 0 && new Set(golfers).size === golfers.length;
}, {
  message: "At least one golfer is required and all golfers must be unique",
});

const roundLabels = {
  FRIDAY_MORNING: 'Friday Morning',
  FRIDAY_AFTERNOON: 'Friday Afternoon',
  SATURDAY_MORNING: 'Saturday Morning',
  SATURDAY_AFTERNOON: 'Saturday Afternoon',
};

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    
    // Get URL parameters to preserve when redirecting
    const url = new URL(request.url);
    const sort = url.searchParams.get('sort');
    const order = url.searchParams.get('order');
    const availableYears = await getAvailableYears();
    const selectedYear = resolveYear(url.searchParams, availableYears);

    if (!user.isAdmin) {
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      if (order) params.set('order', order);
      appendYear(params, selectedYear);
      const queryString = params.toString();
      throw redirect(queryString ? `/foursomes?${queryString}` : '/foursomes');
    }

    // Only golfers on this season's roster can be put in a foursome, which is
    // why a season with an empty roster cannot have foursomes created at all --
    // see the notice rendered below when this list comes back empty.
    const golfers = await prisma.golfer.findMany({
      where: {
        yearlyStatus: {
          some: {
            year: selectedYear,
            isActive: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return { user, golfers, sort, order, year: selectedYear, availableYears };
  } catch (response) {
    throw response;
  }
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireAuth(request);
  
  if (!user.isAdmin) {
    throw new Response("Unauthorized", { status: 403 });
  }
  
  // Get URL parameters to preserve when redirecting
  const url = new URL(request.url);
  const sort = url.searchParams.get('sort');
  const order = url.searchParams.get('order');
  
  const formData = await request.formData();
  const data = {
    round: formData.get('round') as string,
    course: formData.get('course') as string,
    teeTime: formData.get('teeTime') as string,
    year: formData.get('year') as string,
    golfer1Id: formData.get('golfer1Id') as string || undefined,
    golfer2Id: formData.get('golfer2Id') as string || undefined,
    golfer3Id: formData.get('golfer3Id') as string || undefined,
    golfer4Id: formData.get('golfer4Id') as string || undefined,
    score: formData.get('score') as string,
  };

  try {
    const validatedData = FoursomeSchema.parse(data);
    const scoreValue = validatedData.score && validatedData.score !== '' ? parseInt(validatedData.score) : 0;
    // Parse the datetime-local input with proper timezone handling
    const teeTimeValue = parseDateTimeLocal(validatedData.teeTime);
    
    await prisma.foursome.create({
      data: {
        round: validatedData.round,
        course: validatedData.course,
        teeTime: teeTimeValue,
        golfer1Id: validatedData.golfer1Id || null,
        golfer2Id: validatedData.golfer2Id || null,
        golfer3Id: validatedData.golfer3Id || null,
        golfer4Id: validatedData.golfer4Id || null,
        score: scoreValue,
        year: parseInt(validatedData.year),
      }
    });
    
    // Preserve URL parameters when redirecting back
    const params = new URLSearchParams();
    if (sort) params.set('sort', sort);
    if (order) params.set('order', order);
    appendYear(params, parseInt(validatedData.year));
    const queryString = params.toString();

    return redirect(queryString ? `/foursomes?${queryString}` : '/foursomes');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create foursome" };
  }
}

export default function NewFoursome({ loaderData, actionData }: Route.ComponentProps) {
  const { user, golfers = [], sort, order, year, availableYears } = loaderData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGolfers, setSelectedGolfers] = useState({
    golfer1Id: '',
    golfer2Id: '',
    golfer3Id: '',
    golfer4Id: ''
  });

  // Handle golfer selection changes
  const handleGolferChange = (selectName: string, golferId: string) => {
    setSelectedGolfers(prev => ({
      ...prev,
      [selectName]: golferId
    }));
  };

  // Check if a golfer is already selected in another dropdown
  const isGolferDisabled = (golferId: string, currentSelectName: string) => {
    const selectedInOther = Object.entries(selectedGolfers).some(
      ([key, value]) => key !== currentSelectName && value === golferId && value !== ''
    );
    return selectedInOther;
  };

  // Generate URL with current search parameters
  const getUrlWithCurrentParams = (basePath: string) => {
    const params = new URLSearchParams();
    if (sort) params.set('sort', sort);
    if (order) params.set('order', order);
    appendYear(params, year);
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
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

  const golferSlots = ['golfer1Id', 'golfer2Id', 'golfer3Id', 'golfer4Id'] as const;

  return (
    <PageLayout user={user} width="form">
      <Link
        to={getUrlWithCurrentParams('/foursomes')}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        &larr; Back to Foursomes
      </Link>

      <PageHeader title="Add Foursome" subtitle={`Schedule a group for the ${year} trip`} />

      <Card>
        <CardContent className="py-5">
          <form method="post" className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select id="round" name="round" label="Round" required>
                <option value="">Select a round</option>
                {Object.entries(ROUND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>

              <Select id="course" name="course" label="Course" required>
                <option value="">Select a course</option>
                {Object.entries(COURSES).map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.label} &mdash; par {info.par}, {info.yardage.toLocaleString()} yds
                  </option>
                ))}
              </Select>

              <Input
                id="teeTime"
                name="teeTime"
                type="datetime-local"
                label="Tee time"
                required
                helperText="Eastern Time (ET)"
              />

              <div className="space-y-1.5">
                <Label>Season</Label>
                {/* Changing the season re-filters the golfer pickers, so this
                    navigates. The hidden input is what the action reads. */}
                <input type="hidden" name="year" value={year} />
                <YearSelect years={availableYears} value={year} label={null} />
              </div>
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-gray-700 mb-2">Players</legend>
              {/* Single column below sm: two selects side by side at 390px
                  truncated golfer names to nothing. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {golferSlots.map((slot, index) => (
                  <Select
                    key={slot}
                    id={slot}
                    name={slot}
                    aria-label={`Player ${index + 1}`}
                    value={selectedGolfers[slot]}
                    onChange={(event) => handleGolferChange(slot, event.target.value)}
                    disabled={golfers.length === 0}
                  >
                    <option value="">Player {index + 1}</option>
                    {golfers.map((golfer: any) => (
                      <option
                        key={golfer.id}
                        value={golfer.id}
                        disabled={isGolferDisabled(golfer.id, slot)}
                      >
                        {golfer.name}
                      </option>
                    ))}
                  </Select>
                ))}
              </div>
            </fieldset>

            {golfers.length === 0 && (
              <div className="rounded-control border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-medium">No golfers on the {year} roster.</p>
                <p className="mt-1">
                  A foursome needs at least one golfer, so the {year} season has to be set up first.
                </p>
                <Link
                  to="/admin/season"
                  className="mt-2 inline-block font-medium underline underline-offset-2"
                >
                  Set up the {year} season &rarr;
                </Link>
              </div>
            )}

            <Input
              id="score"
              name="score"
              type="number"
              label="Team score"
              defaultValue="0"
              placeholder="e.g. -2"
              helperText="Strokes relative to par for the group. Leave at 0 until the round is played."
            />

            <ActionMessage actionData={actionData} className="" />

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Link to={getUrlWithCurrentParams('/foursomes')} className="sm:w-auto">
                <Button type="button" variant="secondary" fullWidth>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={golfers.length === 0}
                loading={isSubmitting}
                loadingText="Creating..."
              >
                Create Foursome
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
