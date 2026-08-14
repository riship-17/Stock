import { useState, useEffect } from 'react';
import { FileText, Receipt } from 'lucide-react';
import { getCapitalGains, downloadStatementPdf } from '../api/tax';
import { formatCurrency, formatPercent, getPnLClass } from '../utils/currency';
import { formatDate } from '../utils/dateHelpers';
import EmptyState from '../components/EmptyState';
import './TaxPage.css';

export default function TaxPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getCapitalGains();
      setData(res.data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDownload = async () => {
    setDownloadingPdf(true);
    try { await downloadStatementPdf(); }
    catch (e) { setError(e.message); }
    finally { setDownloadingPdf(false); }
  };

  const s = data?.summary;

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Tax & Capital Gains</h1>
          <div className="section-subtitle">Realized gains report for Indian tax purposes</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleDownload} disabled={downloadingPdf}>
          {downloadingPdf ? <span className="spinner spinner-sm" /> : 'Download PDF Statement'}
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-3)' }}>{error}</div>}

      {loading ? (
        <div className="page-loading"><span className="spinner spinner-lg" /></div>
      ) : !s || s.sellsCount === 0 ? (
        <EmptyState icon={Receipt} title="No realized gains yet" description="Sell some holdings to generate capital gains data." />
      ) : (
        <>
          <div className="grid-3" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="card stat-card">
              <div className="stat-label">Short-Term Gains (STCG)</div>
              <div className={`stat-value ${getPnLClass(s.shortTermGain)}`}>
                {formatCurrency(s.shortTermGain, { signed: true })}
              </div>
              <div className="stat-change neutral">{s.shortTermCount} realized gains (held &lt; 12 months)</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Long-Term Gains (LTCG)</div>
              <div className={`stat-value ${getPnLClass(s.longTermGain)}`}>
                {formatCurrency(s.longTermGain, { signed: true })}
              </div>
              <div className="stat-change neutral">{s.longTermCount} realized gains (held ≥ 12 months)</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Total Realized Gain</div>
              <div className={`stat-value ${getPnLClass(s.totalRealizedGain)}`}>
                {formatCurrency(s.totalRealizedGain, { signed: true })}
              </div>
              <div className="stat-change neutral">{s.sellsCount} sell transaction{s.sellsCount !== 1 ? 's' : ''}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Realized Gains Detail (FIFO)</div>
              <span className="badge badge-neutral">Latest first</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead><tr>
                  <th>Ticker</th><th>Buy Date</th><th className="text-right">Buy Price</th>
                  <th>Sell Date</th><th className="text-right">Sell Price</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Gain</th><th>Term</th>
                </tr></thead>
                <tbody>
                  {[...(data?.matches || [])].reverse().map((m, i) => (
                    <tr key={i}>
                      <td><span className="ticker-badge">{m.ticker}</span></td>
                      <td>{formatDate(m.buyDate)}</td>
                      <td className="text-right">{formatCurrency(m.buyPrice)}</td>
                      <td>{formatDate(m.sellDate)}</td>
                      <td className="text-right">{formatCurrency(m.sellPrice)}</td>
                      <td className="text-right">{m.quantity}</td>
                      <td className={`text-right ${getPnLClass(m.gain)}`}>
                        {formatCurrency(m.gain, { signed: true })}
                      </td>
                      <td>
                        <span className={`badge ${m.term === 'long' ? 'badge-gain' : 'badge-accent'}`}>
                          {m.term === 'long' ? 'LTCG' : 'STCG'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
