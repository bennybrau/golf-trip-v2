import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, Button, Input, Spinner } from '../components/ui';
import { prisma } from '../lib/db';
import { cloudflareImages } from '../lib/cloudflare';
import type { Route } from './+types/champions';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Scaletta Golf - Champions" },
    { name: "description", content: "Past tournament champions" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    
    // Get all champions with golfer information
    const champions = await prisma.champion.findMany({
      include: {
        golfer: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { year: 'desc' },
    });
    
    // Get all golfers for the admin form
    const golfers = await prisma.golfer.findMany({
      orderBy: { name: 'asc' },
    });
    
    return { user, champions, golfers };
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
  const action = formData.get('_action') as string;
  
  if (action === 'add-champion') {
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
      
      return { success: true, message: 'Champion added successfully' };
    } catch (error) {
      console.error('Champion add error:', error);
      return { error: "Failed to add champion" };
    }
  }
  
  if (action === 'edit-champion') {
    const championId = formData.get('championId') as string;
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
      
      // Check if champion exists
      const existingChampion = await prisma.champion.findUnique({
        where: { id: championId },
      });
      
      if (!existingChampion) {
        return { error: "Champion not found" };
      }
      
      // Check if year already exists for a different champion
      const yearConflict = await prisma.champion.findFirst({
        where: { 
          year,
          id: { not: championId }
        },
      });
      
      if (yearConflict) {
        return { error: `A champion already exists for year ${year}` };
      }
      
      // Check if golfer exists
      const golfer = await prisma.golfer.findUnique({
        where: { id: golferId },
      });
      
      if (!golfer) {
        return { error: "Selected golfer not found" };
      }
      
      let photoUrl = existingChampion.photoUrl;
      let cloudflareId = existingChampion.cloudflareId;
      
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
        
        // Delete old photo from Cloudflare if exists
        if (existingChampion.cloudflareId) {
          try {
            await cloudflareImages.deleteImage(existingChampion.cloudflareId);
          } catch (cloudflareError) {
            console.warn('Failed to delete old photo from Cloudflare Images:', cloudflareError);
          }
        }
        
        // Upload new photo to Cloudflare Images
        const uploadResult = await cloudflareImages.uploadImage(file);
        photoUrl = uploadResult.url;
        cloudflareId = uploadResult.id;
      }
      
      // Update champion record
      await prisma.champion.update({
        where: { id: championId },
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
        },
      });
      
      return { success: true, message: 'Champion updated successfully' };
    } catch (error) {
      console.error('Champion edit error:', error);
      return { error: "Failed to update champion" };
    }
  }
  
  if (action === 'delete-champion') {
    const championId = formData.get('championId') as string;
    
    try {
      // Get champion from database
      const champion = await prisma.champion.findUnique({
        where: { id: championId },
      });

      if (!champion) {
        return { error: "Champion not found" };
      }

      // Try to delete from Cloudflare Images if photo exists
      if (champion.cloudflareId) {
        try {
          await cloudflareImages.deleteImage(champion.cloudflareId);
        } catch (cloudflareError) {
          console.warn('Failed to delete from Cloudflare Images:', cloudflareError);
          // Continue with database deletion even if Cloudflare fails
        }
      }
      
      // Delete from database
      await prisma.champion.delete({
        where: { id: championId },
      });
      
      return { success: true, message: 'Champion deleted successfully' };
    } catch (error) {
      console.error('Champion delete error:', error);
      return { error: "Failed to delete champion" };
    }
  }
  
  return { error: "Invalid action" };
}

