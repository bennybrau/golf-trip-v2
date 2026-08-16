import { Link, useSearchParams } from 'react-router';
import { cn } from '../../lib/cn';

export interface SortOption {
  /** Value written to ?sort= */
  value: string;
  label: string;
}

interface SortChipsProps {
  options: readonly SortOption[];
  currentSort: string;
  currentOrder: string;
  /** Sort that is implied when ?sort= is absent, so it can be omitted from URLs. */
  defaultSort: string;
  className?: string;
}

/**
 * Sort controls.
 *
 * Consolidates a chip class string repeated 7 times plus a getSortUrl/getSortIcon
 * pair that was copy-pasted into golfers.tsx, foursomes.tsx and scores.tsx.
 *
 * Mobile fixes: the row previously had no flex-wrap, so "Sort by: Name Score
 * Rounds" overflowed horizontally at 390px. It now wraps, and each chip clears
 * the 44px touch target. Preserves all other search params (notably ?year=)
 * rather than rebuilding the query string from scratch.
 */
export function SortChips({
  options,
  currentSort,
  currentOrder,
  defaultSort,
  className,
}: SortChipsProps) {
  const [searchParams] = useSearchParams();

  function hrefFor(sortValue: string) {
    const next = new URLSearchParams(searchParams);
    const nextOrder = currentSort === sortValue && currentOrder === 'asc' ? 'desc' : 'asc';

    if (sortValue === defaultSort) next.delete('sort');
    else next.set('sort', sortValue);

    if (nextOrder === 'asc') next.delete('order');
    else next.set('order', nextOrder);

    next.delete('page');
    const qs = next.toString();
    return qs ? `?${qs}` : '?';
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-sm font-medium text-gray-700">Sort by:</span>
      {options.map((option) => {
        const active = currentSort === option.value;
        return (
          <Link
            key={option.value}
            to={hrefFor(option.value)}
            preventScrollReset
            aria-label={`Sort by ${option.label}${active ? `, currently ${currentOrder === 'asc' ? 'ascending' : 'descending'}` : ''}`}
            className={cn(
              'inline-flex items-center gap-1 rounded-control border px-3 py-2 text-sm min-h-11 transition-colors',
              active
                ? 'border-brand-300 bg-brand-50 text-brand-800 font-medium'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            )}
          >
            {option.label}
            {/* U+FE0E forces text presentation. Without it macOS/iOS render
                these arrows as colour emoji, which showed up as blue boxes. */}
            <span aria-hidden="true" className="text-xs opacity-70">
              {active ? (currentOrder === 'asc' ? '↑︎' : '↓︎') : '↕︎'}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
