import React from 'react';
import { Card, CardContent } from './Card';

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Emoji or icon element shown above the title. */
  icon?: React.ReactNode;
  /** Primary call to action, e.g. an "Add Golfer" button. */
  action?: React.ReactNode;
}

/**
 * Replaces six copies of:
 *   <Card><CardContent className="p-8 text-center">
 *     <p className="text-gray-500">No X found...
 *
 * Adds room for an action, so an empty list can point at the thing that fills it
 * rather than being a dead end.
 */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-10 px-6 text-center">
        {icon && <div className="text-4xl mb-3" aria-hidden="true">{icon}</div>}
        <p className="text-base font-medium text-gray-900">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-gray-500 max-w-prose mx-auto">{description}</p>
        )}
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </CardContent>
    </Card>
  );
}