export default function Champions({ loaderData, actionData }: Route.ComponentProps) {
  const { user, champions = [], golfers = [] } = loaderData;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingChampionId, setDeletingChampionId] = useState<string | null>(null);
  const [editingChampion, setEditingChampion] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = () => {
    setIsUploading(true);
    // Form will submit normally, loading state will be reset when page reloads
  };

  const handleEditSubmit = () => {
    setIsEditing(true);
    // Form will submit normally, loading state will be reset when page reloads
  };

  // Reset form when action succeeds
  useEffect(() => {
    if (actionData?.success) {
      setIsFormOpen(false);
      setIsUploading(false);
      setEditingChampion(null);
      setIsEditing(false);
    }
  }, [actionData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tournament Champions
              </h1>
              <p className="text-gray-600">
                Past winners of the annual golf tournament
              </p>
            </div>
            
            {/* Add Champion Button (Admin Only) */}
            {user.isAdmin && (
              <Button 
                onClick={() => setIsFormOpen(!isFormOpen)}
              >
                {isFormOpen ? 'Cancel' : 'Add Champion'}
              </Button>
            )}
          </div>
        </div>

        {/* Add Champion Form (Admin Only) */}
        {user.isAdmin && isFormOpen && (
          <Card className="mb-8 relative">
            {isUploading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Spinner size="lg" />
                  <span className="text-lg font-medium text-gray-700">Adding champion...</span>
                </div>
              </div>
            )}
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Add New Champion
              </h2>
              
              <form method="post" encType="multipart/form-data" className="space-y-4" onSubmit={handleSubmit}>
                <input type="hidden" name="_action" value="add-champion" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label htmlFor="golferId" className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
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
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900">Champion Questions (Optional)</h3>
                  
                  <div>
                    <label htmlFor="motivation" className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label htmlFor="meaning" className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label htmlFor="lifeChange" className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label htmlFor="favoriteQuote" className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">
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
                  <div className="text-red-600 text-sm">
                    {actionData.error}
                  </div>
                )}

                {actionData?.success && (
                  <div className="text-green-600 text-sm">
                    {actionData.message}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <Spinner size="sm" />
                        Adding...
                      </div>
                    ) : (
                      'Add Champion'
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={() => setIsFormOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Edit Champion Form (Admin Only) */}
        {user.isAdmin && editingChampion && (
          <Card className="mb-8 relative">
            {isEditing && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Spinner size="lg" />
                  <span className="text-lg font-medium text-gray-700">Updating champion...</span>
                </div>
              </div>
            )}
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Edit Champion
              </h2>
              
              <form method="post" encType="multipart/form-data" className="space-y-4" onSubmit={handleEditSubmit}>
                <input type="hidden" name="_action" value="edit-champion" />
                <input type="hidden" name="championId" value={editingChampion.id} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="editYear" className="block text-sm font-medium text-gray-700 mb-1">
                      Tournament Year *
                    </label>
                    <Input 
                      id="editYear"
                      name="year" 
                      type="number" 
                      required
                      min="2000"
                      max="2030"
                      defaultValue={editingChampion.year}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="editGolferId" className="block text-sm font-medium text-gray-700 mb-1">
                      Champion Golfer *
                    </label>
                    <select 
                      id="editGolferId"
                      name="golferId" 
                      required
                      defaultValue={editingChampion.golferId}
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
                  </div>
                </div>
                
                <div>
                  <label htmlFor="editDisplayName" className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name (Optional)
                  </label>
                  <Input 
                    id="editDisplayName"
                    name="displayName" 
                    type="text" 
                    defaultValue={editingChampion.displayName || ''}
                    placeholder="Leave blank to use golfer's name"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Override the golfer's name for display purposes (e.g., nickname, alternate name)
                  </p>
                </div>

                {/* Q&A Section */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900">Champion Questions (Optional)</h3>
                  
                  <div>
                    <label htmlFor="editMotivation" className="block text-sm font-medium text-gray-700 mb-1">
                      What was your motivation?
                    </label>
                    <textarea 
                      id="editMotivation"
                      name="motivation" 
                      rows={3}
                      defaultValue={editingChampion.motivation || ''}
                      placeholder="Share what motivated you during the tournament..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="editMeaning" className="block text-sm font-medium text-gray-700 mb-1">
                      What does becoming a champion mean to you?
                    </label>
                    <textarea 
                      id="editMeaning"
                      name="meaning" 
                      rows={3}
                      defaultValue={editingChampion.meaning || ''}
                      placeholder="Describe what this championship means to you..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="editLifeChange" className="block text-sm font-medium text-gray-700 mb-1">
                      How has your life changed since winning?
                    </label>
                    <textarea 
                      id="editLifeChange"
                      name="lifeChange" 
                      rows={3}
                      defaultValue={editingChampion.lifeChange || ''}
                      placeholder="Share how winning has impacted your life..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="editFavoriteQuote" className="block text-sm font-medium text-gray-700 mb-1">
                      What is your favorite quote?
                    </label>
                    <textarea 
                      id="editFavoriteQuote"
                      name="favoriteQuote" 
                      rows={2}
                      defaultValue={editingChampion.favoriteQuote || ''}
                      placeholder="Share a quote that inspires you..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="editPhoto" className="block text-sm font-medium text-gray-700 mb-1">
                    Champion Photo (Optional)
                  </label>
                  {editingChampion.photoUrl && (
                    <div className="mb-2">
                      <img
                        src={editingChampion.photoUrl}
                        alt="Current champion photo"
                        className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                      />
                      <p className="text-xs text-gray-500 mt-1">Current photo (will be replaced if you upload a new one)</p>
                    </div>
                  )}
                  <Input 
                    id="editPhoto"
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
                  <div className="text-red-600 text-sm">
                    {actionData.error}
                  </div>
                )}

                {actionData?.success && (
                  <div className="text-green-600 text-sm">
                    {actionData.message}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={isEditing}>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Spinner size="sm" />
                        Updating...
                      </div>
                    ) : (
                      'Update Champion'
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={() => setEditingChampion(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Champions List */}
        <div className="space-y-6">
          {champions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">
                  No champions recorded yet. Add the first champion to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            champions.map((champion) => (
              <Card key={champion.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Champion Photo */}
                    <div className="flex-shrink-0">
                      {champion.photoUrl ? (
                        <img
                          src={champion.photoUrl}
                          alt={`${champion.displayName || champion.golfer.name} - ${champion.year} Champion`}
                          className="w-48 h-48 object-cover rounded-lg border border-gray-300"
                          onError={(e) => {
                            // Fallback for broken images
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFBob3RvPC90ZXh0Pjwvc3ZnPg==';
                          }}
                        />
                      ) : (
                        <div className="w-48 h-48 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center">
                          <span className="text-gray-400 text-xs text-center">No Photo</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Champion Info */}
                    <div className="flex-grow">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">
                            {champion.year} Champion
                          </h3>
                          <h4 className="text-xl font-semibold text-green-600 mt-1">
                            {champion.displayName || champion.golfer.name}
                          </h4>
                          {champion.golfer.email && (
                            <p className="text-gray-600 mt-1">
                              {champion.golfer.email}
                            </p>
                          )}

                          {/* Q&A Section */}
                          {(champion.motivation || champion.meaning || champion.lifeChange || champion.favoriteQuote) && (
                            <div className="mt-6 space-y-4 border-t pt-4">
                              <h5 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                                Champion Q&A
                              </h5>
                              
                              {champion.motivation && (
                                <div>
                                  <h6 className="text-sm font-medium text-gray-700 mb-1">
                                    What was your motivation?
                                  </h6>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    {champion.motivation}
                                  </p>
                                </div>
                              )}

                              {champion.meaning && (
                                <div>
                                  <h6 className="text-sm font-medium text-gray-700 mb-1">
                                    What does becoming a champion mean to you?
                                  </h6>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    {champion.meaning}
                                  </p>
                                </div>
                              )}

                              {champion.lifeChange && (
                                <div>
                                  <h6 className="text-sm font-medium text-gray-700 mb-1">
                                    How has your life changed since winning?
                                  </h6>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    {champion.lifeChange}
                                  </p>
                                </div>
                              )}

                              {champion.favoriteQuote && (
                                <div>
                                  <h6 className="text-sm font-medium text-gray-700 mb-1">
                                    What is your favorite quote?
                                  </h6>
                                  <blockquote className="text-sm text-gray-600 italic border-l-4 border-green-500 pl-3">
                                    "{champion.favoriteQuote}"
                                  </blockquote>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Edit & Delete Buttons (Admin Only) */}
                        {user.isAdmin && (
                          <div className="flex gap-2">
                            {/* Edit Button */}
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setEditingChampion(champion)}
                            >
                              Edit
                            </Button>
                            
                            {/* Delete Button */}
                            <form 
                              method="post" 
                              className="inline"
                              onSubmit={(e) => {
                                if (!confirm(`Are you sure you want to delete the ${champion.year} champion record?`)) {
                                  e.preventDefault();
                                  return false;
                                }
                                setDeletingChampionId(champion.id);
                                return true;
                              }}
                            >
                            <input type="hidden" name="_action" value="delete-champion" />
                            <input type="hidden" name="championId" value={champion.id} />
                            <Button
                              type="submit"
                              variant="danger"
                              size="sm"
                              disabled={deletingChampionId === champion.id}
                            >
                              {deletingChampionId === champion.id ? (
                                <div className="flex items-center gap-1">
                                  <Spinner size="sm" />
                                  Deleting...
                                </div>
                              ) : (
                                'Delete'
                              )}
                            </Button>
                          </form>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}