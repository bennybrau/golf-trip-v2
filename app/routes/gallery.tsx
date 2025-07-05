import { useState } from 'react';
import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, Button, Input, Spinner } from '../components/ui';
import { prisma } from '../lib/db';
import { cloudflareImages } from '../lib/cloudflare';
import { z } from 'zod';
import type { Route } from './+types/gallery';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Scaletta Golf - Photo Gallery" },
    { name: "description", content: "View photos from the golf trip" },
  ];
}

const PhotoSchema = z.object({
  file: z.instanceof(File).optional(),
  caption: z.string().optional(),
  category: z.string().optional(),
});

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    
    // Fetch photos from database
    const photos = await prisma.photo.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Get unique categories for filtering
    const categories = [...new Set(photos.map(photo => photo.category).filter(Boolean))];
    
    return { user, photos, categories };
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
  
  if (action === 'add-photo') {
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string || undefined;
    let category = formData.get('category') as string || undefined;
    
    // If category is "custom", use the custom category input
    if (category === 'custom') {
      category = formData.get('customCategory') as string || undefined;
    }

    try {
      // Validate file
      if (!file || file.size === 0) {
        return { error: "Please select a file to upload" };
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        return { error: "Please select a valid image file" };
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return { error: "File size must be less than 10MB" };
      }

      // Upload to Cloudflare Images
      const { id: cloudflareId, url } = await cloudflareImages.uploadImage(file);
      
      // Save to database
      await prisma.photo.create({
        data: {
          cloudflareId,
          url,
          caption,
          category,
          createdBy: user.id,
        },
      });
      
      return { success: true, message: 'Photo uploaded successfully' };
    } catch (error) {
      console.error('Photo upload error:', error);
      if (error instanceof z.ZodError) {
        return { error: error.errors[0].message };
      }
      return { error: "Failed to upload photo" };
    }
  }

  if (action === 'delete-photo') {
    const photoId = formData.get('photoId') as string;
    
    try {
      // Get photo from database
      const photo = await prisma.photo.findUnique({
        where: { id: photoId },
      });

      if (!photo) {
        return { error: "Photo not found" };
      }

      // Try to delete from Cloudflare Images first, but don't fail if it errors
      try {
        await cloudflareImages.deleteImage(photo.cloudflareId);
      } catch (cloudflareError) {
        console.warn('Failed to delete from Cloudflare Images:', cloudflareError);
        // Continue with database deletion even if Cloudflare fails
      }
      
      // Always delete from database
      await prisma.photo.delete({
        where: { id: photoId },
      });
      
      return { success: true, message: 'Photo deleted successfully' };
    } catch (error) {
      console.error('Photo delete error:', error);
      return { error: "Failed to delete photo from database" };
    }
  }
  
  return { error: "Invalid action" };
}

export default function Gallery({ loaderData, actionData }: Route.ComponentProps) {
  const { user, photos, categories } = loaderData;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  const filteredPhotos = selectedCategory === 'ALL' 
    ? photos 
    : photos.filter(photo => photo.category === selectedCategory);

  const handleUploadSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setIsUploading(true);
    // Form will submit normally, loading state will be reset when page reloads
  };

  const handleDeleteClick = (photoId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this photo?')) {
      setDeletingPhotoId(photoId);
      // Form will submit normally, loading state will be reset when page reloads
    } else {
      event.preventDefault();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Photo Gallery
          </h1>
          
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === 'ALL' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory('ALL')}
              >
                All Photos
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedCategory(category || '')}
                >
                  {category}
                </Button>
              ))}
            </div>
            
            {/* Add Photo Button (Admin Only) */}
            {user.isAdmin && (
              <Button 
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="mb-6"
              >
                {isFormOpen ? 'Cancel' : 'Add Photo'}
              </Button>
            )}
          </div>
        </div>

        {/* Add Photo Form (Admin Only) */}
        {user.isAdmin && isFormOpen && (
          <Card className="mb-8 relative">
            {isUploading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Spinner size="lg" />
                  <span className="text-lg font-medium text-gray-700">Uploading photo...</span>
                </div>
              </div>
            )}
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Add New Photo
              </h2>
              
              <form method="post" encType="multipart/form-data" className="space-y-4" onSubmit={handleUploadSubmit}>
                <input type="hidden" name="_action" value="add-photo" />
                
                <div>
                  <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
                    Photo File *
                  </label>
                  <Input 
                    id="file"
                    name="file" 
                    type="file" 
                    required
                    accept="image/*"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: JPG, PNG, GIF, WebP. Max size: 10MB
                  </p>
                </div>
                
                <div>
                  <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">
                    Caption
                  </label>
                  <Input 
                    id="caption"
                    name="caption" 
                    type="text" 
                    placeholder="Photo description"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select 
                    id="category"
                    name="category" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    onChange={(e) => setShowCustomCategory(e.target.value === 'custom')}
                  >
                    <option value="">No category</option>
                    {categories.map((category) => (
                      <option key={category} value={category || ''}>{category}</option>
                    ))}
                    <option value="custom">+ Add new category</option>
                  </select>
                </div>

                {showCustomCategory && (
                  <div>
                    <label htmlFor="customCategory" className="block text-sm font-medium text-gray-700 mb-1">
                      New Category Name
                    </label>
                    <Input 
                      id="customCategory"
                      name="customCategory" 
                      type="text" 
                      placeholder="Enter new category name"
                      className="w-full"
                      required
                    />
                  </div>
                )}

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
                        Uploading...
                      </div>
                    ) : (
                      'Add Photo'
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

        {/* Photo Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">
                    {selectedCategory === 'ALL' 
                      ? 'No photos found. Add your first photo to get started!' 
                      : `No photos found in the "${selectedCategory}" category.`
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredPhotos.map((photo: any) => (
              <div
                key={photo.id}
                className="relative group"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div 
                    className="aspect-square cursor-pointer"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Golf trip photo'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback for broken images
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                      }}
                    />
                  </div>
                  
                  {/* Delete button (Admin only) */}
                  {user.isAdmin && (
                    <form method="post" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <input type="hidden" name="_action" value="delete-photo" />
                      <input type="hidden" name="photoId" value={photo.id} />
                      <Button
                        type="submit"
                        variant="danger"
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white"
                        disabled={deletingPhotoId === photo.id}
                        onClick={(e) => handleDeleteClick(photo.id, e)}
                      >
                        {deletingPhotoId === photo.id ? (
                          <Spinner size="sm" className="border-white border-t-red-200" />
                        ) : (
                          '×'
                        )}
                      </Button>
                    </form>
                  )}
                  
                  {(photo.caption || photo.category) && (
                    <CardContent className="p-3">
                      {photo.caption && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {photo.caption}
                        </p>
                      )}
                      {photo.category && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {photo.category}
                        </span>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        By {photo.user.name}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </div>
            ))
          )}
        </div>

        {/* Photo Modal */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="max-w-4xl max-h-full">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || 'Golf trip photo'}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              {selectedPhoto.caption && (
                <div className="bg-white p-4 text-center">
                  <p className="text-gray-900">{selectedPhoto.caption}</p>
                  {selectedPhoto.category && (
                    <span className="inline-block mt-2 px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded">
                      {selectedPhoto.category}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}