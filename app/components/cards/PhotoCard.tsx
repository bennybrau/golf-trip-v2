import { Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { Card, Button, Image, Badge, ConfirmButton } from '../ui';

interface PhotoCardProps {
  photo: {
    id: string;
    url: string;
    caption?: string | null;
    category?: string | null;
    year?: number | null;
    user: { name: string };
  };
  user: { isAdmin: boolean };
  setSelectedPhoto: (photo: any) => void;
}

export function PhotoCard({ photo, user, setSelectedPhoto }: PhotoCardProps) {
  return (
    <Card className="group relative overflow-hidden">
      <button
        type="button"
        onClick={() => setSelectedPhoto(photo)}
        className="block w-full aspect-square focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
        aria-label={photo.caption ? `View ${photo.caption}` : 'View photo'}
      >
        <Image
          src={photo.url}
          alt={photo.caption ?? ''}
          fallbackIcon="camera"
          className="h-full w-full object-cover"
        />
      </button>

      {user.isAdmin && (
        // Previously `opacity-0 group-hover:opacity-100`, which made edit and
        // delete completely UNREACHABLE on a touch device -- there is no hover.
        // Always visible below md; hover-revealed only where a pointer exists.
        // The scrim keeps the icons legible over light photos.
        <div className="absolute top-2 right-2 flex gap-1 rounded-control bg-black/40 p-1 backdrop-blur-sm transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <Link to={`/gallery/edit/${photo.id}`} onClick={(event) => event.stopPropagation()}>
            <Button variant="secondary" size="icon" aria-label="Edit photo">
              <Pencil size={16} />
            </Button>
          </Link>
          <ConfirmButton
            fields={{ _action: 'delete-photo', photoId: photo.id }}
            confirmTitle="Delete this photo?"
            confirmMessage="It will also be removed from Cloudflare."
            aria-label="Delete photo"
          >
            <Trash2 size={16} />
          </ConfirmButton>
        </div>
      )}

      {(photo.caption || photo.category || photo.year) && (
        <div className="p-3">
          {photo.caption && (
            <p className="text-sm text-gray-800 line-clamp-2">{photo.caption}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {photo.year && <Badge tone="brand">{photo.year}</Badge>}
            {photo.category && <Badge tone="neutral">{photo.category}</Badge>}
          </div>
        </div>
      )}
    </Card>
  );
}
