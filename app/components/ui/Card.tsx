import React from 'react';
import { cn } from '../../lib/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /**
   * `accent` adds a visible border so callers passing border-COLOR-200 actually
   * render one. Previously Card had no `border` width class at all, so ~10 call
   * sites passing `border-brand-200` / `border-cyan-200` produced nothing.
   */
  variant?: 'default' | 'accent' | 'flat';
  /** Interactive cards get hover elevation; use for cards wrapped in a Link. */
  interactive?: boolean;
}

export function Card({ children, className, variant = 'default', interactive = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-card',
        variant === 'default' && 'shadow-card border border-gray-100',
        variant === 'accent' && 'shadow-card border',
        variant === 'flat' && 'border border-gray-200',
        interactive && 'transition-shadow hover:shadow-card-hover',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardSectionProps) {
  return (
    <div className={cn('px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200', className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardSectionProps) {
  // Tighter default padding on phones; nearly every call site was overriding
  // this with p-6 anyway, so the responsive default removes that need.
  return <div className={cn('px-4 py-4 sm:px-6', className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardSectionProps) {
  return (
    <div className={cn('px-4 py-3 sm:px-6 border-t border-gray-200', className)}>
      {children}
    </div>
  );
}
