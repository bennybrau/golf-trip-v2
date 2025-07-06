import { useState, useEffect } from 'react';
import { Link, redirect } from 'react-router';
import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, Button, Input, Spinner } from '../components/ui';
import { prisma } from '../lib/db';
import { cloudflareImages } from '../lib/cloudflare';
import type { Route } from './+types/champions.new';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Add New Champion - Scaletta Golf" },
    { name: "description", content: "Add a new tournament champion" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    
    if (!user.isAdmin) {
      throw redirect('/champions');
    }
    
    // Get all golfers for the form
    const golfers = await prisma.golfer.findMany({
      orderBy: { name: 'asc' },
    });
    
    return { user, golfers };
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
  const year = parseInt(formData.get('year') as string);
  const golferId = formData.get('golferId') as string;
  const displayName = formData.get('displayName') as string;
  const motivation = formData.get('motivation') as string;
  const meaning = formData.get('meaning') as string;
  const lifeChange = formData.get('lifeChange') as string;
  const favoriteQuote = formData.get('favoriteQuote') as string;
  const file = formData.get('photo') as File;
  
  try {
    // Validate required fields
    if (!year || !golferId) {
      return { error: "Year and golfer are required" };
    }
    
    // Check if year already exists
    const existingChampion = await prisma.champion.findUnique({
      where: { year },
    });
    
    if (existingChampion) {
      return { error: `A champion already exists for year ${year}` };
    }
    
    // Check if golfer exists
    const golfer = await prisma.golfer.findUnique({
      where: { id: golferId },
    });
    
    if (!golfer) {
      return { error: "Selected golfer not found" };
    }
    
    let photoUrl = null;
    let cloudflareId = null;
    
    // Handle photo upload if provided
    if (file && file.size > 0) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        return { error: "Please select a valid image file" };
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return { error: "File size must be less than 10MB" };
      }
      
      // Upload to Cloudflare Images
      const uploadResult = await cloudflareImages.uploadImage(file);
      photoUrl = uploadResult.url;
      cloudflareId = uploadResult.id;
    }
    
    // Create champion record
    await prisma.champion.create({
      data: {
        year,
        golferId,
        displayName: displayName && displayName.trim() !== '' ? displayName : null,
        motivation: motivation && motivation.trim() !== '' ? motivation : null,
        meaning: meaning && meaning.trim() !== '' ? meaning : null,
        lifeChange: lifeChange && lifeChange.trim() !== '' ? lifeChange : null,
        favoriteQuote: favoriteQuote && favoriteQuote.trim() !== '' ? favoriteQuote : null,
        photoUrl,
        cloudflareId,
        createdBy: user.id,
      },
    });
    
    return redirect('/champions');
  } catch (error) {
    console.error('Champion add error:', error);
    return { error: "Failed to add champion" };
  }
}

export default function NewChampion({ loaderData, actionData }: Route.ComponentProps) {
  const { user, golfers = [] } = loaderData;
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
              to="/champions"
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              ← Back to Champions
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Add New Champion
          </h1>
          <p className="text-gray-600 mt-2">
            Create a new tournament champion record
          </p>
        </div>

        <Card className="relative">
          {isSubmitting && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
              <div className="flex items-center gap-3">
                <Spinner size="lg" />
                <span className="text-lg font-medium text-gray-700">Adding champion...</span>
              </div>
            </div>
          )}
          
          <CardContent className="p-6">
            <form method="post" encType="multipart/form-data" className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                    Tournament Year *
                  </label>
                  <Input 
                    id="year"
                    name="year" 
                    type="number" 
                    required
                    min="2000"
                    max="2030"
                    placeholder="2024"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="golferId" className="block text-sm font-medium text-gray-700 mb-2">
                    Champion Golfer *
                  </label>
                  <select 
                    id="golferId"
                    name="golferId" 
                    required
                    disabled={golfers.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {golfers.length === 0 ? "No golfers available" : "Select a golfer"}
                    </option>
                    {golfers.map((golfer) => (
                      <option key={golfer.id} value={golfer.id}>
                        {golfer.name}
                      </option>
                    ))}
                  </select>
                  {golfers.length === 0 && (
                    <p className="text-sm text-orange-600 mt-1">
                      You need to add golfers before creating champions. 
                      <Link to="/golfers" className="underline hover:text-orange-800">
                        Add golfers here
                      </Link>
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name (Optional)
                </label>
                <Input 
                  id="displayName"
                  name="displayName" 
                  type="text" 
                  placeholder="Leave blank to use golfer's name"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Override the golfer's name for display purposes (e.g., nickname, alternate name)
                </p>
              </div>

              {/* Q&A Section */}
              <div className="space-y-6 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900">Champion Questions (Optional)</h3>
                
                <div>
                  <label htmlFor="motivation" className="block text-sm font-medium text-gray-700 mb-2">
                    What was your motivation?
                  </label>
                  <textarea 
                    id="motivation"
                    name="motivation" 
                    rows={3}
                    placeholder="Share what motivated you during the tournament..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="meaning" className="block text-sm font-medium text-gray-700 mb-2">
                    What does becoming a champion mean to you?
                  </label>
                  <textarea 
                    id="meaning"
                    name="meaning" 
                    rows={3}
                    placeholder="Describe what this championship means to you..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="lifeChange" className="block text-sm font-medium text-gray-700 mb-2">
                    How has your life changed since winning?
                  </label>
                  <textarea 
                    id="lifeChange"
                    name="lifeChange" 
                    rows={3}
                    placeholder="Share how winning has impacted your life..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="favoriteQuote" className="block text-sm font-medium text-gray-700 mb-2">
                    What is your favorite quote?
                  </label>
                  <textarea 
                    id="favoriteQuote"
                    name="favoriteQuote" 
                    rows={2}
                    placeholder="Share a quote that inspires you..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-2">
                  Champion Photo (Optional)
                </label>
                <Input 
                  id="photo"
                  name="photo" 
                  type="file" 
                  accept="image/*"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JPG, PNG, GIF, WebP. Max size: 10MB
                </p>
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
                      Adding Champion...
                    </div>
                  ) : (
                    'Add Champion'
                  )}
                </Button>
                <Link to="/champions">
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