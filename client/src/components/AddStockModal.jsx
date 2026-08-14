import { useState, useEffect } from 'react';
import { validateTicker, searchStocks } from '../api/stocks';
import { addHolding } from '../api/holdings';
import { usePortfolios } from '../hooks/usePortfolio';
import { toInputDate } from '../utils/dateHelpers';
import './AddStockModal.css';

const STEPS = { TICKER: 1, DETAILS: 2, CONFIRM: 3 };

export default function AddStockModal({ onClose, onSuccess, defaultPortfolioId = null }) {
  const { portfolios } = usePortfolios();
  const [step, setStep] = useState(STEPS.TICKER);

  // Form fields
  const [ticker, setTicker] = useState('');
  const [portfolioId, setPortfolioId] = useState(defaultPortfolioId || '');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [buyDate, setBuyDate] = useState(toInputDate(new Date()));
  const [sector, setSector] = useState('');
  const [notes, setNotes] = useState('');

  // State
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Search State
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (step !== STEPS.TICKER) return;
    
    const query = ticker.trim();
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchStocks(query);
        setSearchResults(res.data || []);
        setShowResults(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [ticker, step]);

  useEffect(() => {
    if (portfolios.length > 0 && !portfolioId) {
      setPortfolioId(portfolios[0]._id);
    }
  }, [portfolios]);

  const handleValidateTicker = async (tickerToValidate = ticker) => {
    const t = typeof tickerToValidate === 'string' ? tickerToValidate : ticker;
    if (!t.trim()) return;
    setValidating(true);
    setError('');
    setValidationResult(null);

    try {
      const result = await validateTicker(t.trim().toUpperCase());
      if (result.valid) {
        setTicker(t.trim().toUpperCase());
        setValidationResult(result);
        setBuyPrice(result.currentPrice?.toFixed(2) || '');
        setStep(STEPS.DETAILS);
      } else {
        setError(result.error || 'Invalid ticker symbol');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!portfolioId || !quantity || !buyPrice || !buyDate) {
      setError('All fields are required');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      await addHolding({
        portfolioId,
        ticker: ticker.toUpperCase(),
        quantity: parseFloat(quantity),
        buyPrice: parseFloat(buyPrice),
        buyDate,
        sector,
        notes,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const SECTORS = [
    'Information Technology', 'Financial Services', 'Energy', 'FMCG',
    'Healthcare', 'Automobiles', 'Real Estate', 'Metals & Mining',
    'Telecommunications', 'Infrastructure', 'Consumer Durables', 'Unknown'
  ];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Add Stock Holding">
        <div className="modal-header">
          <div>
            <div className="modal-title">Add Stock Holding</div>
            <div className="modal-steps">
              {['Find Stock', 'Details', 'Confirm'].map((s, i) => (
                <span key={i} className={`modal-step${step === i + 1 ? ' active' : step > i + 1 ? ' done' : ''}`}>
                  {step > i + 1 ? '✓' : i + 1}. {s}
                </span>
              ))}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              <span>!</span> {error}
            </div>
          )}

          {/* Step 1: Ticker Input */}
          {step === STEPS.TICKER && (
            <>
              <div className="form-group search-container">
                <label className="form-label" htmlFor="ticker-input">Find Stock</label>
                <input
                  id="ticker-input"
                  type="text"
                  className="form-input search-input"
                  placeholder="Search by company name (e.g. Reliance, TCS) or ticker symbol"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  onFocus={() => ticker.length >= 2 && setShowResults(true)}
                  onBlur={() => setTimeout(() => setShowResults(false), 200)}
                  onKeyDown={(e) => e.key === 'Enter' && handleValidateTicker(ticker)}
                  autoFocus
                  autoComplete="off"
                />
                
                {showResults && (
                  <div className="search-results">
                    {isSearching ? (
                      <div className="search-status">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((s) => (
                        <div 
                          key={s.ticker} 
                          className="search-result-item"
                          onMouseDown={(e) => {
                            // use onMouseDown instead of onClick so it fires before input onBlur
                            e.preventDefault(); 
                            setTicker(s.ticker);
                            handleValidateTicker(s.ticker);
                          }}
                        >
                          <div className="search-result-symbol">{s.ticker}</div>
                          <div className="search-result-name">{s.shortName || s.longName}</div>
                          <div className="search-result-exchange">{s.exchange}</div>
                        </div>
                      ))
                    ) : (
                      <div className="search-status">No stocks found</div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="modal-exchange-chips">
                <span className="form-hint" style={{marginRight: '8px', display: 'flex', alignItems: 'center'}}>Popular:</span>
                {['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS'].map((t) => (
                  <button
                    key={t}
                    className="chip"
                    onClick={() => {
                      setTicker(t);
                      handleValidateTicker(t);
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn btn-primary btn-full" 
                  onClick={() => handleValidateTicker(ticker)}
                  disabled={validating || !ticker.trim()}
                >
                  {validating ? 'Verifying...' : 'Next'}
                </button>
              </div>
            </>
          )}

          {/* Step 2: Details */}
          {step === STEPS.DETAILS && validationResult && (
            <>
              <div className="add-stock-verified">
                <div className="add-stock-company">
                  <div className="add-stock-company-name">{validationResult.shortName}</div>
                  <span className="ticker-badge">{validationResult.ticker}</span>
                  <span className="badge badge-neutral">{validationResult.exchange}</span>
                </div>
                <div className="add-stock-price">
                  ₹{validationResult.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  <span className="add-stock-current-label">Current Price</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="portfolio-select">Portfolio</label>
                <select
                  id="portfolio-select"
                  className="form-input"
                  value={portfolioId}
                  onChange={(e) => setPortfolioId(e.target.value)}
                >
                  {portfolios.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="quantity-input">Quantity</label>
                  <input
                    id="quantity-input"
                    type="number"
                    min="0.001"
                    step="1"
                    className="form-input"
                    placeholder="10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="buy-price-input">Buy Price (₹)</label>
                  <input
                    id="buy-price-input"
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    placeholder="2450.00"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="buy-date-input">Buy Date</label>
                  <input
                    id="buy-date-input"
                    type="date"
                    className="form-input"
                    value={buyDate}
                    max={toInputDate(new Date())}
                    onChange={(e) => setBuyDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="sector-input">Sector</label>
                  <select
                    id="sector-input"
                    className="form-input"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                  >
                    <option value="">Select Sector</option>
                    {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="notes-input">Notes (optional)</label>
                <input
                  id="notes-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Core position, long-term hold"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Summary */}
              {quantity && buyPrice && (
                <div className="add-stock-summary">
                  <span>Total Invested</span>
                  <strong>₹{(parseFloat(quantity) * parseFloat(buyPrice)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          {step === STEPS.TICKER && (
            <>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleValidateTicker}
                disabled={!ticker.trim() || validating}
                id="validate-ticker-btn"
              >
                {validating ? (
                  <><span className="spinner spinner-sm" /> Validating…</>
                ) : (
                  'Next →'
                )}
              </button>
            </>
          )}

          {step === STEPS.DETAILS && (
            <>
              <button className="btn btn-secondary" onClick={() => { setStep(STEPS.TICKER); setError(''); }}>
                ← Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={submitting || !quantity || !buyPrice || !buyDate || !portfolioId}
                id="add-holding-submit-btn"
              >
                {submitting ? (
                  <><span className="spinner spinner-sm" /> Adding…</>
                ) : (
                  'Add Holding ✓'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
