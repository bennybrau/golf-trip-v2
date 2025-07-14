import { useState, useEffect } from 'react';
import { ImageIcon, Camera } from 'lucide-react';
import { Spinner } from './Spinner';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackIcon?: 'image' | 'camera';
  showLoadingSpinner?: boolean;
  className?: string;
}

export function Image({ 
  src, 
  alt, 
  fallbackIcon = 'image',
  showLoadingSpinner = true,
  className = '',
  ...props 
}: ImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset loading state when src changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    
    // Create a new image to test loading
    const img = new window.Image();
    img.onload = () => {
      setIsLoading(false);
      setHasError(false);
    };
    img.onerror = () => {
      setIsLoading(false);
      setHasError(true);
    };
    img.src = src;
    
    // If image is already cached, it might be complete immediately
    if (img.complete) {
      if (img.naturalHeight !== 0) {
        setIsLoading(false);
        setHasError(false);
      } else {
        setIsLoading(false);
        setHasError(true);
      }
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const FallbackIcon = fallbackIcon === 'camera' ? Camera : ImageIcon;

  if (hasError) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <FallbackIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-xs text-gray-500">Image not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && showLoadingSpinner && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <Spinner size="md" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        {...props}
      />
    </div>
  );
}