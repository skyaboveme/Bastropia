export function money(dollars: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(dollars);
}

export function phoneHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '');
  return `tel:${digits}`;
}
