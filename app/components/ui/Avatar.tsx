interface AvatarProps {
  src?: string;
  alt: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, alt, name, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-24 w-24 text-2xl',
  };

  const baseClasses = `rounded-full object-cover ${sizeClasses[size]} ${className}`.trim();

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={baseClasses}
      />
    );
  }

  return (
    <div className={`bg-gray-300 flex items-center justify-center ${baseClasses}`.trim()}>
      <span className="font-medium text-gray-600">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}