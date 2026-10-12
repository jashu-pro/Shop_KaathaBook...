/* utils/formatCompactAmount.ts */
// Indian-style compact amounts:
// 950      -> ₹950
// 1500     -> ₹1.5k
// 10000    -> ₹10k
// 15000    -> ₹15k
// 810000   -> ₹8.1L
// 1450000  -> ₹14.5L
// 1500000  -> ₹15L
// 25000000 -> ₹2.5Cr
const UNITS = [
  { value: 1e7, suffix: 'Cr' },
  { value: 1e5, suffix: 'L' },
  { value: 1e3, suffix: 'k' },
];

export function formatCompactAmount(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0';
  }
  const num = Number(amount);
  if (num === 0) return '₹0';

  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);

  for (const { value, suffix } of UNITS) {
    if (abs >= value) {
      const scaled = Math.round((abs / value) * 10) / 10;
      return `${sign}₹${scaled}${suffix}`;
    }
  }
  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
}

export function formatCompactNumber(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '0';
  }
  const num = Number(amount);
  if (num === 0) return '0';

  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);

  for (const { value, suffix } of UNITS) {
    if (abs >= value) {
      const scaled = Math.round((abs / value) * 10) / 10;
      return `${sign}${scaled}${suffix}`;
    }
  }
  return `${sign}${Math.round(abs).toLocaleString('en-IN')}`;
}
