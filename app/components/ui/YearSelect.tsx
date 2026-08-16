import { useSearchParams } from 'react-router';
import { CURRENT_YEAR } from '../../lib/season';
import { Select } from './Select';

interface YearSelectProps {
  /** Seasons to offer, newest first (see getAvailableYears). */
  years: readonly number[];
  /** The currently selected season. */
  value: number;
  /** Visible label; set to null to render the select on its own. */
  label?: string | null;
  className?: string;
}

/**
 * Season picker.
 *
 * Replaces three hand-rolled `<select>` blocks that hardcoded 2024/2025/2026 and
 * navigated with `window.location.href`, which triggered a full document reload,
 * discarded scroll position and bypassed the route transition indicator. This
 * uses the router, and preserves any other params already on the URL (sort,
 * order, page, category) instead of dropping them.
 */
export function YearSelect({ years, value, label = 'Year', className = '' }: YearSelectProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Guarantee the active season is selectable even if it is not in `years` --
  // otherwise the control would silently display the wrong value.
  const options = years.includes(value) ? years : [value, ...years];

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextYear = Number.parseInt(event.target.value, 10);

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextYear === CURRENT_YEAR) {
          next.delete('year');
        } else {
          next.set('year', String(nextYear));
        }
        // Any year change invalidates the current page of a paginated list.
        next.delete('page');
        return next;
      },
      { preventScrollReset: true }
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      {label && (
        <label htmlFor="season-select" className="text-sm font-medium text-gray-800">
          {label}:
        </label>
      )}
      <Select
        id="season-select"
        value={value}
        onChange={handleChange}
        aria-label="Season"
        className="w-auto"
      >
        {options.map((year) => (
          <option key={year} value={year}>
            {year}
            {year === CURRENT_YEAR ? ' (current)' : ''}
          </option>
        ))}
      </Select>
    </div>
  );
}
