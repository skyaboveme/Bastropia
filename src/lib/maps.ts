/** Google Maps search link for a street address. Town-only text is not a destination. */
export function mapsSearchUrl(address?: string | null) {
  const value = (address || '').replace(/\s+/g, ' ').trim();
  if (value.length < 8) return '';
  if (/^(bastrop county|countywide|texas)$/i.test(value)) return '';
  const towns = /^(bastrop|elgin|smithville|cedar creek|mcdade|paige|rosanky|red rock|wyldwood|dale|camp swift)(,?\s*tx)?$/i;
  if (towns.test(value)) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
}

export function outboundLabel(url?: string | null) {
  if (!url) return 'Website';
  try {
    const host = new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
    if (host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.com' || host === 'fb.me' || host === 'm.facebook.com') {
      return 'Facebook';
    }
  } catch {
    return 'Website';
  }
  return 'Website';
}
