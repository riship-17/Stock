/**
 * Date helper utilities.
 */

/**
 * Format a date to a readable string.
 * @param {Date|string} date
 * @param {object} options
 */
export function formatDate(date, options = {}) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d)) return '—';

  const defaults = { day: 'numeric', month: 'short', year: 'numeric' };
  return d.toLocaleDateString('en-IN', { ...defaults, ...options });
}

/**
 * Format a date for HTML input[type=date] (YYYY-MM-DD).
 */
export function toInputDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return '';
  return d.toISOString().split('T')[0];
}

/**
 * Return relative time string, e.g. "2 days ago".
 */
export function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/**
 * Returns holding period label, e.g. "1 year 3 months".
 */
export function holdingPeriod(buyDate) {
  if (!buyDate) return '';
  const days = Math.floor((Date.now() - new Date(buyDate)) / (1000 * 60 * 60 * 24));
  if (days < 1) return 'Today';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  const remDays = days % 30;
  if (months < 12) return remDays > 0 ? `${months}mo ${remDays}d` : `${months} months`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths > 0 ? `${years}y ${remMonths}mo` : `${years} year${years > 1 ? 's' : ''}`;
}

/**
 * Check if a holding is long-term (> 1 year — LTCG territory in India).
 */
export function isLongTerm(buyDate) {
  if (!buyDate) return false;
  const days = Math.floor((Date.now() - new Date(buyDate)) / (1000 * 60 * 60 * 24));
  return days >= 365;
}

/**
 * Format chart date label based on range.
 */
export function formatChartDate(dateStr, range) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;

  switch (range) {
    case '1D':
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    case '1W':
    case '1M':
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    case '3M':
    case '6M':
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    case '1Y':
      return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    case '5Y':
      return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    default:
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
}
