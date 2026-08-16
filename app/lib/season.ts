/**
 * Season (year) resolution.
 *
 * Trip data is scoped by year: GolferStatus, Foursome, Champion and Photo all
 * carry a `year`, and nearly every page is filtered by a `?year=` search param.
 * Before this module that default was the string '2025' hardcoded in six
 * loaders, with the "omit the param when it equals the default" rule spelled out
 * at seven more call sites.
 *
 * This file is PURE: no prisma, no process.env at module scope. It is imported
 * by components as well as loaders, and React Router's Vite plugin only strips
 * server code from `loader`/`action` exports -- a prisma import reachable from a
 * component would be bundled for the browser. Server-only helpers live in
 * ./season.server.ts.
 */

/**
 * The season the app defaults to.
 *
 * Deliberately an explicit constant rather than `new Date().getFullYear()`.
 * Deriving it would silently flip on January 1st to a year with an empty roster,
 * emptying every page with no human in the loop. The trip runs each September,
 * so bumping this one line per year is the correct trade.
 */
export const CURRENT_YEAR = 2026;

/** Earliest year the app will accept; predates the oldest champion (2020). */
const MIN_YEAR = 2015;

/** Guards against a typo'd URL creating a far-future season. */
const MAX_FUTURE_YEARS = 1;

/**
 * Resolves the season from a URL's search params.
 *
 * Unlike `sort` and `order`, the `year` param was previously unvalidated:
 * `?year=abc` became `parseInt('abc')` => NaN and reached Prisma as
 * `where: { year: NaN }`. This clamps to something sane in every case.
 *
 * @param availableYears Years the app knows about (see getAvailableYears). When
 *   provided, a well-formed but unknown year falls back to CURRENT_YEAR so a
 *   stale bookmark doesn't render a confusingly empty page.
 */
export function resolveYear(
  searchParams: URLSearchParams,
  availableYears?: readonly number[]
): number {
  const raw = searchParams.get('year');
  if (!raw) return CURRENT_YEAR;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed)) return CURRENT_YEAR;

  if (parsed < MIN_YEAR || parsed > CURRENT_YEAR + MAX_FUTURE_YEARS) {
    return CURRENT_YEAR;
  }

  if (availableYears?.length && !availableYears.includes(parsed)) {
    return CURRENT_YEAR;
  }

  return parsed;
}

/**
 * Adds `year` to a query string, omitting it when it matches the default.
 *
 * Keeps URLs clean for the common case and is the single home of that rule --
 * it was previously written out as `if (selectedYear !== 2025) ...` at seven
 * call sites, one of which compared against 2024 instead.
 */
export function appendYear(params: URLSearchParams, year: number): void {
  if (year !== CURRENT_YEAR) {
    params.set('year', String(year));
  } else {
    params.delete('year');
  }
}

/** Builds a path with the season applied, plus any extra params. */
export function yearHref(
  path: string,
  year: number,
  extra?: Record<string, string | undefined>
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (value != null && value !== '') params.set(key, value);
  }
  appendYear(params, year);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Formats a season for display, e.g. for headings and empty states. */
export function seasonLabel(year: number): string {
  return year === CURRENT_YEAR ? `${year} (current)` : String(year);
}
