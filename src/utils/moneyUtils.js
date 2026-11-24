/**
 * Converts a finite monetary value to integer satang (1/100 Baht) to avoid IEEE-754 drift.
 */
export const toSatang = (value) => {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
};

export const fromSatang = (satang) => Math.round(satang) / 100;

export const sumMoney = (items, selector = (item) => item?.amount) => {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const totalSatang = items.reduce((acc, item) => acc + toSatang(selector(item)), 0);
  return fromSatang(totalSatang);
};

export const addMoney = (a, b) => fromSatang(toSatang(a) + toSatang(b));

export const subtractMoney = (a, b) => fromSatang(toSatang(a) - toSatang(b));

export const clampNonNegativeNumber = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100) / 100;
};
