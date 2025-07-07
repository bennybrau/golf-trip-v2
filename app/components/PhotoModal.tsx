import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  caption?: string | null;
  category?: string | null;
}

interface PhotoModalProps {
  selectedPhoto: Photo | null;
  photos: Photo[];
  onClose: () => void;
  onSelectPhoto: (photo: Photo) => void;
}

export function PhotoModal({ selectedPhoto, photos, onClose, onSelectPhoto }: PhotoModalProps) {
  // Navigation functions
  const getCurrentPhotoIndex = () => {
    if (!selectedPhoto) return -1;
    return photos.findIndex((photo) => photo.id === selectedPhoto.id);
  };

  const goToPreviousPhoto = () => {
    const currentIndex = getCurrentPhotoIndex();
    if (currentIndex > 0) {
      onSelectPhoto(photos[currentIndex - 1]);
    }
  };

  const goToNextPhoto = () => {
    const currentIndex = getCurrentPhotoIndex();
    if (currentIndex < photos.length - 1) {
      onSelectPhoto(photos[currentIndex + 1]);
    }
  };

  const canGoToPrevious = getCurrentPhotoIndex() > 0;
  const canGoToNext = getCurrentPhotoIndex() < photos.length - 1;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPreviousPhoto();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNextPhoto();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    if (selectedPhoto) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedPhoto, photos]);

  if (!selectedPhoto) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <X size={32} />
      </button>

      {/* Previous button */}
      {canGoToPrevious && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPreviousPhoto();
          }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* Next button */}
      {canGoToNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNextPhoto();
          }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Image container */}
      <div className="max-w-4xl max-h-full relative">
        <img
          src={selectedPhoto.url}
          alt={selectedPhoto.caption || 'Golf trip photo'}
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        {selectedPhoto.caption && (
          <div className="bg-white p-4 text-center relative">
            <p className="text-gray-900">{selectedPhoto.caption}</p>
            {selectedPhoto.category && (
              <span className="inline-block mt-2 px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded">
                {selectedPhoto.category}
              </span>
            )}
            {/* Photo counter - positioned in caption area */}
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              {getCurrentPhotoIndex() + 1} of {photos.length}
            </div>
          </div>
        )}
        
        {/* Photo counter for images without captions */}
        {!selectedPhoto.caption && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
            {getCurrentPhotoIndex() + 1} of {photos.length}
          </div>
        )}
      </div>
    </div>
  );
}