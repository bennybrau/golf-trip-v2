/**
 * Swan Lake Resort course reference data.
 *
 * Static content -- deliberately not a database model. The trip has been at the
 * same resort every year and the Prisma `Course` enum already encodes the only
 * two options, so a table would add a migration and a join for data that changes
 * roughly never.
 *
 * Figures sourced from GolfLink and GolfPass listings (both courses, Aug 2026).
 * Yardages are from the back tees. If the resort re-rates a course, these are
 * the only lines that need editing.
 */

import type { Course } from '@prisma/client';

export const SWAN_LAKE = {
  name: 'Swan Lake Resort',
  addressLine: '5203 Plymouth LaPorte Trail',
  city: 'Plymouth',
  state: 'IN',
  zip: '46563',
  phone: '574-935-5680',
  phoneHref: 'tel:+15749355680',
  website: 'https://www.swanlakeresort.com',
  mapsUrl: 'https://maps.google.com/?q=Swan+Lake+Resort,+5203+Plymouth+LaPorte+Trail,+Plymouth,+IN+46563',
  /** Used by the weather card; kept here so the location lives in one place. */
  coordinates: { lat: 41.3436, lon: -86.3103 },
  timezone: 'America/New_York',
} as const;

export interface CourseInfo {
  name: string;
  /** Short human label used wherever the raw enum used to be printed. */
  label: string;
  par: number;
  yardage: number;
  rating: number;
  slope: number;
  holes: number;
  designer: string;
  opened: number;
  description: string;
}

export const COURSES: Record<Course, CourseInfo> = {
  BLACK: {
    name: 'Black Course',
    label: 'Black',
    par: 72,
    yardage: 6950,
    rating: 72.8,
    slope: 127,
    holes: 18,
    designer: 'Al Humphrey',
    opened: 1970,
    description:
      'The longer of the two championship layouts, playing 6,950 yards from the tips. Water and mature trees come into play across a flat-to-rolling routing.',
  },
  SILVER: {
    name: 'Silver Course',
    label: 'Silver',
    par: 72,
    yardage: 6942,
    rating: 72.4,
    slope: 129,
    holes: 18,
    designer: 'Al Humphrey',
    opened: 1970,
    description:
      'Nearly the same length as the Black at 6,942 yards, but rated slightly tougher for the average player — the highest slope of the two at 129.',
  },
};

/**
 * Display labels for the Prisma `Course` enum.
 *
 * FoursomeCard and both foursome forms previously rendered the raw enum value,
 * so cards literally read "BLACK" and "SILVER" in shouting caps.
 */
export const COURSE_LABELS: Record<Course, string> = {
  BLACK: COURSES.BLACK.label,
  SILVER: COURSES.SILVER.label,
};

/** Round labels, previously redefined in four separate files. */
export const ROUND_LABELS = {
  FRIDAY_MORNING: 'Friday Morning',
  FRIDAY_AFTERNOON: 'Friday Afternoon',
  SATURDAY_MORNING: 'Saturday Morning',
  SATURDAY_AFTERNOON: 'Saturday Afternoon',
} as const;
