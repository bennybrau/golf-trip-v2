import React from 'react';
import { cn } from '../../lib/cn';
import { Navigation } from '../Navigation';
import type { User } from '../../lib/auth';

interface PageLayoutProps {
  user: User;
  children: React.ReactNode;
  /** Content width. `wide` for list pages, `form` for edit screens, `narrow` for account. */
  width?: 'wide' | 'form' | 'narrow';
  className?: string;
}

const widthClasses = {
  wide: 'max-w-7xl',
  form: 'max-w-4xl',
  narrow: 'max-w-3xl',
};

/**
 * The standard authenticated page shell.
 *
 * Replaces this markup, repeated verbatim in 20 route files:
 *   <div className="min-h-screen bg-gray-50">
 *     <Navigation user={user} />
 *     <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
 *
 * Two mobile fixes land here for every page at once: vertical padding drops from
 * a flat py-12 (48px of dead space above the fold on a phone) to py-6 sm:py-10,
 * and pb-safe keeps content clear of the home indicator in the installed PWA.
 */
export function PageLayout({ user, children, width = 'wide', className }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      <main
        className={cn(
          widthClasses[width],
          'mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-safe',
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Buttons or links rendered opposite the title. */
  actions?: React.ReactNode;
  /** Filter/sort controls rendered on their own row beneath the title. */
  controls?: React.ReactNode;
  className?: string;
}

/**
 * Page title block.
 *
 * The old markup was `flex items-center justify-between` with a text-3xl h1 and
 * an "Add X" button, with no wrapping and no breakpoint -- at 390px the heading
 * and button fought over ~358px and both got crushed. This stacks below `sm`.
 */
export function PageHeader({ title, subtitle, actions, controls, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 sm:mb-8', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-balance">{title}</h1>
          {subtitle && <p className="mt-1 text-sm sm:text-base text-gray-600">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {controls && <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">{controls}</div>}
    </div>
  );
}
