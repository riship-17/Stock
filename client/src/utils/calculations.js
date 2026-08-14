/**
 * Frontend calculation helpers.
 * These are lightweight — heavy calculations happen on the backend.
 * These are for UI-level derived values.
 */

/**
 * Calculate P&L for a holding given a live price.
 */
export function calcPnL(holding) {
  const { quantity, buyPrice, currentPrice } = holding;
  if (!currentPrice || !buyPrice || !quantity) return null;

  const invested = buyPrice * quantity;
  const current = currentPrice * quantity;
  const absolute = current - invested;
  const percent = invested > 0 ? (absolute / invested) * 100 : 0;

  return { invested, current, absolute, percent };
}

/**
 * Simple moving average.
 */
export function sma(data, period) {
  if (!data || data.length < period) return [];
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return slice.reduce((s, v) => s + v, 0) / period;
  });
}

/**
 * Normalize a series to % change from first value (for comparison charts).
 */
export function normalizeToPercent(values) {
  const first = values[0];
  if (!first || first === 0) return values.map(() => 0);
  return values.map((v) => ((v - first) / first) * 100);
}

/**
 * Generate color for a stock on comparison chart.
 */
const COMPARE_COLORS = ['#4361EE', '#F72585', '#7209B7'];
export function getCompareColor(index) {
  return COMPARE_COLORS[index % COMPARE_COLORS.length];
}

/**
 * Sort holdings by a given field.
 */
export function sortHoldings(holdings, field, direction = 'desc') {
  return [...holdings].sort((a, b) => {
    let valA = a[field];
    let valB = b[field];
    if (valA == null) valA = direction === 'desc' ? -Infinity : Infinity;
    if (valB == null) valB = direction === 'desc' ? -Infinity : Infinity;
    return direction === 'desc' ? valB - valA : valA - valB;
  });
}

/**
 * Filter holdings.
 */
export function filterHoldings(holdings, { search = '', sector = '' } = {}) {
  return holdings.filter((h) => {
    const matchSearch =
      !search ||
      h.ticker?.toLowerCase().includes(search.toLowerCase()) ||
      h.companyName?.toLowerCase().includes(search.toLowerCase());
    const matchSector = !sector || h.sector === sector;
    return matchSearch && matchSector;
  });
}
