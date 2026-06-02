/** Format dates/times in India Standard Time (IST). */
const IST_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: 'Asia/Kolkata',
  dateStyle: 'medium',
  timeStyle: 'short',
};

export function formatIST(
  value?: string | Date | null,
  options: Intl.DateTimeFormatOptions = IST_OPTIONS
): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', ...options });
}

export function formatISTDate(value?: string | Date | null): string {
  return formatIST(value, { timeZone: 'Asia/Kolkata', dateStyle: 'medium' });
}

export function formatISTFilename(value: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(value);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}_${get('hour')}${get('minute')}${get('second')}`;
}

/** Live clock string for assessment timestamps. */
export function nowISTClock(): string {
  return formatIST(new Date());
}
