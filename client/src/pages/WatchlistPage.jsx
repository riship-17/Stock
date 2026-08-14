import { useState } from 'react';
import { Eye, AlertTriangle } from 'lucide-react';
import { useWatchlist } from '../hooks/useWatchlist';
import WatchlistRow from '../components/WatchlistRow';
import EmptyState from '../components/EmptyState';
import { SkeletonBlock } from '../components/SkeletonLoader';

export default function WatchlistPage() {
  const { items, loading, error, add, remove, convertToBuy } = useWatchlist();
  const [showAdd, setShowAdd] = useState(false);
  const [ticker, setTicker] = useState('');
  const [notes, setNotes] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const handleAdd = async () => {
    if (!ticker.trim()) return;
    setAdding(true);
    setAddError('');
    try {
      await add({
        ticker: ticker.trim().toUpperCase(),
        notes,
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      });
      setTicker('');
      setNotes('');
      setTargetPrice('');
      setShowAdd(false);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Watchlist</h1>
          <div className="section-subtitle">Track stocks you're considering buying</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAdd((v) => !v)}
          id="add-watchlist-btn"
        >
          {showAdd ? 'Cancel' : '+ Add to Watchlist'}
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Add to Watchlist</div>
          {addError && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{addError}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Ticker Symbol *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. BAJFINANCE.NS"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                autoFocus
                id="watchlist-ticker-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Target Price (₹)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Optional"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Notes</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Watch for breakout above ₹6500"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={!ticker.trim() || adding}
              id="confirm-watchlist-add-btn"
            >
              {adding ? <><span className="spinner spinner-sm" /> Adding…</> : '+ Add'}
            </button>
          </div>
        </div>
      )}

      {/* Watchlist */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[1,2,3,4,5].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'center' }}>
                <SkeletonBlock width="30%" height={14} />
                <SkeletonBlock width="15%" height={14} />
                <SkeletonBlock width="20%" height={14} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="alert alert-error"><AlertTriangle size={16} /> {error}</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Eye}
            title="Your watchlist is empty"
            description="Add stocks you're considering and track them before buying."
            action={() => setShowAdd(true)}
            actionLabel="+ Add First Stock"
          />
        ) : (
          <div>
            <div className="card-header">
              <div className="card-title">{items.length} Stocks Tracked</div>
            </div>
            {items.map((item) => (
              <WatchlistRow
                key={item._id}
                item={item}
                onRemove={remove}
                onBuy={convertToBuy}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
