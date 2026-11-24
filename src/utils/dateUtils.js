/**
 * Returns local calendar date as YYYY-MM-DD without UTC midnight shift.
 */
export const getLocalDateKey = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getYesterdayLocalDateKey = (date = new Date()) => {
  const d = new Date(date instanceof Date ? date.getTime() : Date.now());
  d.setDate(d.getDate() - 1);
  return getLocalDateKey(d);
};

export const getDaysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

/**
 * Checks YYYY-MM-DD syntax AND verifies calendar validity (e.g. rejects 2026-02-30).
 */
export const isValidIsoDate = (dateStr) => {
  if (typeof dateStr !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return false;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const parsed = new Date(y, m - 1, d);
  return (
    parsed.getFullYear() === y &&
    parsed.getMonth() === m - 1 &&
    parsed.getDate() === d
  );
};

/**
 * Normalizes legacy toDateString() or YYYY-MM-DD strings into YYYY-MM-DD local date key.
 */
export const normalizeToLocalDateKey = (value) => {
  if (!value || typeof value !== 'string') return null;
  if (isValidIsoDate(value)) return value.trim();
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return null;
  return getLocalDateKey(parsed);
};
