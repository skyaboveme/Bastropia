/** Display helpers for the cattle page. Counts are head. Money is dollars. */

export function formatHead(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    const millions = value / 1_000_000;
    const digits = abs >= 10_000_000 ? 1 : 2;
    return `${millions.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })} million`;
  }
  return Math.round(value).toLocaleString('en-US');
}

export function formatExactHead(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return Math.round(value).toLocaleString('en-US');
}

export function formatDollars(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} billion`;
  }
  if (abs >= 1_000_000) {
    return `$${(value / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} million`;
  }
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function formatPrice(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

/** Share of whole, or null when the two figures cannot be divided. */
export function sharePercent(part: number | null | undefined, whole: number | null | undefined): string | null {
  if (part == null || whole == null || !Number.isFinite(part) || !Number.isFinite(whole) || whole === 0) return null;
  const pct = (part / whole) * 100;
  if (!Number.isFinite(pct)) return null;
  const digits = pct >= 1 ? 1 : 2;
  return `${pct.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

export function monthLabel(iso: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(iso);
  if (!match) return iso;
  return `${monthNames[Number(match[2]) - 1]} ${match[1]}`;
}

export function shortDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  return `${monthNames[Number(match[2]) - 1]} ${Number(match[3])}, ${match[1]}`;
}

export function formatWeek(span: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})\/(\d{4})-(\d{2})-(\d{2})$/.exec(span);
  if (!match) return span;
  const start = `${monthNames[Number(match[2]) - 1]} ${Number(match[3])}`;
  const end = match[2] === match[5]
    ? String(Number(match[6]))
    : `${monthNames[Number(match[5]) - 1]} ${Number(match[6])}`;
  return `${start}–${end}, ${match[4]}`;
}

export function axisLabel(iso: string): string {
  if (/^\d{4}$/.test(iso)) return iso;
  const match = /^(\d{4})-(\d{2})/.exec(iso);
  if (!match) return iso;
  return `${monthNames[Number(match[2]) - 1]} ${match[1].slice(2)}`;
}
