import { Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, Button, Spinner } from '../ui';

interface PhotoCardProps {
  photo: {
    id: string;
    url: string;
    caption?: string | null;
    category?: string | null;
    user: {
      name: string;
    };
  };
  user: {
    isAdmin: boolean;
  };
  deletingPhotoId: string | null;
  setSelectedPhoto: (photo: any) => void;
  setEditingPhoto: (photo: any) => void;
  setShowEditCustomCategory: (show: boolean) => void;
  setDeletingPhotoId: (id: string | null) => void;
}

export function PhotoCard({
  photo,
  user,
  deletingPhotoId,
  setSelectedPhoto,
  setEditingPhoto,
  setShowEditCustomCategory,
  setDeletingPhotoId
}: PhotoCardProps) {
  return (
    <div className="relative group">
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
        
        {/* Admin buttons (Edit & Delete) */}
        {user.isAdmin && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            {/* Edit button */}
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="bg-green-500 hover:bg-green-600 text-white border border-white shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                setEditingPhoto(photo);
                setShowEditCustomCategory(false);
              }}
            >
              <Pencil size={16} />
            </Button>
            
            {/* Delete button */}
            <form 
              method="post" 
              className="inline"
              onSubmit={(e) => {
                e.stopPropagation();
                if (!confirm('Are you sure you want to delete this photo?')) {
                  e.preventDefault();
                  return false;
                }
                setDeletingPhotoId(photo.id);
                return true;
              }}
            >
              <input type="hidden" name="_action" value="delete-photo" />
              <input type="hidden" name="photoId" value={photo.id} />
              <Button
                type="submit"
                variant="danger"
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white border border-white shadow-md"
                disabled={deletingPhotoId === photo.id}
                onClick={(e) => e.stopPropagation()}
              >
                {deletingPhotoId === photo.id ? (
                  <Spinner size="sm" className="border-white border-t-red-200" />
                ) : (
                  <Trash2 size={16} />
                )}
              </Button>
            </form>
          </div>
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
  );
}