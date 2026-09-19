/** Format dates/times in India Standard Time (IST). API datetimes are stored/sent as UTC. */

const IST_TZ = 'Asia/Kolkata';

const IST_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: IST_TZ,
  dateStyle: 'medium',
  timeStyle: 'short',
};

/** Today's calendar date in IST as `YYYY-MM-DD` (for `<input type="date">`). */
export function todayISTDate(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Short chart tick label, e.g. `19 Sep` — avoids crowded ISO strings like `2026-01-05`. */
export function formatISTChartTick(value?: string | Date | null): string {
  const date = parseApiDateTime(value);
  if (!date) return '—';
  return date.toLocaleString('en-GB', {
    timeZone: IST_TZ,
    day: 'numeric',
    month: 'short',
  });
}

/** Parse API datetime: naive strings are UTC; Z or offset strings are respected. */
export function parseApiDateTime(value?: string | Date | null): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const s = String(value).trim();
  if (!s) return null;
  if (/[zZ]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const normalized = s.includes('T') ? s : `${s}T00:00:00`;
  const d = new Date(`${normalized}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatIST(
  value?: string | Date | null,
  options: Intl.DateTimeFormatOptions = IST_OPTIONS
): string {
  const date = parseApiDateTime(value);
  if (!date) return '—';
  return date.toLocaleString('en-IN', { timeZone: IST_TZ, ...options });
}

export function formatISTDate(value?: string | Date | null): string {
  return formatIST(value, { timeZone: IST_TZ, dateStyle: 'medium' });
}

/** Date + time for vitals log, notes, attachments (matches prior table style). */
export function formatISTDateTime(value?: string | Date | null): string {
  return formatIST(value, {
    timeZone: IST_TZ,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatISTFilename(value: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TZ,
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

/** Live clock string for assessment timestamps (IST). */
export function nowISTClock(): string {
  return formatIST(new Date());
}
