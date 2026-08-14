import { useState, useEffect, useCallback } from 'react';
import { Trophy } from 'lucide-react';
import { getLeaderboard } from '../api/leaderboard';
import { getBadges, evaluateBadges } from '../api/badges';
import { formatCurrency, formatPercent, getPnLClass } from '../utils/currency';
import { formatDate } from '../utils/dateHelpers';
import EmptyState from '../components/EmptyState';
import './LeaderboardPage.css';

export default function LeaderboardPage() {
  const [board, setBoard] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newBadges, setNewBadges] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [lbRes, bdgRes] = await Promise.all([getLeaderboard(), getBadges()]);
      setBoard(lbRes.data || []);
      setBadges(bdgRes.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEvaluate = async () => {
    try {
      const res = await evaluateBadges();
      setBadges(res.data || []);
      setNewBadges(res.newlyAwarded || []);
      fetchData();
    } catch (e) { setError(e.message); }
  };

  const rankIcon = (rank) => {
    return `#${rank}`;
  };

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Leaderboard</h1>
          <div className="section-subtitle">Rank all traders by paper portfolio returns</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleEvaluate}>Evaluate Badges</button>
      </div>

      {newBadges.length > 0 && (
        <div className="alert alert-success" style={{ marginBottom: 'var(--space-3)' }}>
          New badges earned: {newBadges.map(b => <strong key={b}>{b}</strong>).join(', ')}
        </div>
      )}

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-3)' }}>{error}</div>}

      <div className="leaderboard-grid">
        <div className="card leaderboard-board">
          {loading ? (
            <div className="page-loading"><span className="spinner spinner-lg" /></div>
          ) : board.length === 0 ? (
            <EmptyState icon={Trophy} title="No traders yet" description="Create an account and start trading!" />
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr>
                  <th>Rank</th><th>Trader</th><th className="text-right">Account Value</th>
                  <th className="text-right">Return</th><th className="text-right">Trades</th>
                </tr></thead>
                <tbody>
                  {board.map((r) => (
                    <tr key={r.userId} className={r.rank <= 3 ? `rank-${r.rank}` : ''}>
                      <td className="rank-cell">{rankIcon(r.rank)}</td>
                      <td className="trader-name">{r.name}</td>
                      <td className="text-right">{formatCurrency(r.totalAccountValue, { compact: true })}</td>
                      <td className={`text-right ${getPnLClass(r.returnPct)}`}>
                        {formatPercent(r.returnPct)}
                      </td>
                      <td className="text-right">{r.trades}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card badges-card">
          <div className="card-header">
            <div className="card-title">Your Badges</div>
            <span className="badge badge-accent">{badges.filter(b => b.earned).length} / {badges.length}</span>
          </div>
          <div className="badges-grid">
            {badges.map(b => (
              <div key={b.type} className={`badge-item ${b.earned ? 'earned' : ''}`}>
                <span className="badge-icon">{b.icon}</span>
                <div className="badge-label">{b.label}</div>
                <div className="badge-desc">{b.description}</div>
                {b.earned && <div className="badge-date">{formatDate(b.awardedAt)}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
