import { Card, CardContent } from '../ui';

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

export function WeatherCard({ weather, error }: WeatherCardProps) {
  const getWeatherEmoji = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return '☀️';
      case 'clouds':
        return '☁️';
      case 'rain':
        return '🌧️';
      case 'drizzle':
        return '🌦️';
      case 'thunderstorm':
        return '⛈️';
      case 'snow':
        return '🌨️';
      case 'mist':
      case 'fog':
        return '🌫️';
      default:
        return '🌤️';
    }
  };

  return (
    <a 
      href="https://swanlakeresort.com" 
      target="_blank" 
      rel="noopener noreferrer"
      className="block"
    >
      <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-cyan-600 mb-1 hover:underline">
                Swan Lake Resort
              </h3>
              <p className="text-xs text-cyan-500 mb-2">Plymouth, IN</p>
            {error ? (
              <div className="text-sm text-red-600">
                Unable to load weather
              </div>
            ) : weather ? (
              <div>
                <div className="text-3xl font-bold text-cyan-900 mb-1">
                  {Math.round(weather.temperature)}°F
                </div>
                <p className="text-xs text-cyan-700 capitalize">
                  {weather.description}
                </p>
                <div className="mt-2 text-xs text-cyan-600 space-y-1">
                  <div>Humidity: {weather.humidity}%</div>
                  <div>Wind: {Math.round(weather.windSpeed)} mph</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Loading weather...
              </div>
            )}
          </div>
          <div className="text-cyan-400 text-3xl">
            {weather ? getWeatherEmoji(weather.condition) : '🌤️'}
          </div>
        </div>
      </CardContent>
    </Card>
    </a>
  );
}