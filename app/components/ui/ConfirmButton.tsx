import React, { useState } from 'react';
import { useFetcher } from 'react-router';
import { cn } from '../../lib/cn';
import { Button } from './Button';

interface ConfirmButtonProps {
  /** Hidden form fields posted with the request, e.g. { _action, golferId }. */
  fields: Record<string, string>;
  /** Confirmation copy shown before the action runs. */
  confirmTitle: string;
  confirmMessage?: string;
  confirmLabel?: string;
  /** Trigger contents -- usually an icon. */
  children: React.ReactNode;
  'aria-label': string;
  variant?: 'danger' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'icon';
  className?: string;
  /** Route the post targets; defaults to the current route. */
  action?: string;
}

/**
 * Destructive action with inline confirmation.
 *
 * Replaces five `window.confirm()` call sites. Two reasons beyond appearance:
 *
 * 1. window.confirm blocks the main thread and cannot be styled or made
 *    accessible; on iOS standalone PWAs it renders as a jarring system sheet.
 * 2. It used to be paired with a `deletingXId` useState lifted into the ROUTE
 *    and threaded down as two props (`deletingId`, `setDeletingId`) to each of
 *    GolferCard, FoursomeCard, UserCard and PhotoCard. With useFetcher the
 *    pending state is local, so four routes lose a useState and four card
 *    components lose two props each.
 *
 * Using a fetcher also means the delete no longer causes a full navigation, so
 * scroll position is preserved in long lists.
 */
export function ConfirmButton({
  fields,
  confirmTitle,
  confirmMessage,
  confirmLabel = 'Delete',
  children,
  variant = 'danger',
  size = 'icon',
  className,
  action,
  ...rest
}: ConfirmButtonProps) {
  const fetcher = useFetcher();
  const [confirming, setConfirming] = useState(false);
  const isPending = fetcher.state !== 'idle';

  if (!confirming) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setConfirming(true)}
        className={className}
        aria-label={rest['aria-label']}
      >
        {children}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-control border border-red-200 bg-red-50 p-3',
        'sm:flex-row sm:items-center sm:gap-3'
      )}
      role="alertdialog"
      aria-label={confirmTitle}
    >
      <div className="min-w-0 text-sm">
        <p className="font-medium text-red-900">{confirmTitle}</p>
        {confirmMessage && <p className="text-red-700">{confirmMessage}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        <fetcher.Form method="post" action={action}>
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <Button
            type="submit"
            variant="danger"
            size="sm"
            loading={isPending}
            loadingText="Deleting..."
          >
            {confirmLabel}
          </Button>
        </fetcher.Form>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
