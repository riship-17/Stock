import { useState } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { useStockQuote } from '../hooks/useStockData';
import { formatCurrency, formatPercent, getPnLClass, formatCompact } from '../utils/currency';
import StockChart from '../components/StockChart';
import TradePanel from '../components/TradePanel';
import { SkeletonBlock, SkeletonChart } from '../components/SkeletonLoader';
import './StockDetailPage.css';

export default function StockDetailPage() {
  const { ticker } = useParams();
  const { data: quote, loading, error, refetch } = useStockQuote(ticker);
  const [tradeNonce, setTradeNonce] = useState(0);

  const isMarketOpen = quote?.marketState === 'REGULAR';

  return (
    <div className="page-container">
      <div className="breadcrumb" style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 13, color: 'var(--text-muted)' }}>
        <Link to="/" style={{ color: 'var(--accent)', fontWeight: 500 }}>Dashboard</Link>
        <span>›</span>
        <span>{ticker}</span>
      </div>

      <div className="stock-detail-header">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SkeletonBlock width={200} height={28} />
            <SkeletonBlock width={120} height={16} />
          </div>
        ) : error ? (
          <div className="alert alert-error"><AlertTriangle size={16} style={{ display: 'inline' }} /> {error}</div>
        ) : quote ? (
          <>
            <div className="stock-detail-title-block">
              <div>
                <h1 className="stock-detail-company">{quote.longName || quote.shortName}</h1>
                <div className="stock-detail-meta">
                  <span className="ticker-badge">{ticker}</span>
                  <span className="badge badge-neutral">{quote.exchange}</span>
                  <span className={`badge ${isMarketOpen ? 'badge-gain' : 'badge-neutral'}`}>
                    {isMarketOpen ? 'Market Open' : 'Market Closed'}
                  </span>
                  {quote.stale && (
                    <span className="badge badge-neutral" title="Showing cached data" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Package size={14} /> Cached</span>
                  )}
                </div>
              </div>

              <div className="stock-detail-price-block">
                <div className="stock-detail-price">
                  {formatCurrency(quote.regularMarketPrice, { currency: quote.currency || 'INR' })}
                </div>
                <div className={`stock-detail-change ${getPnLClass(quote.regularMarketChange)}`}>
                  {quote.regularMarketChange >= 0 ? '▲' : '▼'}
                  {' '}{formatCurrency(Math.abs(quote.regularMarketChange), { currency: quote.currency || 'INR' })}
                  {' '}({formatPercent(Math.abs(quote.regularMarketChangePercent))}) today
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {!loading && quote && (
        <div className="stock-key-stats">
          <StatBox label="Open" value={formatCurrency(quote.regularMarketOpen, { currency: quote.currency || 'INR' })} />
          <StatBox label="Day High" value={formatCurrency(quote.regularMarketDayHigh, { currency: quote.currency || 'INR' })} />
          <StatBox label="Day Low" value={formatCurrency(quote.regularMarketDayLow, { currency: quote.currency || 'INR' })} />
          <StatBox label="Prev. Close" value={formatCurrency(quote.regularMarketPreviousClose, { currency: quote.currency || 'INR' })} />
          <StatBox label="Volume" value={formatCompact(quote.regularMarketVolume)} />
          <StatBox label="Market Cap" value={quote.marketCap ? formatCompact(quote.marketCap) : '—'} />
          <StatBox label="52W High" value={formatCurrency(quote.fiftyTwoWeekHigh, { currency: quote.currency || 'INR' })} />
          <StatBox label="52W Low" value={formatCurrency(quote.fiftyTwoWeekLow, { currency: quote.currency || 'INR' })} />
          {quote.trailingPE && (
            <StatBox label="P/E (TTM)" value={quote.trailingPE?.toFixed(2)} />
          )}
        </div>
      )}

      <div className="stock-detail-grid">
        <div className="stock-detail-main-col">
          <div className="card" style={{ marginTop: 'var(--space-5)' }}>
            <div className="card-header">
              <div className="card-title">Price Chart</div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={refetch}
                id="refresh-stock-btn"
              >Refresh Quote</button>
            </div>
            {loading ? (
              <SkeletonChart height={300} />
            ) : (
              <StockChart key={tradeNonce} ticker={ticker} />
            )}
          </div>
        </div>

        <div>
          <TradePanel ticker={ticker} quote={quote} onTraded={() => { setTradeNonce((n) => n + 1); refetch(); }} />
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="stock-stat-box">
      <div className="stock-stat-label">{label}</div>
      <div className="stock-stat-value">{value || '—'}</div>
    </div>
  );
}

