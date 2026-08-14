import { useState, useEffect } from 'react';
import { Newspaper } from 'lucide-react';
import { getNews } from '../api/news';
import { formatDate } from '../utils/dateHelpers';
import EmptyState from '../components/EmptyState';
import './NewsPage.css';

export default function NewsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ticker, setTicker] = useState('');
  const [searchTicker, setSearchTicker] = useState('');

  const fetchNews = async (t) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (t) params.ticker = t;
      const res = await getNews(params);
      setItems(res.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNews(searchTicker); }, [searchTicker]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTicker(ticker.trim());
  };

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Market News</h1>
          <div className="section-subtitle">Latest market headlines and stock news</div>
        </div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            placeholder="Filter by ticker..."
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            style={{ width: 180, height: 38 }}
          />
          <button className="btn btn-secondary btn-sm" type="submit">Search</button>
          {searchTicker && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setTicker(''); setSearchTicker(''); }}>Clear</button>
          )}
        </form>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-3)' }}>{error}</div>}

      {loading ? (
        <div className="page-loading"><span className="spinner spinner-lg" /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={Newspaper} title="No news found" description={searchTicker ? `No news matching "${searchTicker}". Try another ticker.` : 'No news available right now.'} />
      ) : (
        <div className="news-grid">
          {items.map((n, i) => (
            <a
              key={n.id || i}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card news-card"
            >
              {n.image && <img src={n.image} alt="" className="news-thumb" loading="lazy" />}
              <div className="news-content">
                <div className="news-source">{n.source || 'Market News'}</div>
                <h3 className="news-headline">{n.headline}</h3>
                {n.summary && <p className="news-summary">{n.summary.slice(0, 160)}...</p>}
                <div className="news-meta">
                  <span>{formatDate(n.publishedAt, { hour: '2-digit', minute: '2-digit' })}</span>
                  {n.related && <span className="ticker-badge">{n.related.split(',')[0]}</span>}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
