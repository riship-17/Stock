import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatPercent, getPnLClass } from '../utils/currency';
import { timeAgo } from '../utils/dateHelpers';
import { usePortfolios } from '../hooks/usePortfolio';
import { toInputDate } from '../utils/dateHelpers';
import './WatchlistRow.css';

export default function WatchlistRow({ item, onRemove, onBuy }) {
  const { portfolios } = usePortfolios();
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [portfolioId, setPortfolioId] = useState(portfolios[0]?._id || '');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState(item.quote?.regularMarketPrice?.toFixed(2) || '');
  const [buyDate, setBuyDate] = useState(toInputDate(new Date()));
  const [submitting, setSubmitting] = useState(false);

  const quote = item.quote;
  const hasPrice = quote && quote.regularMarketPrice;

  const handleBuySubmit = async () => {
    if (!portfolioId || !quantity || !buyPrice) return;
    setSubmitting(true);
    try {
      await onBuy(item._id, {
        portfolioId,
        quantity: parseFloat(quantity),
        buyPrice: parseFloat(buyPrice),
        buyDate,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="watchlist-row">
      <div className="watchlist-row-main">
        {/* Left: Stock info */}
        <Link to={`/stock/${item.ticker}`} className="watchlist-stock">
          <div className="watchlist-company">{item.companyName || item.ticker}</div>
          <span className="ticker-badge">{item.ticker}</span>
        </Link>

        {/* Center: Price & change */}
        <div className="watchlist-price-block">
          {hasPrice ? (
            <>
              <div className="watchlist-price">{formatCurrency(quote.regularMarketPrice, { currency: quote.currency || 'INR' })}</div>
              <div className={`watchlist-change ${getPnLClass(quote.regularMarketChangePercent)}`}>
                {formatPercent(quote.regularMarketChangePercent)} today
              </div>
            </>
          ) : (
            <div className="watchlist-price-na">Price unavailable</div>
          )}
        </div>

        {/* Target price */}
        {item.targetPrice && (
          <div className="watchlist-target">
            <span className="watchlist-target-label">Target</span>
            <span className="watchlist-target-value">{formatCurrency(item.targetPrice, { currency: item.currency || 'INR' })}</span>
            {hasPrice && (
              <span className={`badge ${quote.regularMarketPrice <= item.targetPrice ? 'badge-gain' : 'badge-neutral'}`}>
                {quote.regularMarketPrice <= item.targetPrice ? '✓ At target' : `${formatPercent(((item.targetPrice - quote.regularMarketPrice) / quote.regularMarketPrice) * 100)} away`}
              </span>
            )}
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <div className="watchlist-notes">{item.notes}</div>
        )}

        {/* Right: Actions */}
        <div className="watchlist-actions">
          <span className="watchlist-added">{timeAgo(item.addedDate)}</span>
          <button
            className="btn btn-gain btn-sm"
            onClick={() => setShowBuyForm((v) => !v)}
            id={`buy-btn-${item._id}`}
          >
            {showBuyForm ? 'Cancel' : '+ Buy'}
          </button>
          <button
            className="btn btn-danger btn-sm btn-icon"
            onClick={() => onRemove(item._id)}
            aria-label={`Remove ${item.ticker} from watchlist`}
          >✕</button>
        </div>
      </div>

      {/* Buy form inline */}
      {showBuyForm && (
        <div className="watchlist-buy-form">
          <div className="watchlist-buy-grid">
            <div className="form-group">
              <label className="form-label">Portfolio</label>
              <select
                className="form-input"
                value={portfolioId}
                onChange={(e) => setPortfolioId(e.target.value)}
              >
                {portfolios.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                className="form-input"
                placeholder="10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Buy Price ({item.currency === 'USD' ? '$' : '₹'})</label>
              <input
                type="number"
                className="form-input"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
              />
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleBuySubmit}
            disabled={submitting || !quantity || !buyPrice}
            id={`confirm-buy-btn-${item._id}`}
          >
            {submitting ? <><span className="spinner spinner-sm" /> Adding…</> : 'Confirm Buy'}
          </button>
        </div>
      )}
    </div>
  );
}
