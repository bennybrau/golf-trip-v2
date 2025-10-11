import { useState, useEffect } from 'react';
import { Link, redirect } from 'react-router';
import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, Button, Input, Spinner } from '../components/ui';
import { prisma } from '../lib/db';
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
    const year = url.searchParams.get('year') || '2025';
    
    if (!user.isAdmin) {
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      if (order) params.set('order', order);
      if (year !== '2025') params.set('year', year);
      const queryString = params.toString();
      throw redirect(queryString ? `/foursomes?${queryString}` : '/foursomes');
    }
    
    const selectedYear = parseInt(year);
    
    // Get active golfers for the selected year
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
    
    return { user, golfers, sort, order, year: selectedYear };
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
    if (validatedData.year !== '2024') params.set('year', validatedData.year);
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
  const { user, golfers = [], sort, order, year } = loaderData;
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
    if (year !== 2025) params.set('year', year.toString());
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              to={getUrlWithCurrentParams('/foursomes')}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              ← Back to Foursomes
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Create New Foursome
          </h1>
          <p className="text-gray-600 mt-2">
            Set up a new foursome for a round
          </p>
        </div>

        <Card className="relative">
          {isSubmitting && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
              <div className="flex items-center gap-3">
                <Spinner size="lg" />
                <span className="text-lg font-medium text-gray-700">Creating foursome...</span>
              </div>
            </div>
          )}
          
          <CardContent className="p-6">
            <form method="post" className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="round" className="block text-sm font-medium text-gray-700 mb-2">
                    Round *
                  </label>
                  <select 
                    id="round"
                    name="round" 
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a round</option>
                    {Object.entries(roundLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
                    Course *
                  </label>
                  <select 
                    id="course"
                    name="course" 
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a course</option>
                    <option value="BLACK">Black</option>
                    <option value="SILVER">Silver</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                    Year *
                  </label>
                  <select 
                    id="year"
                    name="year" 
                    required
                    value={year}
                    onChange={(e) => {
                      const newYear = e.target.value;
                      const params = new URLSearchParams();
                      if (sort) params.set('sort', sort);
                      if (order) params.set('order', order);
                      params.set('year', newYear);
                      window.location.href = `/foursomes/new?${params.toString()}`;
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="teeTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Tee Time * <span className="text-xs font-normal text-gray-500">(Eastern Time)</span>
                </label>
                <Input 
                  id="teeTime"
                  name="teeTime" 
                  type="datetime-local" 
                  required
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  All tee times are in Eastern Time (ET)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="golfer1Id" className="block text-sm font-medium text-gray-700 mb-2">
                    Golfer 1
                  </label>
                  <select 
                    id="golfer1Id"
                    name="golfer1Id" 
                    value={selectedGolfers.golfer1Id}
                    onChange={(e) => handleGolferChange('golfer1Id', e.target.value)}
                    disabled={golfers.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select golfer</option>
                    {golfers.map((golfer: any) => (
                      <option 
                        key={golfer.id} 
                        value={golfer.id}
                        disabled={isGolferDisabled(golfer.id, 'golfer1Id')}
                      >
                        {golfer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="golfer2Id" className="block text-sm font-medium text-gray-700 mb-2">
                    Golfer 2
                  </label>
                  <select 
                    id="golfer2Id"
                    name="golfer2Id" 
                    value={selectedGolfers.golfer2Id}
                    onChange={(e) => handleGolferChange('golfer2Id', e.target.value)}
                    disabled={golfers.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select golfer</option>
                    {golfers.map((golfer: any) => (
                      <option 
                        key={golfer.id} 
                        value={golfer.id}
                        disabled={isGolferDisabled(golfer.id, 'golfer2Id')}
                      >
                        {golfer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="golfer3Id" className="block text-sm font-medium text-gray-700 mb-2">
                    Golfer 3
                  </label>
                  <select 
                    id="golfer3Id"
                    name="golfer3Id" 
                    value={selectedGolfers.golfer3Id}
                    onChange={(e) => handleGolferChange('golfer3Id', e.target.value)}
                    disabled={golfers.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select golfer</option>
                    {golfers.map((golfer: any) => (
                      <option 
                        key={golfer.id} 
                        value={golfer.id}
                        disabled={isGolferDisabled(golfer.id, 'golfer3Id')}
                      >
                        {golfer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="golfer4Id" className="block text-sm font-medium text-gray-700 mb-2">
                    Golfer 4
                  </label>
                  <select 
                    id="golfer4Id"
                    name="golfer4Id" 
                    value={selectedGolfers.golfer4Id}
                    onChange={(e) => handleGolferChange('golfer4Id', e.target.value)}
                    disabled={golfers.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select golfer</option>
                    {golfers.map((golfer: any) => (
                      <option 
                        key={golfer.id} 
                        value={golfer.id}
                        disabled={isGolferDisabled(golfer.id, 'golfer4Id')}
                      >
                        {golfer.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {golfers.length === 0 && (
                <p className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-md p-3">
                  No active golfers found for {year}. You need to add golfers for this year before creating foursomes. 
                  <Link to={`/scores?year=${year}`} className="underline hover:text-orange-800 ml-1">
                    Manage golfers for {year} here
                  </Link>
                </p>
              )}
              
              <div>
                <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-2">
                  Score (strokes above/below par)
                </label>
                <Input 
                  id="score"
                  name="score" 
                  type="number" 
                  placeholder="e.g., -2 (under par) or +5 (over par)"
                  defaultValue="0"
                  className="w-full"
                />
              </div>

              {actionData?.error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                  {actionData.error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isSubmitting || golfers.length === 0}>
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Spinner size="sm" />
                      Creating Foursome...
                    </div>
                  ) : (
                    'Create Foursome'
                  )}
                </Button>
                <Link to={getUrlWithCurrentParams('/foursomes')}>
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