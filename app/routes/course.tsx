import { requireAuth } from '../lib/session';
import { PageLayout, PageHeader, Card, CardContent, Badge } from '../components/ui';
import { SWAN_LAKE, COURSES } from '../lib/course';
import type { Route } from './+types/course';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'The Course - Scaletta Golf Trip' },
    { name: 'description', content: 'Swan Lake Resort course information' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Static content; auth only so it matches the rest of the app.
  // Note: deliberately does NOT import app/lib/cloudflare.ts, whose singleton
  // throws at import time when its env vars are missing.
  const user = await requireAuth(request);
  return { user };
}

const courseList = [COURSES.BLACK, COURSES.SILVER];

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-control bg-gray-50 px-3 py-2 text-center">
      <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold text-gray-900 tabular-nums">{value}</dd>
    </div>
  );
}

export default function CoursePage({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <PageLayout user={user} width="form">
      <PageHeader
        title="The Course"
        subtitle={`${SWAN_LAKE.name} — ${SWAN_LAKE.city}, ${SWAN_LAKE.state}`}
      />

      <div className="space-y-6">
        {/* Resort details */}
        <Card>
          <CardContent className="py-5">
            <h2 className="text-lg font-semibold text-gray-900">{SWAN_LAKE.name}</h2>
            <p className="mt-1 text-sm text-gray-600">
              Two 18-hole championship courses, both designed by {COURSES.BLACK.designer} and
              opened in {COURSES.BLACK.opened}. All four rounds of the trip are played here.
            </p>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a
                    href={SWAN_LAKE.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-700 hover:text-brand-800 underline underline-offset-2"
                  >
                    {SWAN_LAKE.addressLine}
                    <br />
                    {SWAN_LAKE.city}, {SWAN_LAKE.state} {SWAN_LAKE.zip}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm">
                  <a
                    href={SWAN_LAKE.phoneHref}
                    className="text-brand-700 hover:text-brand-800 underline underline-offset-2"
                  >
                    {SWAN_LAKE.phone}
                  </a>
                </dd>
                <dt className="mt-3 text-xs uppercase tracking-wide text-gray-500">Website</dt>
                <dd className="mt-1 text-sm">
                  <a
                    href={SWAN_LAKE.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-700 hover:text-brand-800 underline underline-offset-2"
                  >
                    swanlakeresort.com
                  </a>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* The two courses */}
        {courseList.map((course) => (
          <Card key={course.name}>
            <CardContent className="py-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">{course.name}</h2>
                <Badge tone={course.label === 'Black' ? 'dark' : 'silver'}>{course.label}</Badge>
              </div>

              <p className="mt-2 text-sm text-gray-600">{course.description}</p>

              {/* 2-up on phones so the numbers stay readable at 390px. */}
              <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Par" value={course.par} />
                <Stat label="Yards" value={course.yardage.toLocaleString()} />
                <Stat label="Rating" value={course.rating.toFixed(1)} />
                <Stat label="Slope" value={course.slope} />
              </dl>
            </CardContent>
          </Card>
        ))}

        <p className="text-xs text-gray-500 text-center">
          Yardages are from the back tees. Ratings and slope per GolfLink and GolfPass.
        </p>
      </div>
    </PageLayout>
  );
}
