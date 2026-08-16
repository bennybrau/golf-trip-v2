import { redirect } from 'react-router';
import { useNavigation } from 'react-router';
import { requireAuth } from '../lib/session';
import {
  PageLayout,
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  Button,
  Select,
  Label,
  ActionMessage,
} from '../components/ui';
import { CURRENT_YEAR, resolveYear } from '../lib/season';
import { getAvailableYears, previewRollover, runRollover } from '../lib/season.server';
import { prisma } from '../lib/db';
import type { Route } from './+types/admin.season';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Season Setup - Scaletta Golf Trip' },
    { name: 'description', content: 'Set up a new tournament season' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);

  if (!user.isAdmin) {
    throw redirect('/');
  }

  const url = new URL(request.url);
  const availableYears = await getAvailableYears();
  const targetYear = resolveYear(url.searchParams);

  const sourceParam = url.searchParams.get('source');
  const parsedSource = sourceParam ? Number.parseInt(sourceParam, 10) : NaN;
  const sourceYear = Number.isInteger(parsedSource) ? parsedSource : targetYear - 1;

  const includeInactive = url.searchParams.get('includeInactive') === 'true';

  const preview = await previewRollover(sourceYear, targetYear, includeInactive);

  // Surfaced so an admin can see at a glance whether the season is already set up.
  const targetRosterSize = await prisma.golferStatus.count({ where: { year: targetYear } });

  return {
    user,
    availableYears,
    targetYear,
    sourceYear,
    includeInactive,
    preview,
    targetRosterSize,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireAuth(request);

  if (!user.isAdmin) {
    throw new Response('Unauthorized', { status: 403 });
  }

  const formData = await request.formData();

  const targetYear = Number.parseInt(formData.get('targetYear') as string, 10);
  const sourceYear = Number.parseInt(formData.get('sourceYear') as string, 10);
  const includeInactive = formData.get('includeInactive') === 'on';
  const copyCabins = formData.get('copyCabins') === 'on';

  if (!Number.isInteger(targetYear) || !Number.isInteger(sourceYear)) {
    return { error: 'Both seasons must be valid years.' };
  }

  if (targetYear <= sourceYear) {
    return { error: 'The new season must be later than the season it copies from.' };
  }

  if (targetYear > CURRENT_YEAR + 1) {
    return {
      error: `Refusing to set up ${targetYear}; it is more than one season past ${CURRENT_YEAR}.`,
    };
  }

  try {
    const result = await runRollover(sourceYear, targetYear, { includeInactive, copyCabins });

    if (result.total === 0) {
      return { error: `No ${includeInactive ? '' : 'active '}golfers found on the ${sourceYear} roster.` };
    }

    const parts = [`Created ${result.created} roster ${result.created === 1 ? 'entry' : 'entries'} for ${targetYear}`];
    if (result.skipped > 0) {
      parts.push(`${result.skipped} already existed and ${result.skipped === 1 ? 'was' : 'were'} left unchanged`);
    }

    return { success: true, message: `${parts.join('; ')}.` };
  } catch (error) {
    console.error('Season rollover error:', error);
    return { error: 'Failed to set up the season. See server logs for details.' };
  }
}

export default function AdminSeason({ loaderData, actionData }: Route.ComponentProps) {
  const { user, availableYears, targetYear, sourceYear, includeInactive, preview, targetRosterSize } =
    loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  // Years that could serve as a source: anything with data, earlier than target.
  const sourceOptions = availableYears.filter((year) => year < targetYear);

  return (
    <PageLayout user={user} width="narrow">
      <PageHeader
        title="Season Setup"
        subtitle="Copy a roster forward to start a new tournament season"
      />

      <ActionMessage actionData={actionData} />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Set up {targetYear}</h2>
        </CardHeader>
        <CardContent className="py-5">
          <form method="post" className="space-y-6">
            <input type="hidden" name="targetYear" value={targetYear} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="sourceYear"
                name="sourceYear"
                label="Copy roster from"
                defaultValue={sourceYear}
              >
                {sourceOptions.length === 0 && (
                  <option value={targetYear - 1}>{targetYear - 1}</option>
                )}
                {sourceOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>

              <div className="space-y-1.5">
                <Label>New season</Label>
                <div className="px-3 py-2.5 min-h-11 flex items-center border border-gray-200 rounded-control bg-gray-50 text-gray-900 font-medium">
                  {targetYear}
                </div>
              </div>
            </div>

            <fieldset className="space-y-3">
              <legend className="sr-only">Options</legend>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="includeInactive"
                  defaultChecked={includeInactive}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700">
                  <span className="font-medium block">Include inactive golfers</span>
                  By default only golfers marked active in {sourceYear} are copied.
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="copyCabins"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700">
                  <span className="font-medium block">Copy cabin assignments</span>
                  Usually left off &mdash; cabins are reassigned each year, and copied assignments
                  look authoritative while being wrong.
                </span>
              </label>
            </fieldset>

            <div className="rounded-control border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <p className="font-medium text-gray-900 mb-1">What this will do</p>
              {preview.sourceRoster === 0 ? (
                <p>
                  No {includeInactive ? '' : 'active '}golfers found on the {sourceYear} roster, so
                  there is nothing to copy.
                </p>
              ) : (
                <p>
                  {preview.sourceRoster} golfer{preview.sourceRoster === 1 ? '' : 's'} on the{' '}
                  {sourceYear} roster; {preview.alreadyPresent} already set up for {targetYear}. This
                  will create <strong>{preview.willCreate}</strong> new roster{' '}
                  {preview.willCreate === 1 ? 'entry' : 'entries'}.
                </p>
              )}
              <p className="mt-2 text-gray-500">
                Safe to run more than once &mdash; golfers already on the {targetYear} roster are
                skipped, not duplicated. Foursomes and scores are never copied.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                disabled={preview.willCreate === 0}
                loading={isSubmitting}
                loadingText="Setting up..."
              >
                Set up {targetYear}
              </Button>
              {preview.willCreate === 0 && preview.sourceRoster > 0 && (
                <span className="text-sm text-gray-500">{targetYear} is already set up.</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="py-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{targetYear} roster</h2>
          <p className="text-sm text-gray-600">
            {targetRosterSize === 0 ? (
              <>
                No golfers are set up for {targetYear} yet. Until at least one golfer is on the
                roster, foursomes for this season cannot be created &mdash; the golfer pickers on the
                foursome form only offer golfers active in the selected season.
              </>
            ) : (
              <>
                {targetRosterSize} golfer{targetRosterSize === 1 ? '' : 's'} set up for {targetYear}.
                Manage individual golfers and cabin assignments from the{' '}
                <a href={`/scores?year=${targetYear}`} className="text-brand-700 underline">
                  scores page
                </a>
                .
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
