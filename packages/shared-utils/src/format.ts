/** Format price in ILS with Hebrew locale */
export function formatPrice(amount: number, currency = 'ILS'): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format number with commas */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('he-IL').format(n);
}

/** Format mileage */
export function formatMileage(km: number): string {
  return `${formatNumber(km)} ק"מ`;
}

/** Format phone number for Israel */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('972')) {
    const local = '0' + cleaned.slice(3);
    return formatLocalPhone(local);
  }
  return formatLocalPhone(cleaned);
}

function formatLocalPhone(phone: string): string {
  if (phone.length === 10) {
    return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
  }
  if (phone.length === 9) {
    return `${phone.slice(0, 2)}-${phone.slice(2, 5)}-${phone.slice(5)}`;
  }
  return phone;
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

/** Format percentage */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
