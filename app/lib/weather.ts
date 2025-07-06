interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export async function getWeatherForPlymouth(): Promise<WeatherData | null> {
  try {
    const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
    
    if (!API_KEY) {
      console.warn('OpenWeatherMap API key not found in environment variables');
      return null;
    }

    // Plymouth, IN coordinates
    const lat = 41.3436;
    const lon = -86.3103;
    
    const response = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`,
      { 
        headers: {
          'User-Agent': 'Golf Trip App'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      temperature: data.current.temp,
      condition: data.current.weather[0].main,
      description: data.current.weather[0].description,
      humidity: data.current.humidity,
      windSpeed: data.current.wind_speed,
      icon: data.current.weather[0].icon
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}