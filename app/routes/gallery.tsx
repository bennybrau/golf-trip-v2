import { useState, useEffect } from 'react';
import { Link } from 'react-router';
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
  Pagination,
  ActionMessage,
  EmptyState,
} from '../components/ui';
import { PhotoCard } from '../components/cards';
import { PhotoModal } from '../components/PhotoModal';
import { prisma } from '../lib/db';
import { CURRENT_YEAR } from '../lib/season';
import { cloudflareImages } from '../lib/cloudflare';
import { z } from 'zod';
import type { Route } from './+types/gallery';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Photo Gallery - Scaletta Golf Trip" },
    { name: "description", content: "View photos from the golf trip" },
  ];
}


export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    const url = new URL(request.url);
    
    // Get pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const category = url.searchParams.get('category') || '';
    const pageSize = 20;
    const skip = (page - 1) * pageSize;
    
    // Year filter, enabled by Photo.year. 'ALL' shows every season;
    // 'UNSORTED' isolates photos whose year could not be determined.
    const yearParam = url.searchParams.get('galleryYear') || 'ALL';

    const whereClause: any = {};
    if (category && category !== 'ALL') whereClause.category = category;
    if (yearParam === 'UNSORTED') whereClause.year = null;
    else if (yearParam !== 'ALL') {
      const parsed = Number.parseInt(yearParam, 10);
      if (Number.isInteger(parsed)) whereClause.year = parsed;
    }
    
    // Get total count for pagination
    const totalPhotos = await prisma.photo.count({ where: whereClause });
    const totalPages = Math.ceil(totalPhotos / pageSize);
    
    // Fetch paginated photos
    const photos = await prisma.photo.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });
    
    // Get all unique categories for filtering (not paginated)
    const allPhotos = await prisma.photo.findMany({
      select: { category: true },
    });
    const categories = [...new Set(allPhotos.map(photo => photo.category).filter(Boolean))];

    // Seasons that actually have photos, plus a bucket for undated ones.
    const yearGroups = await prisma.photo.groupBy({ by: ['year'] });
    const photoYears = yearGroups
      .map((row) => row.year)
      .filter((year): year is number => year !== null)
      .sort((a, b) => b - a);
    const unsortedCount = await prisma.photo.count({ where: { year: null } });
    
    return { 
      user, 
      photos, 
      categories,
      pagination: {
        currentPage: page,
        totalPages,
        totalPhotos,
        pageSize,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      currentCategory: category || 'ALL',
      photoYears,
      unsortedCount,
      currentGalleryYear: yearParam,
    };
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
    let category = formData.get('category') as string;
    
    // If category is "custom", use the custom category input
    if (category === 'custom') {
      category = formData.get('customCategory') as string || '';
    }
    
    // Convert empty string to null to properly handle no category
    const categoryValue = category && category.trim() !== '' ? category : null;

    // Blank stays null ("unsorted") rather than guessing a season.
    const rawYear = formData.get('year') as string | null;
    const parsedYear = rawYear ? Number.parseInt(rawYear, 10) : NaN;
    const yearValue = Number.isInteger(parsedYear) ? parsedYear : null;

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
          category: categoryValue,
          year: yearValue,
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
  const { user, photos, categories, pagination, currentCategory, photoYears, unsortedCount, currentGalleryYear } =
    loaderData;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Photos are already filtered and paginated on the server
  const filteredPhotos = photos;

  const handleUploadSubmit = () => {
    setIsUploading(true);
    // Form will submit normally, loading state will be reset when page reloads
  };


  // Reset forms when action succeeds
  useEffect(() => {
    if (actionData?.success) {
      setIsFormOpen(false);
      setShowCustomCategory(false);
    }
  }, [actionData]);

  const galleryYearOptions = [
    { value: 'ALL', label: 'All years' },
    ...photoYears.map((year: number) => ({ value: String(year), label: String(year) })),
    ...(unsortedCount > 0
      ? [{ value: 'UNSORTED', label: `Unsorted (${unsortedCount})` }]
      : []),
  ];

  /** Builds a gallery URL preserving the other filter, resetting the page. */
  const filterHref = (overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    const category = overrides.category ?? currentCategory;
    const galleryYear = overrides.galleryYear ?? currentGalleryYear;
    if (category && category !== 'ALL') params.set('category', category);
    if (galleryYear && galleryYear !== 'ALL') params.set('galleryYear', galleryYear);
    const qs = params.toString();
    return qs ? `/gallery?${qs}` : '/gallery';
  };

  return (
    <PageLayout user={user}>
      <PageHeader
        title="Photos"
        subtitle={`${pagination.totalPhotos} photo${pagination.totalPhotos === 1 ? '' : 's'} from the trip`}
        actions={
          user.isAdmin ? (
            <Button onClick={() => setIsFormOpen(!isFormOpen)}>
              {isFormOpen ? 'Cancel' : 'Add Photo'}
            </Button>
          ) : undefined
        }
        controls={
          <>
            {/* Season filter, enabled by Photo.year. */}
            <div className="flex items-center gap-2">
              <label htmlFor="gallery-year" className="text-sm font-medium text-gray-700">
                Year:
              </label>
              <Select
                id="gallery-year"
                value={currentGalleryYear}
                onChange={(event) => {
                  window.location.href = filterHref({ galleryYear: event.target.value });
                }}
                className="w-auto"
              >
                {galleryYearOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Link to={filterHref({ category: 'ALL' })}>
                  <Button variant={currentCategory === 'ALL' ? 'primary' : 'secondary'} size="sm">
                    All
                  </Button>
                </Link>
                {categories.map((category) => (
                  <Link key={category} to={filterHref({ category: category || '' })}>
                    <Button
                      variant={currentCategory === category ? 'primary' : 'secondary'}
                      size="sm"
                    >
                      {category}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </>
        }
      />

      {user.isAdmin && isFormOpen && (
        <Card className="mb-6">
          <CardContent className="py-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add a photo</h2>

            <form
              method="post"
              encType="multipart/form-data"
              className="space-y-4"
              onSubmit={handleUploadSubmit}
            >
              <input type="hidden" name="_action" value="add-photo" />

              <Input
                id="file"
                name="file"
                type="file"
                label="Photo file"
                required
                accept="image/*"
                helperText="JPG, PNG, GIF or WebP. Max 10MB."
              />

              <Input id="caption" name="caption" type="text" label="Caption" placeholder="Optional" />

              <Select
                id="photo-year"
                name="year"
                label="Year"
                defaultValue={currentGalleryYear !== 'ALL' && currentGalleryYear !== 'UNSORTED' ? currentGalleryYear : ''}
                helperText="Which trip this photo is from."
              >
                <option value="">Unsorted</option>
                {photoYears.map((year: number) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
                {!photoYears.includes(CURRENT_YEAR) && (
                  <option value={CURRENT_YEAR}>{CURRENT_YEAR}</option>
                )}
              </Select>

              <Select
                id="category"
                name="category"
                label="Category"
                onChange={(event) => setShowCustomCategory(event.target.value === 'custom')}
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category} value={category || ''}>
                    {category}
                  </option>
                ))}
                <option value="custom">+ Add new category</option>
              </Select>

              {showCustomCategory && (
                <Input
                  id="customCategory"
                  name="customCategory"
                  type="text"
                  label="New category name"
                  required
                />
              )}

              <ActionMessage actionData={actionData} className="" />

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={isUploading} loadingText="Uploading...">
                  Add Photo
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!isFormOpen && <ActionMessage actionData={actionData} />}

      {filteredPhotos.length === 0 ? (
        <EmptyState
          icon="📷"
          title="No photos here"
          description={
            currentCategory === 'ALL' && currentGalleryYear === 'ALL'
              ? 'Add the first photo to start the gallery.'
              : 'Try a different year or category.'
          }
        />
      ) : (
        // 2-up on phones: a single full-width square per row made the gallery
        // extremely long to scroll.
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredPhotos.map((photo: any) => (
            <PhotoCard key={photo.id} photo={photo} user={user} setSelectedPhoto={setSelectedPhoto} />
          ))}
        </div>
      )}

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalPhotos}
        itemsPerPage={pagination.pageSize}
        basePath="/gallery"
        searchParams={
          new URLSearchParams({
            ...(currentCategory !== 'ALL' ? { category: currentCategory } : {}),
            ...(currentGalleryYear !== 'ALL' ? { galleryYear: currentGalleryYear } : {}),
          })
        }
        className="mt-8"
      />

      <PhotoModal
        selectedPhoto={selectedPhoto}
        photos={filteredPhotos}
        onClose={() => setSelectedPhoto(null)}
        onSelectPhoto={setSelectedPhoto}
      />
    </PageLayout>
  );
}
