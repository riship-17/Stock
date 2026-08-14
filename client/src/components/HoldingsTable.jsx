import { useState } from 'react';
import { TrendingUp, Search, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatPercent, getPnLClass } from '../utils/currency';
import { formatDate, holdingPeriod } from '../utils/dateHelpers';
import { sortHoldings, filterHoldings } from '../utils/calculations';
import EmptyState from './EmptyState';
import { SkeletonHoldingsTable } from './SkeletonLoader';
import './HoldingsTable.css';

const SORT_FIELDS = [
  { key: 'ticker', label: 'Stock' },
  { key: 'quantity', label: 'Qty' },
  { key: 'buyPrice', label: 'Avg Price' },
  { key: 'currentPrice', label: 'Current' },
  { key: 'investedAmount', label: 'Invested' },
  { key: 'currentValue', label: 'Value' },
  { key: 'absolutePnL', label: 'P&L' },
  { key: 'percentPnL', label: 'P&L %' },
];

export default function HoldingsTable({ holdings = [], loading, onAddStock, onDeleteHolding }) {
  const [sortField, setSortField] = useState('absolutePnL');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('');

  if (loading) return <SkeletonHoldingsTable rows={5} />;

  if (holdings.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No holdings yet"
        description="Add your first stock to start tracking your portfolio performance."
        action={onAddStock}
        actionLabel="+ Add Stock"
      />
    );
  }

  const sectors = [...new Set(holdings.map((h) => h.sector).filter(Boolean))];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filtered = filterHoldings(holdings, { search, sector });
  const sorted = sortHoldings(filtered, sortField, sortDir);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="sort-icon">⇅</span>;
    return <span className="sort-icon active">{sortDir === 'desc' ? '↓' : '↑'}</span>;
  };

  return (
    <div className="holdings-table-wrapper">
      {/* Filters */}
      <div className="holdings-filters">
        <div className="holdings-search-wrap">
          <span className="holdings-search-icon"><Search size={16} /></span>
          <input
            type="text"
            className="form-input holdings-search"
            placeholder="Search stocks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="holdings-search"
          />
        </div>
        <div className="chip-row">
          <button
            className={`chip${!sector ? ' active' : ''}`}
            onClick={() => setSector('')}
          >All</button>
          {sectors.map((s) => (
            <button
              key={s}
              className={`chip${sector === s ? ' active' : ''}`}
              onClick={() => setSector(sector === s ? '' : s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={Search} title="No matching stocks" description="Try a different search or filter." />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {SORT_FIELDS.map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className={key !== 'ticker' ? 'text-right' : ''}
                  >
                    {label} <SortIcon field={key} />
                  </th>
                ))}
                <th className="text-right">Today</th>
                <th>Held</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((h) => (
                <HoldingRow
                  key={h._id}
                  holding={h}
                  onDelete={onDeleteHolding}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HoldingRow({ holding: h, onDelete }) {
  const hasError = h.error && !h.currentPrice;

  return (
    <tr className={hasError ? 'holding-row-error' : ''}>
      {/* Stock */}
      <td>
        <Link to={`/stock/${h.ticker}`} className="holding-stock-cell">
          <div className="holding-company">{h.companyName || h.ticker}</div>
          <span className="ticker-badge">{h.ticker}</span>
          {h.sector && <span className="badge badge-neutral" style={{ fontSize: 10 }}>{h.sector}</span>}
        </Link>
      </td>

      {/* Qty */}
      <td className="text-right">
        <span className="holding-number">{h.quantity?.toLocaleString('en-IN')}</span>
      </td>

      {/* Avg Price */}
      <td className="text-right">
        <span className="holding-number">{formatCurrency(h.buyPrice)}</span>
      </td>

      {/* Current Price */}
      <td className="text-right">
        {hasError ? (
          <span className="holding-error-badge" title={h.error}>N/A</span>
        ) : (
          <span className="holding-number">{formatCurrency(h.currentPrice)}</span>
        )}
      </td>

      {/* Invested */}
      <td className="text-right">
        <span className="holding-number muted">{formatCurrency(h.investedAmount)}</span>
      </td>

      {/* Current Value */}
      <td className="text-right">
        <span className="holding-number">{hasError ? '—' : formatCurrency(h.currentValue)}</span>
      </td>

      {/* Absolute P&L */}
      <td className="text-right">
        <span className={`holding-number ${getPnLClass(h.absolutePnL)}`}>
          {hasError ? '—' : formatCurrency(h.absolutePnL, { signed: true })}
        </span>
      </td>

      {/* % P&L */}
      <td className="text-right">
        {hasError ? (
          <span className="holding-number muted">—</span>
        ) : (
          <span className={`badge ${h.percentPnL >= 0 ? 'badge-gain' : 'badge-loss'}`}>
            {formatPercent(h.percentPnL)}
          </span>
        )}
      </td>

      {/* Today's Change */}
      <td className="text-right">
        <span className={`holding-number ${getPnLClass(h.todayChangePercent)}`}>
          {hasError ? '—' : formatPercent(h.todayChangePercent)}
        </span>
      </td>

      {/* Holding period */}
      <td>
        <span className="holding-period">{holdingPeriod(h.buyDate)}</span>
      </td>

      {/* Actions */}
      <td>
        <div className="holding-actions">
          <Link
            to={`/stock/${h.ticker}`}
            className="btn btn-ghost btn-sm"
            title="View chart"
          ><BarChart2 size={16} /></Link>
          {onDelete && (
            <button
              className="btn btn-danger btn-sm btn-icon"
              onClick={() => onDelete(h._id)}
              title="Remove holding"
              aria-label={`Remove ${h.ticker}`}
            >✕</button>
          )}
        </div>
      </td>
    </tr>
  );
}
