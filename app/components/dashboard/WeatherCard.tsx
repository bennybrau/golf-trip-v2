import { SWAN_LAKE } from '../../lib/course';

interface WeatherCardProps {
  weather: {
    temperature: number;
    condition: string;
    description: string;
    humidity: number;
    windSpeed: number;
    icon: string;
  } | null;
  error?: string;
}

const WEATHER_EMOJI: Record<string, string> = {
  clear: '☀️',
  clouds: '☁️',
  rain: '🌧️',
  drizzle: '🌦️',
  thunderstorm: '⛈️',
  snow: '🌨️',
  mist: '🌫️',
  fog: '🌫️',
};

/**
 * Conditions at the course.
 *
 * Renders as a compact horizontal strip rather than a tall gradient tile: on a
 * phone this sits directly under the greeting, where a full-height card pushed
 * the actual dashboard content below the fold.
 *
 * Returns null when weather is unavailable -- getWeatherForPlymouth() yields
 * null without an API key, and an empty "Loading weather..." card that never
 * resolves is worse than no card.
 */
export function WeatherCard({ weather, error }: WeatherCardProps) {
  if (!weather && !error) return null;

  const emoji = weather ? WEATHER_EMOJI[weather.condition.toLowerCase()] ?? '🌤️' : '🌤️';

  return (
    <a
      href={SWAN_LAKE.website}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-card border border-sky-200 bg-sky-50 px-4 py-3 transition-shadow hover:shadow-card-hover"
    >
      {error || !weather ? (
        <p className="text-sm text-gray-600">Weather unavailable</p>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none shrink-0" aria-hidden="true">
            {emoji}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 tabular-nums">
                {Math.round(weather.temperature)}°F
              </span>
              <span className="text-sm text-gray-600 capitalize truncate">
                {weather.description}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              {SWAN_LAKE.city}, {SWAN_LAKE.state} &middot; {weather.humidity}% humidity &middot;{' '}
              {Math.round(weather.windSpeed)} mph wind
            </p>
          </div>
        </div>
      )}
    </a>
  );
}
