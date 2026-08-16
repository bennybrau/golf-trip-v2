import { Link } from 'react-router';
import { requireAuth } from '../lib/session';
import { PageLayout, Card, CardContent, Badge, EmptyState, YearSelect, Button } from '../components/ui';
import { WeatherCard, ChampionCard, StatCard, ScoreValue } from '../components/dashboard';
import { InstallPromptSimple } from '../components/InstallPromptSimple';
import { prisma } from '../lib/db';
import { getWeatherForPlymouth } from '../lib/weather';
import { resolveYear } from '../lib/season';
import { getAvailableYears } from '../lib/season.server';
import { formatTeeTimeDisplay } from '../lib/timeUtils';
import { COURSE_LABELS, ROUND_LABELS } from '../lib/course';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home - Scaletta Golf Trip" },
    { name: "description", content: "Your golf trip dashboard" },
  ];
}

/** Round order for display; enum order is not guaranteed to be chronological. */
const ROUND_ORDER = [
  'FRIDAY_MORNING',
  'FRIDAY_AFTERNOON',
  'SATURDAY_MORNING',
  'SATURDAY_AFTERNOON',
] as const;

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);

  const url = new URL(request.url);
  const availableYears = await getAvailableYears();
  const selectedYear = resolveYear(url.searchParams, availableYears);

  const [userWithGolfer, weather, currentChampion] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      include: {
        golfer: {
          include: {
            yearlyStatus: { where: { year: selectedYear } },
            foursomesAsPlayer1: { where: { year: selectedYear } },
            foursomesAsPlayer2: { where: { year: selectedYear } },
            foursomesAsPlayer3: { where: { year: selectedYear } },
            foursomesAsPlayer4: { where: { year: selectedYear } },
          },
        },
      },
    }),
    getWeatherForPlymouth(),
    prisma.champion.findUnique({
      where: { year: selectedYear },
      include: { golfer: { select: { name: true } } },
    }),
  ]);

  const golfer = userWithGolfer?.golfer ?? null;

  // A golfer's rounds are spread across four denormalized player columns, so
  // every "my rounds" question means unioning four relations.
  const myFoursomes = golfer
    ? [
        ...golfer.foursomesAsPlayer1,
        ...golfer.foursomesAsPlayer2,
        ...golfer.foursomesAsPlayer3,
        ...golfer.foursomesAsPlayer4,
      ].sort((a, b) => new Date(a.teeTime).getTime() - new Date(b.teeTime).getTime())
    : [];

  const totalScore = myFoursomes.length
    ? myFoursomes.reduce((sum, f) => sum + f.score, 0)
    : null;

  // Tournament leader: same team-score-per-member model as /scores, so the
  // leaderboard here and there cannot disagree.
  const rosterWithRounds = await prisma.golfer.findMany({
    where: { yearlyStatus: { some: { year: selectedYear, isActive: true } } },
    include: {
      foursomesAsPlayer1: { where: { year: selectedYear }, select: { score: true } },
      foursomesAsPlayer2: { where: { year: selectedYear }, select: { score: true } },
      foursomesAsPlayer3: { where: { year: selectedYear }, select: { score: true } },
      foursomesAsPlayer4: { where: { year: selectedYear }, select: { score: true } },
    },
  });

  const standings = rosterWithRounds
    .map((g) => {
      const rounds = [
        ...g.foursomesAsPlayer1,
        ...g.foursomesAsPlayer2,
        ...g.foursomesAsPlayer3,
        ...g.foursomesAsPlayer4,
      ];
      return {
        name: g.name,
        total: rounds.length ? rounds.reduce((s, r) => s + r.score, 0) : null,
        rounds: rounds.length,
      };
    })
    .filter((g) => g.total !== null)
    .sort((a, b) => (a.total as number) - (b.total as number));

  const leader = standings[0] ?? null;

  const nextTeeTime =
    myFoursomes.find((f) => new Date(f.teeTime).getTime() >= Date.now()) ?? null;

  return {
    user,
    golfer: golfer ? { id: golfer.id, name: golfer.name, email: golfer.email, phone: golfer.phone } : null,
    cabin: golfer?.yearlyStatus[0]?.cabin ?? null,
    onRoster: Boolean(golfer?.yearlyStatus.length),
    myFoursomes,
    totalScore,
    leader,
    nextTeeTime,
    weather,
    selectedYear,
    availableYears,
    currentChampion,
    rosterSize: rosterWithRounds.length,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const {
    user,
    golfer,
    cabin,
    onRoster,
    myFoursomes,
    totalScore,
    leader,
    nextTeeTime,
    weather,
    selectedYear,
    availableYears,
    currentChampion,
    rosterSize,
  } = loaderData;

  const displayName = golfer?.name ?? user.name;

  return (
    <PageLayout user={user}>
      <InstallPromptSimple />

      {/* Header. Stacks on phones; weather sits beside the greeting only when
          there is room for it. */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-balance">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            {selectedYear} trip at Swan Lake Resort
          </p>
          <div className="mt-3">
            <YearSelect years={availableYears} value={selectedYear} />
          </div>
        </div>
        <div className="w-full lg:w-80 lg:shrink-0">
          <WeatherCard weather={weather} />
        </div>
      </div>

      {/* Stat tiles. 2-up on phones so the numbers stay legible at 390px. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          label="Your score"
          tone="blue"
          icon="🏌️"
          value={<ScoreValue score={totalScore} />}
          hint={
            !golfer
              ? 'No golfer profile'
              : myFoursomes.length
                ? `${myFoursomes.length} round${myFoursomes.length === 1 ? '' : 's'}`
                : 'No rounds yet'
          }
          to="/scores"
        />
        <StatCard
          label="Leader"
          tone="amber"
          icon="🏆"
          value={leader ? leader.name.split(' ')[0] : '—'}
          hint={leader ? `${leader.total! > 0 ? '+' : ''}${leader.total === 0 ? 'E' : leader.total}` : 'No scores yet'}
          to="/scores"
        />
        <StatCard
          label="Your cabin"
          tone="brand"
          icon="🏠"
          value={cabin ?? '—'}
          hint={cabin ? `Cabin ${cabin}` : onRoster ? 'Not assigned' : `Not on ${selectedYear} roster`}
        />
        <StatCard
          label="Next tee time"
          tone="violet"
          icon="⏰"
          value={nextTeeTime ? formatTeeTimeDisplay(nextTeeTime.teeTime) : '—'}
          hint={nextTeeTime ? ROUND_LABELS[nextTeeTime.round as keyof typeof ROUND_LABELS] : 'Nothing scheduled'}
          to="/foursomes"
        />
      </div>

      <div className="mb-4 sm:mb-6">
        <ChampionCard champion={currentChampion} />
      </div>

      {/* Your rounds for the season -- the "foursomes for each day" view. */}
      <section aria-labelledby="my-rounds" className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 id="my-rounds" className="text-lg font-semibold text-gray-900">
            Your rounds
          </h2>
          <Link
            to={`/foursomes${selectedYear ? `?year=${selectedYear}` : ''}`}
            className="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            All foursomes →
          </Link>
        </div>

        {myFoursomes.length === 0 ? (
          <EmptyState
            icon="⛳"
            title={golfer ? `No rounds scheduled for ${selectedYear}` : 'No golfer profile linked'}
            description={
              golfer
                ? rosterSize === 0
                  ? `The ${selectedYear} roster hasn't been set up yet.`
                  : 'Your foursomes will appear here once they are scheduled.'
                : 'Ask an admin to link your account to a golfer so your scores and tee times show up.'
            }
            action={
              user.isAdmin && rosterSize === 0 ? (
                <Link to="/admin/season">
                  <Button size="sm">Set up {selectedYear}</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {[...myFoursomes]
              .sort(
                (a, b) =>
                  ROUND_ORDER.indexOf(a.round as (typeof ROUND_ORDER)[number]) -
                  ROUND_ORDER.indexOf(b.round as (typeof ROUND_ORDER)[number])
              )
              .map((foursome) => (
                <li key={foursome.id}>
                  <Card>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {ROUND_LABELS[foursome.round as keyof typeof ROUND_LABELS]}
                          </p>
                          <p className="mt-0.5 text-sm text-gray-600">
                            {formatTeeTimeDisplay(foursome.teeTime)}
                          </p>
                          <div className="mt-2">
                            <Badge tone={foursome.course === 'BLACK' ? 'dark' : 'silver'}>
                              {COURSE_LABELS[foursome.course as keyof typeof COURSE_LABELS]}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xl font-bold tabular-nums">
                            <ScoreValue score={foursome.score} />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">team score</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
          </ul>
        )}
      </section>

      {golfer && (
        <Card variant="flat">
          <CardContent className="py-4">
            <p className="text-sm text-gray-600">
              Playing as <span className="font-medium text-gray-900">{golfer.name}</span>
              {golfer.email && <> &middot; {golfer.email}</>}
            </p>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}
