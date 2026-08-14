import { useState, useEffect } from 'react';
import { BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { screenStocks } from '../api/screener';
import { formatCurrency, formatPercent, getPnLClass, formatCompact } from '../utils/currency';
import EmptyState from '../components/EmptyState';
import './ScreenerPage.css';

const SORT_OPTIONS = [
  { value: 'marketCap', label: 'Market Cap' },
  { value: 'price', label: 'Price' },
  { value: 'trailingPE', label: 'P/E' },
  { value: 'volume', label: 'Volume' },
  { value: 'changePercent', label: '% Change' },
  { value: 'pctFrom52High', label: '% from 52W High' },
];

export default function ScreenerPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('marketCap');
  const [sortDir, setSortDir] = useState('desc');
  const [peMin, setPeMin] = useState('');
  const [peMax, setPeMax] = useState('');
  const [volumeMin, setVolumeMin] = useState('');
  const [marketCapMin, setMarketCapMin] = useState('');

  const runScreen = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { sortBy, sortDir };
      if (peMin) params.peMin = peMin;
      if (peMax) params.peMax = peMax;
      if (volumeMin) params.volumeMin = volumeMin;
      if (marketCapMin) params.marketCapMin = marketCapMin;
      const res = await screenStocks(params);
      setResults(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runScreen(); }, [sortBy, sortDir]);

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Stock Screener</h1>
          <div className="section-subtitle">Screen NSE large & mid-cap stocks by key metrics</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={runScreen} disabled={loading}>
          {loading ? <span className="spinner spinner-sm" /> : 'Refresh'}
        </button>
      </div>

      <div className="card screener-filters">
        <div className="screener-filter-row">
          <div className="form-group">
            <label className="form-label">P/E Min</label>
            <input className="form-input" type="number" value={peMin} onChange={e => setPeMin(e.target.value)} placeholder="—" />
          </div>
          <div className="form-group">
            <label className="form-label">P/E Max</label>
            <input className="form-input" type="number" value={peMax} onChange={e => setPeMax(e.target.value)} placeholder="—" />
          </div>
          <div className="form-group">
            <label className="form-label">Min Volume</label>
            <input className="form-input" type="number" value={volumeMin} onChange={e => setVolumeMin(e.target.value)} placeholder="100000" />
          </div>
          <div className="form-group">
            <label className="form-label">Sort By</label>
            <select className="form-input" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Direction</label>
            <select className="form-input" value={sortDir} onChange={e => setSortDir(e.target.value)}>
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
          <div className="form-group" style={{ alignSelf: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={runScreen} disabled={loading}>Screen</button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: 'var(--space-3)' }}>{error}</div>}

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        {loading ? (
          <div className="page-loading"><span className="spinner spinner-lg" /></div>
        ) : results.length === 0 ? (
          <EmptyState icon={BarChart2} title="No stocks match" description="Adjust filters and try again." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Stock</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">% Chg</th>
                  <th className="text-right">Volume</th>
                  <th className="text-right">Mkt Cap</th>
                  <th className="text-right">P/E</th>
                  <th className="text-right">52W High</th>
                  <th className="text-right">52W Low</th>
                </tr>
              </thead>
              <tbody>
                {results.map(s => (
                  <tr key={s.ticker}>
                    <td>
                      <Link to={`/stock/${s.ticker}`} className="txn-stock">
                        <span className="txn-company">{s.companyName}</span>
                        <span className="ticker-badge">{s.ticker}</span>
                      </Link>
                    </td>
                    <td className="text-right">{formatCurrency(s.price)}</td>
                    <td className={`text-right ${getPnLClass(s.changePercent)}`}>
                      {formatPercent(s.changePercent)}
                    </td>
                    <td className="text-right">{formatCompact(s.volume)}</td>
                    <td className="text-right">{s.marketCap ? formatCompact(s.marketCap) : '—'}</td>
                    <td className="text-right">{s.trailingPE ? s.trailingPE.toFixed(2) : '—'}</td>
                    <td className="text-right">{formatCurrency(s.fiftyTwoWeekHigh)}</td>
                    <td className="text-right">{formatCurrency(s.fiftyTwoWeekLow)}</td>
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
