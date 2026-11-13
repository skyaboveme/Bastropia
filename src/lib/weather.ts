export const forecastTowns = {
  Bastrop: { latitude: 30.1105, longitude: -97.3153, grid: 'EWX/172,84' },
  Elgin: { latitude: 30.3499, longitude: -97.3705, grid: 'EWX/170,94' },
  Smithville: { latitude: 30.0086, longitude: -97.1594, grid: 'EWX/178,79' },
  'Cedar Creek': { latitude: 30.0838, longitude: -97.4945, grid: 'EWX/165,83' },
  McDade: { latitude: 30.2827, longitude: -97.2386, grid: 'EWX/175,91' },
  Paige: { latitude: 30.2129, longitude: -97.1258, grid: 'EWX/179,88' },
} as const;

export type TownName = keyof typeof forecastTowns;

export type DailyForecast = {
  date: string;
  high: number;
  low: number;
  code: number;
  /** Chance of rain, 0–100. */
  rain: number;
  /** Forecast amount for the day, in inches. */
  inches: number;
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

const nwsHeaders = {
  Accept: 'application/geo+json',
  'User-Agent': 'Bastropia/1.0 (https://bastropia.com; weather@bastropia.com)',
};

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

export function rainAmount(inches: number) {
  if (!Number.isFinite(inches) || inches < 0.01) return '0 in';
  if (inches < 0.1) return `${inches.toFixed(2)} in`;
  return `${inches.toFixed(1)} in`;
}

function roundInches(inches: number) {
  if (!Number.isFinite(inches) || inches <= 0) return 0;
  return Math.round(inches * 100) / 100;
}

function inchesByDay(values: { validTime?: string; value?: number | null }[]) {
  const byDay = new Map<string, number>();
  for (const item of values) {
    const start = item.validTime?.split('/')[0];
    if (!start) continue;
    const date = chicagoDate(start);
    const mm = Number(item.value) || 0;
    byDay.set(date, (byDay.get(date) ?? 0) + mm);
  }
  const inches = new Map<string, number>();
  for (const [date, mm] of byDay) inches.set(date, roundInches(mm / 25.4));
  return inches;
}

/** Rough WMO-style code from an NWS short forecast phrase. */
function codeFromPhrase(text: string) {
  const t = text.toLowerCase();
  if (/thunder|t-?storm/.test(t)) return 95;
  if (/snow|sleet|ice/.test(t)) return 71;
  if (/shower/.test(t)) return 80;
  if (/drizzle/.test(t)) return 51;
  if (/rain|precip/.test(t)) return 63;
  if (/fog|mist|haze/.test(t)) return 45;
  if (/overcast/.test(t)) return 3;
  if (/mostly cloudy|considerable cloud/.test(t)) return 3;
  if (/partly cloudy|partly sunny|mostly sunny|mostly clear/.test(t)) return 2;
  if (/cloud/.test(t)) return 3;
  if (/sunny|clear|fair/.test(t)) return 0;
  return 1;
}

function windMph(value: string) {
  const match = value.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function chicagoDate(iso: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date(iso));
}

type NwsPeriod = {
  startTime: string;
  isDaytime: boolean;
  temperature: number;
  shortForecast: string;
  windSpeed?: string;
  relativeHumidity?: { value?: number | null };
  probabilityOfPrecipitation?: { value?: number | null };
  dewpoint?: { value?: number | null };
};

async function nwsJson(url: string) {
  const response = await fetch(url, {
    headers: nwsHeaders,
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`NWS ${response.status}`);
  return response.json();
}

async function forecastFromNws(town: TownName): Promise<Forecast> {
  const { grid } = forecastTowns[town];
  const [hourlyPayload, dailyPayload] = await Promise.all([
    nwsJson(`https://api.weather.gov/gridpoints/${grid}/forecast/hourly`),
    nwsJson(`https://api.weather.gov/gridpoints/${grid}/forecast`),
  ]);

  const hourly = (hourlyPayload.properties?.periods ?? []) as NwsPeriod[];
  const periods = (dailyPayload.properties?.periods ?? []) as NwsPeriod[];
  const now = hourly[0];
  if (!now) throw new Error('NWS hourly empty');

  let amounts = new Map<string, number>();
  try {
    const gridPayload = await nwsJson(`https://api.weather.gov/gridpoints/${grid}`);
    amounts = inchesByDay(gridPayload.properties?.quantitativePrecipitation?.values ?? []);
  } catch {
    /* The chance of rain still stands when the amount is missing. */
  }

  const byDay = new Map<string, DailyForecast>();
  for (const period of periods) {
    const date = chicagoDate(period.startTime);
    const rain = period.probabilityOfPrecipitation?.value ?? 0;
    const existing = byDay.get(date);
    if (!existing) {
      byDay.set(date, {
        date,
        high: period.temperature,
        low: period.temperature,
        code: codeFromPhrase(period.shortForecast),
        rain,
        inches: amounts.get(date) ?? 0,
      });
      continue;
    }
    if (period.isDaytime) {
      existing.high = Math.max(existing.high, period.temperature);
      existing.code = codeFromPhrase(period.shortForecast);
      existing.rain = Math.max(existing.rain, rain);
    } else {
      existing.low = Math.min(existing.low, period.temperature);
      existing.rain = Math.max(existing.rain, rain);
    }
  }

  const humidity = Math.round(now.relativeHumidity?.value ?? 0);
  const dewC = now.dewpoint?.value;
  const feels =
    dewC == null
      ? now.temperature
      : Math.round(now.temperature - Math.max(0, (humidity - 40) / 4));

  return {
    town,
    temp: Math.round(now.temperature),
    feels,
    humidity,
    wind: windMph(now.windSpeed ?? '0'),
    code: codeFromPhrase(now.shortForecast),
    daily: [...byDay.values()].slice(0, 7),
  };
}

async function forecastFromOpenMeteo(town: TownName): Promise<Forecast> {
  const place = forecastTowns[town];
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(place.latitude));
  url.searchParams.set('longitude', String(place.longitude));
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
  );
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum');
  url.searchParams.set('timezone', 'America/Chicago');
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('temperature_unit', 'fahrenheit');
  url.searchParams.set('wind_speed_unit', 'mph');
  url.searchParams.set('precipitation_unit', 'inch');
  const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
  const data = await response.json();
  return {
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
      inches: roundInches(Number(data.daily.precipitation_sum?.[index]) || 0),
    })),
  };
}

export async function getForecast(town: TownName): Promise<Forecast | null> {
  const hit = cache.get(town);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.value;

  // NWS first: Open-Meteo is often unreachable from Cloudflare Workers.
  for (const loader of [forecastFromNws, forecastFromOpenMeteo]) {
    try {
      const forecast = await loader(town);
      cache.set(town, { at: Date.now(), value: forecast });
      return forecast;
    } catch {
      /* try the next source */
    }
  }

  return hit?.value ?? null;
}

export async function getAlerts(): Promise<WeatherAlert[] | null> {
  if (alertCache && Date.now() - alertCache.at < 10 * 60 * 1000) return alertCache.value;
  try {
    const response = await fetch('https://api.weather.gov/alerts/active?zone=TXC021', {
      headers: nwsHeaders,
      signal: AbortSignal.timeout(8000),
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
