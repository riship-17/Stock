import { useState, useEffect, useCallback } from 'react';
import { BellRing, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAlerts, createAlert, deleteAlert, toggleAlert, evaluateAlerts } from '../api/alerts';
import { formatCurrency } from '../utils/currency';
import EmptyState from '../components/EmptyState';
import './AlertsPage.css';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ticker, setTicker] = useState('');
  const [condition, setCondition] = useState('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [triggered, setTriggered] = useState([]);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAlerts();
      setAlerts(res.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!ticker || !targetPrice) return;
    setAdding(true);
    try {
      await createAlert({ ticker, condition, targetPrice: parseFloat(targetPrice), note });
      setTicker(''); setTargetPrice(''); setNote('');
      fetchAlerts();
    } catch (e) { setError(e.message); }
    finally { setAdding(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this alert?')) return;
    try { await deleteAlert(id); fetchAlerts(); } catch (e) { setError(e.message); }
  };

  const handleToggle = async (id) => {
    try { await toggleAlert(id); fetchAlerts(); } catch (e) { setError(e.message); }
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      const res = await evaluateAlerts();
      setTriggered(res.data?.triggered || []);
      fetchAlerts();
    } catch (e) { setError(e.message); }
    finally { setEvaluating(false); }
  };

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Price Alerts</h1>
          <div className="section-subtitle">Get notified when stocks hit your target price</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleEvaluate} disabled={evaluating}>
          {evaluating ? <span className="spinner spinner-sm" /> : 'Check Alerts'}
        </button>
      </div>

      {triggered.length > 0 && (
        <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
          {triggered.length} alert{triggered.length > 1 ? 's' : ''} triggered!
          {triggered.map(t => (
            <div key={t._id} style={{ marginTop: 4 }}>
              <Link to={`/stock/${t.ticker}`} style={{ fontWeight: 700 }}>{t.ticker}</Link>
              {' '}{t.condition} {formatCurrency(t.targetPrice)} — now {formatCurrency(t.currentPrice)}
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="card-header"><div className="card-title">New Alert</div></div>
        <form onSubmit={handleAdd} className="alert-form">
          <input className="form-input" placeholder="Ticker (e.g. TCS.NS)" value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())} required style={{ width: 160 }} />
          <select className="form-input" value={condition} onChange={e => setCondition(e.target.value)} style={{ width: 120 }}>
            <option value="above">Goes Above</option>
            <option value="below">Goes Below</option>
          </select>
          <input className="form-input" type="number" placeholder="Target ₹" value={targetPrice}
            onChange={e => setTargetPrice(e.target.value)} required style={{ width: 140 }} />
          <input className="form-input" placeholder="Note (optional)" value={note}
            onChange={e => setNote(e.target.value)} style={{ width: 200 }} />
          <button className="btn btn-primary btn-sm" type="submit" disabled={adding}>
            {adding ? <span className="spinner spinner-sm" /> : '+ Add'}
          </button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div className="page-loading"><span className="spinner" /></div>
        ) : alerts.length === 0 ? (
          <EmptyState icon={BellRing} title="No alerts yet" description="Create your first price alert above." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Stock</th><th>Condition</th><th className="text-right">Target</th>
                <th className="text-right">Current</th><th>Status</th><th>Note</th><th></th>
              </tr></thead>
              <tbody>
                {alerts.map(a => (
                  <tr key={a._id}>
                    <td><Link to={`/stock/${a.ticker}`} className="ticker-badge">{a.ticker}</Link></td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {a.condition === 'above' ? <><TrendingUp size={16} className="gain-text" /> Above</> : <><TrendingDown size={16} className="loss-text" /> Below</>}
                    </td>
                    <td className="text-right">{formatCurrency(a.targetPrice)}</td>
                    <td className="text-right">{a.currentPrice ? formatCurrency(a.currentPrice) : '—'}</td>
                    <td>
                      <span className={`badge ${a.active ? (a.justTriggered ? 'badge-gain' : 'badge-accent') : 'badge-neutral'}`}>
                        {a.active ? (a.justTriggered ? 'Triggered!' : 'Active') : 'Paused'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.note || '—'}</td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(a._id)}>
                        {a.active ? 'Pause' : 'Resume'}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(a._id)} style={{ color: 'var(--loss-text)' }}>
                        Delete
                      </button>
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
