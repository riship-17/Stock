import { useState, useMemo } from 'react';
import { ListOrdered } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePortfolios } from '../hooks/usePortfolio';
import { formatCurrency, formatPercent, getPnLClass } from '../utils/currency';
import { formatDate } from '../utils/dateHelpers';
import FinanceTooltip from '../components/FinanceTooltip';
import EmptyState from '../components/EmptyState';
import { SkeletonRow } from '../components/SkeletonLoader';
import { getTransactions } from '../api/transactions';
import { useEffect } from 'react';
import './TransactionsPage.css';

export default function TransactionsPage() {
  const { portfolios } = usePortfolios();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterPortfolio, setFilterPortfolio] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterTicker, setFilterTicker] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterPortfolio) params.portfolioId = filterPortfolio;
      if (filterType) params.type = filterType;
      if (filterTicker) params.ticker = filterTicker;
      const result = await getTransactions(params);
      setTransactions(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [filterPortfolio, filterType, filterTicker]);

  const totalRealizedGain = transactions
    .filter((t) => t.type === 'sell' && t.realizedGain != null)
    .reduce((s, t) => s + t.realizedGain, 0);

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Transaction History</h1>
          <div className="section-subtitle">All buy and sell records</div>
        </div>
      </div>

      {/* Filters */}
      <div className="txn-filters">
        <input
          type="text"
          className="form-input"
          style={{ width: 160, height: 38 }}
          placeholder="Filter by ticker…"
          value={filterTicker}
          onChange={(e) => setFilterTicker(e.target.value.toUpperCase())}
          id="txn-ticker-filter"
        />
        <div className="tabs">
          {[['', 'All'], ['buy', 'Buys'], ['sell', 'Sells']].map(([val, label]) => (
            <button
              key={val}
              className={`tab${filterType === val ? ' active' : ''}`}
              onClick={() => setFilterType(val)}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          className="form-input"
          style={{ width: 160, height: 38 }}
          value={filterPortfolio}
          onChange={(e) => setFilterPortfolio(e.target.value)}
          id="txn-portfolio-filter"
        >
          <option value="">All Portfolios</option>
          {portfolios.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Realized Gains Summary (if any sells) */}
      {transactions.some((t) => t.type === 'sell') && (
        <div className="card txn-realized-card">
          <div className="txn-realized-label">
            <FinanceTooltip term="realizedGain">Total Realized Gain</FinanceTooltip>
          </div>
          <div className={`txn-realized-value ${getPnLClass(totalRealizedGain)}`}>
            {formatCurrency(totalRealizedGain, { signed: true })}
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        {loading ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Stock</th><th>Type</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Realized Gain</th>
                </tr>
              </thead>
              <tbody>
                {[1,2,3,4,5].map((i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={ListOrdered}
            title="No transactions yet"
            description="Transactions are logged automatically when you add or sell holdings."
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Stock</th>
                  <th>Portfolio</th>
                  <th>Type</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">
                    <FinanceTooltip term="realizedGain">Realized Gain</FinanceTooltip>
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t._id} className={`txn-row txn-${t.type}`}>
                    <td className="txn-date">{formatDate(t.date)}</td>
                    <td>
                      <Link to={`/stock/${t.ticker}`} className="txn-stock">
                        <span className="txn-company">{t.companyName || t.ticker}</span>
                        <span className="ticker-badge">{t.ticker}</span>
                      </Link>
                    </td>
                    <td>
                      <span className="txn-portfolio">
                        {t.portfolioId?.name || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${t.type === 'buy' ? 'badge-gain' : 'badge-loss'}`}>
                        {t.type === 'buy' ? '▲ BUY' : '▼ SELL'}
                      </span>
                    </td>
                    <td className="text-right txn-number">{t.quantity?.toLocaleString('en-IN')}</td>
                    <td className="text-right txn-number">{formatCurrency(t.price)}</td>
                    <td className="text-right txn-number">{formatCurrency(t.price * t.quantity)}</td>
                    <td className={`text-right txn-number ${getPnLClass(t.realizedGain)}`}>
                      {t.type === 'sell' && t.realizedGain != null
                        ? formatCurrency(t.realizedGain, { signed: true })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
