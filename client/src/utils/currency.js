// ─── Currency Formatting ──────────────────────────────────────────────────────
// Formats a number as Indian Rupees (₹), with optional lakhs/crores display.

export const DISPLAY_MODE = { FULL: 'full', LAKH: 'lakh', CRORE: 'crore' };

/**
 * Format a number as ₹ with Indian number system.
 * @param {number} value
 * @param {object} options
 * @param {boolean} options.compact - Use K/L/Cr suffixes
 * @param {number} options.decimals - Decimal places (default 2)
 * @param {boolean} options.signed - Show + prefix for positive
 */
export function formatCurrency(value, { compact = false, decimals = 2, signed = false } = {}) {
  if (value == null || isNaN(value)) return '—';

  const absVal = Math.abs(value);
  const sign = value < 0 ? '-' : signed && value > 0 ? '+' : '';

  if (compact) {
    if (absVal >= 1e7) return `${sign}₹${(absVal / 1e7).toFixed(decimals)}Cr`;
    if (absVal >= 1e5) return `${sign}₹${(absVal / 1e5).toFixed(decimals)}L`;
    if (absVal >= 1e3) return `${sign}₹${(absVal / 1e3).toFixed(1)}K`;
  }

  // Indian number formatting (e.g. 1,23,456)
  const formatted = absVal.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${sign}₹${formatted}`;
}

/**
 * Format percentage with sign and decimal places.
 */
export function formatPercent(value, decimals = 2, signed = true) {
  if (value == null || isNaN(value)) return '—';
  const sign = value > 0 && signed ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers in compact form (for market cap, volume).
 */
export function formatCompact(value) {
  if (value == null || isNaN(value)) return '—';
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e7) return `${(value / 1e7).toFixed(2)}Cr`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(2)}L`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString('en-IN');
}

/**
 * Format volume with appropriate suffix.
 */
export function formatVolume(value) {
  return formatCompact(value);
}

/**
 * Returns CSS class name based on P&L direction.
 */
export function getPnLClass(value) {
  if (value == null || isNaN(value)) return 'neutral-text';
  if (value > 0) return 'gain-text';
  if (value < 0) return 'loss-text';
  return 'neutral-text';
}

/**
 * Returns badge class based on P&L direction.
 */
export function getPnLBadgeClass(value) {
  if (value == null || isNaN(value)) return 'badge-neutral';
  if (value > 0) return 'badge-gain';
  if (value < 0) return 'badge-loss';
  return 'badge-neutral';
}
