/** Town centers used when a listing has no street coordinates, and when Nearest has no device location. */
export const directoryTownCenters: Record<string, { lat: number; lng: number }> = {
  Bastrop: { lat: 30.1105, lng: -97.3153 },
  Elgin: { lat: 30.3499, lng: -97.3705 },
  Smithville: { lat: 30.0086, lng: -97.1594 },
  'Cedar Creek': { lat: 30.0838, lng: -97.4945 },
  McDade: { lat: 30.2827, lng: -97.2386 },
  Paige: { lat: 30.2129, lng: -97.1258 },
  Rosanky: { lat: 29.9324, lng: -97.3239 },
  'Red Rock': { lat: 29.9458, lng: -97.4433 },
  Wyldwood: { lat: 30.1305, lng: -97.4731 },
  Dale: { lat: 30.0866, lng: -97.5625 },
  'Camp Swift': { lat: 30.185, lng: -97.295 },
};

export function directoryTownCenter(town: string) {
  return directoryTownCenters[town] || null;
}

/** Device location, then the selected town, then Bastrop when neither is available. */
export function nearestPlace(town: string, user?: { lat: number; lng: number } | null) {
  if (user && Number.isFinite(user.lat) && Number.isFinite(user.lng)) return user;
  if (town && town !== 'Countywide') {
    const center = directoryTownCenter(town);
    if (center) return center;
  }
  return directoryTownCenters.Bastrop;
}
