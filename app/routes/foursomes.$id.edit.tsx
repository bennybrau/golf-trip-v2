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
  Badge,
  ActionMessage,
} from '../components/ui';
import { prisma } from '../lib/db';
import { appendYear } from '../lib/season';
import { ROUND_LABELS, COURSES, COURSE_LABELS } from '../lib/course';
import { z } from 'zod';
import type { Route } from './+types/foursomes.$id.edit';
import { parseDateTimeLocal, formatDateTimeLocal } from '../lib/timeUtils';

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: "Edit Foursome - Scaletta Golf Trip" },
    { name: "description", content: `Edit foursome details` },
  ];
}

const FoursomeSchema = z.object({
  round: z.enum(['FRIDAY_MORNING', 'FRIDAY_AFTERNOON', 'SATURDAY_MORNING', 'SATURDAY_AFTERNOON']),
  course: z.enum(['BLACK', 'SILVER']),
  teeTime: z.string().min(1, "Tee time is required"),
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

export async function loader({ request, params }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    
    // Get URL parameters to preserve when redirecting
    const url = new URL(request.url);
    const sort = url.searchParams.get('sort');
    const order = url.searchParams.get('order');
    
    if (!user.isAdmin) {
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      if (order) params.set('order', order);
      const queryString = params.toString();
      throw redirect(queryString ? `/foursomes?${queryString}` : '/foursomes');
    }
    
    const foursomeId = params.id;
    
    // Get the foursome to edit
    const foursome = await prisma.foursome.findUnique({
      where: { id: foursomeId },
      include: {
        golfer1: true,
        golfer2: true,
        golfer3: true,
        golfer4: true,
      },
    });
    
    if (!foursome) {
      throw new Response("Foursome not found", { status: 404 });
    }
    
    // Get active golfers for the foursome's year
    const golfers = await prisma.golfer.findMany({
      where: {
        yearlyStatus: {
          some: {
            year: foursome.year,
            isActive: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    return { user, foursome, golfers, sort, order };
  } catch (response) {
    throw response;
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireAuth(request);
  
  if (!user.isAdmin) {
    throw new Response("Unauthorized", { status: 403 });
  }
  
  // Get URL parameters to preserve when redirecting
  const url = new URL(request.url);
  const sort = url.searchParams.get('sort');
  const order = url.searchParams.get('order');
  
  const foursomeId = params.id;
  const formData = await request.formData();
  const data = {
    round: formData.get('round') as string,
    course: formData.get('course') as string,
    teeTime: formData.get('teeTime') as string,
    golfer1Id: formData.get('golfer1Id') as string || undefined,
    golfer2Id: formData.get('golfer2Id') as string || undefined,
    golfer3Id: formData.get('golfer3Id') as string || undefined,
    golfer4Id: formData.get('golfer4Id') as string || undefined,
    score: formData.get('score') as string,
  };

  try {
    // Check if foursome exists
    const existingFoursome = await prisma.foursome.findUnique({
      where: { id: foursomeId },
    });
    
    if (!existingFoursome) {
      return { error: "Foursome not found" };
    }
    
    const validatedData = FoursomeSchema.parse(data);
    const scoreValue = validatedData.score && validatedData.score !== '' ? parseInt(validatedData.score) : 0;
    // Parse the datetime-local input with proper timezone handling
    const teeTimeValue = parseDateTimeLocal(validatedData.teeTime);
    
    await prisma.foursome.update({
      where: { id: foursomeId },
      data: {
        round: validatedData.round,
        course: validatedData.course,
        teeTime: teeTimeValue,
        golfer1Id: validatedData.golfer1Id || null,
        golfer2Id: validatedData.golfer2Id || null,
        golfer3Id: validatedData.golfer3Id || null,
        golfer4Id: validatedData.golfer4Id || null,
        score: scoreValue,
      }
    });
    
    // Preserve URL parameters when redirecting back. The foursome's own year is
    // used rather than a URL param: a foursome's season cannot be changed here,
    // and omitting it previously bounced an admin editing a 2024 round back to
    // the current season's list.
    const params = new URLSearchParams();
    if (sort) params.set('sort', sort);
    if (order) params.set('order', order);
    appendYear(params, existingFoursome.year);
    const queryString = params.toString();

    return redirect(queryString ? `/foursomes?${queryString}` : '/foursomes');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update foursome" };
  }
}

// formatDateTimeLocal function is now imported from timeUtils

export default function EditFoursome({ loaderData, actionData }: Route.ComponentProps) {
  const { user, foursome, golfers = [], sort, order } = loaderData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGolfers, setSelectedGolfers] = useState({
    golfer1Id: foursome.golfer1Id || '',
    golfer2Id: foursome.golfer2Id || '',
    golfer3Id: foursome.golfer3Id || '',
    golfer4Id: foursome.golfer4Id || ''
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

  // Generate URL with current search parameters, keeping the season this
  // foursome belongs to so "Back to Foursomes" returns to the right list.
  const getUrlWithCurrentParams = (basePath: string) => {
    const params = new URLSearchParams();
    if (sort) params.set('sort', sort);
    if (order) params.set('order', order);
    appendYear(params, foursome.year);
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

      <PageHeader
        title="Edit Foursome"
        subtitle={`${ROUND_LABELS[foursome.round as keyof typeof ROUND_LABELS]} · ${foursome.year}`}
      />

      <Card>
        <CardContent className="py-5">
          <form method="post" className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="round"
                name="round"
                label="Round"
                required
                defaultValue={foursome.round}
              >
                {Object.entries(ROUND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>

              <Select
                id="course"
                name="course"
                label="Course"
                required
                defaultValue={foursome.course}
              >
                {Object.entries(COURSES).map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.label} &mdash; par {info.par}, {info.yardage.toLocaleString()} yds
                  </option>
                ))}
              </Select>
            </div>

            <Input
              id="teeTime"
              name="teeTime"
              type="datetime-local"
              label="Tee time"
              required
              defaultValue={formatDateTimeLocal(new Date(foursome.teeTime))}
              helperText="Eastern Time (ET)"
            />

            {/* A foursome's season cannot be changed here -- moving a round
                between years would orphan it from that season's roster. */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Season:</span>
              <Badge tone="neutral">{foursome.year}</Badge>
              <span className="text-gray-400">(cannot be changed)</span>
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-gray-700 mb-2">Players</legend>
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

            <Input
              id="score"
              name="score"
              type="number"
              label="Team score"
              defaultValue={foursome.score.toString()}
              helperText="Strokes relative to par for the group."
            />

            <ActionMessage actionData={actionData} className="" />

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Link to={getUrlWithCurrentParams('/foursomes')}>
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
