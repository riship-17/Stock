import { useState } from 'react';
import { placeBuy, placeSell, resetAccount } from '../api/trade';
import { usePortfolios, usePortfolioHoldings } from '../hooks/usePortfolio';
import { useAccount } from '../hooks/useAccount';
import { formatCurrency } from '../utils/currency';
import { getPnLClass } from '../utils/currency';
import './TradePanel.css';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export default function TradePanel({ ticker, quote, onTraded }) {
  const { portfolios, loading: loadingPortfolios } = usePortfolios();
  const [portfolioId, setPortfolioId] = useState('');
  const [side, setSide] = useState('buy');
  const [quantity, setQuantity] = useState('');
  const [useLive, setUseLive] = useState(true);
  const [customPrice, setCustomPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const { account, refetch: refetchAccount } = useAccount();
  const effectivePortfolioId = portfolioId || portfolios[0]?._id || '';
  const { holdings } = usePortfolioHoldings(effectivePortfolioId);

  const livePrice = quote?.regularMarketPrice || null;
  const price = useLive ? livePrice : parseFloat(customPrice) || null;

  const availableQty = (holdings || [])
    .filter((h) => h.ticker === ticker.toUpperCase())
    .reduce((s, h) => s + (h.quantity || 0), 0);

  const cost = price && quantity ? round2(price * parseFloat(quantity)) : 0;
  const sufficientCash = side === 'buy' ? account && cost <= account.cash : true;
  const sufficientQty = side === 'sell' ? parseFloat(quantity || 0) <= availableQty : true;

  const submit = async () => {
    setErr(null);
    setMsg(null);
    if (!effectivePortfolioId) {
      setErr('Create a portfolio first.');
      return;
    }
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      setErr('Enter a valid quantity.');
      return;
    }
    if (!price || price <= 0) {
      setErr('Enter a valid price or use the live price.');
      return;
    }
    if (side === 'buy' && cost > (account?.cash || 0)) {
      setErr(`Insufficient cash. Need ${formatCurrency(cost)}, have ${formatCurrency(account?.cash || 0)}.`);
      return;
    }
    if (side === 'sell' && qty > availableQty) {
      setErr(`You only hold ${availableQty} ${ticker}.`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        portfolioId: effectivePortfolioId,
        ticker,
        quantity: qty,
        useLivePrice: useLive,
        ...(useLive ? {} : { price }),
      };
      const fn = side === 'buy' ? placeBuy : placeSell;
      const result = await fn(payload);
      setMsg(result.message);
      setQuantity('');
      setCustomPrice('');
      refetchAccount();
      if (onTraded) onTraded();
    } catch (e) {
      setErr(e.message || 'Trade failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset your paper account? This deletes all holdings and transactions and restores cash to the starting balance.')) return;
    setSubmitting(true);
    try {
      await resetAccount();
      refetchAccount();
      setMsg('Paper account reset.');
      setErr(null);
      if (onTraded) onTraded();
    } catch (e) {
      setErr(e.message || 'Reset failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card trade-panel">
      <div className="trade-panel-header">
        <div className="card-title">Paper Trade</div>
        <span className="badge badge-neutral">Virtual cash</span>
      </div>

      <div className="trade-cash-row">
        <div>
          <div className="trade-cash-label">Available cash</div>
          <div className="trade-cash-value">{formatCurrency(account?.cash, { compact: true })}</div>
        </div>
        <div className="trade-cash-secondary">
          <div className={getPnLClass(account?.totalPnL)}>
            {account?.totalPnL >= 0 ? '+' : ''}{formatCurrency(account?.totalPnL, { compact: true })}
          </div>
          <div className="trade-cash-label">{account ? `Account ${account.totalPnLPercent >= 0 ? '+' : ''}${account.totalPnLPercent.toFixed(2)}%` : ''}</div>
        </div>
      </div>

      <div className="side-toggle">
        <button
          className={`side-btn buy${side === 'buy' ? ' active' : ''}`}
          onClick={() => setSide('buy')}
        >BUY</button>
        <button
          className={`side-btn sell${side === 'sell' ? ' active' : ''}`}
          onClick={() => setSide('sell')}
        >SELL</button>
      </div>

      <div className="trade-form">
        <div className="form-group">
          <label className="form-label">Portfolio</label>
          <select
            className="form-input"
            value={effectivePortfolioId}
            onChange={(e) => setPortfolioId(e.target.value)}
            disabled={loadingPortfolios}
          >
            {portfolios.length === 0 && <option value="">No portfolios</option>}
            {portfolios.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="trade-row-2">
          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              className="form-input"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            {side === 'sell' && (
              <span className="form-hint">Holding: {availableQty} {ticker}</span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">
              Price {useLive && livePrice ? `(live ₹${livePrice})` : ''}
            </label>
            <input
              type="number"
              className="form-input"
              placeholder={livePrice ? String(livePrice) : '0'}
              value={useLive ? '' : customPrice}
              disabled={useLive}
              onChange={(e) => setCustomPrice(e.target.value)}
            />
          </div>
        </div>

        <label className="trade-live-toggle">
          <input
            type="checkbox"
            checked={useLive}
            onChange={(e) => setUseLive(e.target.checked)}
          />
          Use live market price
        </label>

        {quantity && price > 0 && (
          <div className="trade-estimate">
            <span>{side === 'buy' ? 'Cost' : 'Proceeds'}</span>
            <strong>{formatCurrency(price * parseFloat(quantity))}</strong>
            {side === 'buy' && !sufficientCash && (
              <span className="trade-warn"> — exceeds available cash</span>
            )}
            {side === 'sell' && !sufficientQty && (
              <span className="trade-warn"> — exceeds quantity held</span>
            )}
          </div>
        )}

        {err && <div className="alert alert-error" style={{ fontSize: 12 }}>{err}</div>}
        {msg && <div className="alert alert-success" style={{ fontSize: 12 }}>{msg}</div>}

        <button
          className={`btn btn-lg ${side === 'buy' ? 'btn-gain' : 'btn-danger'} trade-submit-btn`}
          onClick={submit}
          disabled={submitting || !effectivePortfolioId}
        >
          {submitting ? <span className="spinner spinner-sm" /> : `${side === 'buy' ? 'Buy' : 'Sell'} ${ticker}`.toUpperCase()}
        </button>

        <button className="btn btn-ghost btn-sm trade-reset-btn" onClick={handleReset} disabled={submitting}>
          Reset paper account
        </button>
      </div>
    </div>
  );
}
