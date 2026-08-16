import { cn } from '../../lib/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      // Colors are defaults rather than hardcoded: cn() lets a caller pass
      // border-t-white and have it actually replace the default instead of
      // relying on CSS source order to win.
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-gray-600',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
