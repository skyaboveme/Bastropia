export const forecastTowns = {
  Bastrop: { latitude: 30.1105, longitude: -97.3153 },
  Elgin: { latitude: 30.3499, longitude: -97.3705 },
  Smithville: { latitude: 30.0086, longitude: -97.1594 },
  'Cedar Creek': { latitude: 30.0838, longitude: -97.4945 },
  McDade: { latitude: 30.2827, longitude: -97.2386 },
} as const;

export type TownName = keyof typeof forecastTowns;

export type DailyForecast = {
  date: string;
  high: number;
  low: number;
  code: number;
  rain: number;
};

export type Forecast = {
  town: TownName;
  temp: number;
  feels: number;
  humidity: number;
  wind: number;
  code: number;
  daily: DailyForecast[];
};

export type WeatherAlert = {
  event: string;
  headline: string;
  severity: string;
  ends: string | null;
};

const cache = new Map<string, { at: number; value: Forecast }>();
let alertCache: { at: number; value: WeatherAlert[] } | null = null;

export function weatherLabel(code: number) {
  if (code === 0) return 'Clear';
  if (code === 1) return 'Mostly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorms';
  return 'Forecast';
}

export function isTown(value: string | null): value is TownName {
  return Boolean(value && value in forecastTowns);
}

export async function getForecast(town: TownName): Promise<Forecast | null> {
  const hit = cache.get(town);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.value;
  const place = forecastTowns[town];
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(place.latitude));
  url.searchParams.set('longitude', String(place.longitude));
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
  );
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max');
  url.searchParams.set('timezone', 'America/Chicago');
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('temperature_unit', 'fahrenheit');
  url.searchParams.set('wind_speed_unit', 'mph');
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) return hit?.value ?? null;
    const data = await response.json();
    const forecast: Forecast = {
      town,
      temp: Math.round(data.current.temperature_2m),
      feels: Math.round(data.current.apparent_temperature),
      humidity: Math.round(data.current.relative_humidity_2m),
      wind: Math.round(data.current.wind_speed_10m),
      code: data.current.weather_code,
      daily: data.daily.time.map((date: string, index: number) => ({
        date,
        high: Math.round(data.daily.temperature_2m_max[index]),
        low: Math.round(data.daily.temperature_2m_min[index]),
        code: data.daily.weather_code[index],
        rain: data.daily.precipitation_probability_max[index] ?? 0,
      })),
    };
    cache.set(town, { at: Date.now(), value: forecast });
    return forecast;
  } catch {
    return hit?.value ?? null;
  }
}

export async function getAlerts(): Promise<WeatherAlert[] | null> {
  if (alertCache && Date.now() - alertCache.at < 10 * 60 * 1000) return alertCache.value;
  try {
    const response = await fetch('https://api.weather.gov/alerts/active?zone=TXC021', {
      headers: {
        Accept: 'application/geo+json',
        'User-Agent': 'Bastropia/1.0 (Bastrop County community site)',
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return alertCache?.value ?? null;
    const data = await response.json();
    const alerts: WeatherAlert[] = (data.features ?? []).slice(0, 6).map((feature: { properties: WeatherAlert & { ends?: string } }) => ({
      event: feature.properties.event,
      headline: feature.properties.headline,
      severity: feature.properties.severity,
      ends: feature.properties.ends ?? null,
    }));
    alertCache = { at: Date.now(), value: alerts };
    return alerts;
  } catch {
    return alertCache?.value ?? null;
  }
}
