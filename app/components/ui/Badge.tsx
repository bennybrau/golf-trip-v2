import React from 'react';
import { cn } from '../../lib/cn';

type BadgeTone = 'neutral' | 'brand' | 'info' | 'warning' | 'danger' | 'dark' | 'silver';

interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
  title?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-gray-100 text-gray-700 ring-gray-200',
  brand: 'bg-brand-100 text-brand-800 ring-brand-200',
  info: 'bg-blue-100 text-blue-800 ring-blue-200',
  warning: 'bg-amber-100 text-amber-800 ring-amber-200',
  danger: 'bg-red-100 text-red-800 ring-red-200',
  // Course identities: Swan Lake's two courses are literally named Black and Silver.
  dark: 'bg-gray-800 text-white ring-gray-700',
  silver: 'bg-slate-200 text-slate-800 ring-slate-300',
};

/**
 * One badge to replace four hand-rolled pills that each picked their own radius
 * and padding: the course badge (FoursomeCard), the Admin pill (UserCard), the
 * Inactive pill (ScoreCard) and the photo category chip (PhotoCard).
 */
export function Badge({ children, tone = 'neutral', className, title }: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-xs font-medium ring-1 ring-inset whitespace-nowrap',
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
