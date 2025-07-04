import { LandPlot } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-24 w-24',
  };

  const iconSizes = {
    sm: 20,
    md: 32,
    lg: 48,
  };

  return (
    <div className={`bg-green-600 rounded-full flex items-center justify-center ${sizeClasses[size]} ${className}`.trim()}>
      <LandPlot size={iconSizes[size]} color='white' />
    </div>
  );
}