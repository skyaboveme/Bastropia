/**
 * Moon phase for the Right now header. The math follows the SunCalc / Meeus
 * approximation: ecliptic sun and moon, then the illuminated fraction and the
 * phase angle. It uses the absolute instant, so America/Chicago only matters
 * when a caller picks which moment to read.
 */

const PI = Math.PI;
const RAD = PI / 180;
const DAY_MS = 86_400_000;
const J1970 = 2_440_588;
const J2000 = 2_451_545;
const OBLIQUITY = RAD * 23.4397;

export type MoonPhaseName =
  | 'New moon'
  | 'Waxing crescent'
  | 'First quarter'
  | 'Waxing gibbous'
  | 'Full moon'
  | 'Waning gibbous'
  | 'Last quarter'
  | 'Waning crescent';

export type MoonReading = {
  /** 0 at new moon, 0.5 at full moon, 1 at the next new moon. */
  phase: number;
  /** Lit fraction, 0 to 1. */
  fraction: number;
  /** Whole percent, 0 to 100. */
  percent: number;
  name: MoonPhaseName;
  /** True while the bright limb is growing (light on the right, as seen from Bastrop). */
  waxing: boolean;
  /** SVG path of the lit portion inside a 32×32 disk centered at 16,16 with radius 13. */
  litPath: string;
  label: string;
  aria: string;
};

function toDays(date: Date) {
  return date.valueOf() / DAY_MS - 0.5 + J1970 - J2000;
}

function solarMeanAnomaly(days: number) {
  return RAD * (357.5291 + 0.98560028 * days);
}

function eclipticLongitude(anomaly: number) {
  const center =
    RAD * (1.9148 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly) + 0.0003 * Math.sin(3 * anomaly));
  const perihelion = RAD * 102.9372;
  return anomaly + center + perihelion + PI;
}

function rightAscension(longitude: number, latitude: number) {
  return Math.atan2(
    Math.sin(longitude) * Math.cos(OBLIQUITY) - Math.tan(latitude) * Math.sin(OBLIQUITY),
    Math.cos(longitude),
  );
}

function declination(longitude: number, latitude: number) {
  return Math.asin(
    Math.sin(latitude) * Math.cos(OBLIQUITY) + Math.cos(latitude) * Math.sin(OBLIQUITY) * Math.sin(longitude),
  );
}

function sunCoords(days: number) {
  const longitude = eclipticLongitude(solarMeanAnomaly(days));
  return { dec: declination(longitude, 0), ra: rightAscension(longitude, 0) };
}

function moonCoords(days: number) {
  const ecliptic = RAD * (218.316 + 13.176396 * days);
  const anomaly = RAD * (134.963 + 13.064993 * days);
  const node = RAD * (93.272 + 13.22935 * days);
  const longitude = ecliptic + RAD * 6.289 * Math.sin(anomaly);
  const latitude = RAD * 5.128 * Math.sin(node);
  const distance = 385001 - 20905 * Math.cos(anomaly);
  return {
    ra: rightAscension(longitude, latitude),
    dec: declination(longitude, latitude),
    dist: distance,
  };
}

/** Illuminated fraction (0–1) and phase (0–1, new → full → new). */
export function moonIllumination(date: Date) {
  const days = toDays(date);
  const sun = sunCoords(days);
  const moon = moonCoords(days);
  const phi = Math.acos(
    Math.sin(sun.dec) * Math.sin(moon.dec) +
      Math.cos(sun.dec) * Math.cos(moon.dec) * Math.cos(sun.ra - moon.ra),
  );
  const sunDistance = 149_598_000;
  const inc = Math.atan2(sunDistance * Math.sin(phi), moon.dist - sunDistance * Math.cos(phi));
  const angle = Math.atan2(
    Math.cos(sun.dec) * Math.sin(sun.ra - moon.ra),
    Math.sin(sun.dec) * Math.cos(moon.dec) - Math.cos(sun.dec) * Math.sin(moon.dec) * Math.cos(sun.ra - moon.ra),
  );
  return {
    fraction: (1 + Math.cos(inc)) / 2,
    phase: 0.5 + (0.5 * inc * (angle < 0 ? -1 : 1)) / PI,
    angle,
  };
}

export function moonPhaseName(phase: number, fraction: number): MoonPhaseName {
  if (fraction < 0.02) return 'New moon';
  if (fraction > 0.98) return 'Full moon';
  const waxing = phase < 0.5;
  if (fraction > 0.47 && fraction < 0.53) return waxing ? 'First quarter' : 'Last quarter';
  if (waxing) return fraction < 0.5 ? 'Waxing crescent' : 'Waxing gibbous';
  return fraction > 0.5 ? 'Waning gibbous' : 'Waning crescent';
}

/**
 * Lit portion of a 32×32 moon. Waxing light sits on the right, which is how
 * the moon looks from Bastrop.
 */
export function moonLitPath(phase: number) {
  const cx = 16;
  const cy = 16;
  const radius = 13;
  const waxing = phase < 0.5;
  const across = waxing ? phase * 2 : (1 - phase) * 2;
  const bow = Math.cos(across * Math.PI) * radius;
  const top = `${cx},${cy - radius}`;
  const bottom = `${cx},${cy + radius}`;
  const curve = Math.abs(bow).toFixed(3);
  if (waxing) {
    const sweep = bow > 0 ? 0 : 1;
    return `M ${top} A ${radius} ${radius} 0 0 1 ${bottom} A ${curve} ${radius} 0 0 ${sweep} ${top} Z`;
  }
  const sweep = bow > 0 ? 1 : 0;
  return `M ${top} A ${radius} ${radius} 0 0 0 ${bottom} A ${curve} ${radius} 0 0 ${sweep} ${top} Z`;
}

export function moonReading(date = new Date()): MoonReading {
  const { phase, fraction } = moonIllumination(date);
  const name = moonPhaseName(phase, fraction);
  const percent = Math.round(fraction * 100);
  const waxing = phase < 0.5;
  return {
    phase,
    fraction,
    percent,
    name,
    waxing,
    litPath: moonLitPath(phase),
    label: `${name} · ${percent}%`,
    aria: `Moon: ${name}, ${percent}% illuminated`,
  };
}
