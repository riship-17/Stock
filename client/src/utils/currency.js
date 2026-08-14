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
export function formatCurrency(value, { currency = 'INR', compact = false, decimals = 2, signed = false } = {}) {
  if (value == null || isNaN(value)) return '—';

  const absVal = Math.abs(value);
  const sign = value < 0 ? '-' : signed && value > 0 ? '+' : '';
  const isINR = currency.toUpperCase() === 'INR';
  const isUSD = currency.toUpperCase() === 'USD';
  
  // Try to use native symbol, otherwise fallback to code
  let symbol = '₹';
  if (!isINR) {
    try {
      const parts = new Intl.NumberFormat('en-US', { style: 'currency', currency }).formatToParts(0);
      symbol = parts.find(p => p.type === 'currency').value;
    } catch {
      symbol = currency + ' ';
    }
  }

  if (compact) {
    if (isINR) {
      if (absVal >= 1e7) return `${sign}${symbol}${(absVal / 1e7).toFixed(decimals)}Cr`;
      if (absVal >= 1e5) return `${sign}${symbol}${(absVal / 1e5).toFixed(decimals)}L`;
    } else {
      if (absVal >= 1e9) return `${sign}${symbol}${(absVal / 1e9).toFixed(decimals)}B`;
      if (absVal >= 1e6) return `${sign}${symbol}${(absVal / 1e6).toFixed(decimals)}M`;
    }
    if (absVal >= 1e3) return `${sign}${symbol}${(absVal / 1e3).toFixed(1)}K`;
  }

  const locale = isINR ? 'en-IN' : 'en-US';
  const formatted = absVal.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${sign}${symbol}${formatted}`;
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
