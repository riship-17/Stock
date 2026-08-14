import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { formatCurrency, formatPercent, getPnLClass } from '../utils/currency';
import AllocationChart from '../components/AllocationChart';
import PortfolioTrendChart from '../components/PortfolioTrendChart';
import SkeletonLoader, { SkeletonStatCard, SkeletonChart } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import AddStockModal from '../components/AddStockModal';
import FinanceTooltip from '../components/FinanceTooltip';
import './Dashboard.css';

export default function Dashboard() {
  const { data, loading, error, refetch } = useDashboard();
  const [showAddModal, setShowAddModal] = useState(false);

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          Failed to load dashboard: {error}
        </div>
      </div>
    );
  }

  const formatChange = (val) => {
    if (!val && val !== 0) return null;
    return { value: val, positive: val >= 0 };
  };

  return (
    <div className="page-container dashboard">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">Portfolio Overview</h1>
          <div className="section-subtitle">
            {data?.lastUpdated
              ? `Last updated ${new Date(data.lastUpdated).toLocaleTimeString('en-IN')}`
              : 'Loading live data…'}
          </div>
        </div>
        <div className="dashboard-header-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={refetch}
            disabled={loading}
            id="refresh-dashboard-btn"
          >
            {loading ? <><span className="spinner spinner-sm" /></> : 'Refresh'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            id="add-stock-btn"
          >
            + Add Stock
          </button>
        </div>
      </div>

      {/* Key Stats Row */}
      <div className="grid-stats">
        {loading ? (
          [1,2,3,4].map((i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            {/* Total Portfolio Value */}
            <div className="card stat-card">
              <div className="stat-label">Total Portfolio Value</div>
              <div className="stat-value">
                {formatCurrency(data?.totalCurrentValue, { compact: true })}
              </div>
              {data?.todayChange != null && (
                <div className={`stat-change ${getPnLClass(data.todayChange)}`}>
                  {data.todayChange >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(data.todayChange), { compact: true })}
                  {' '}({formatPercent(data.todayChangePercent)}) today
                </div>
              )}
            </div>

            {/* Total Invested */}
            <div className="card stat-card">
              <div className="stat-label">Total Invested</div>
              <div className="stat-value">
                {formatCurrency(data?.totalInvested, { compact: true })}
              </div>
              <div className="stat-change neutral">
                Across {data?.portfolios?.length || 0} portfolios
              </div>
            </div>

            {/* Total P&L */}
            <div className="card stat-card">
              <div className="stat-label">
                <FinanceTooltip term="portfolioPnL">Total P&L</FinanceTooltip>
              </div>
              <div className={`stat-value ${getPnLClass(data?.totalPnL)}`}>
                {formatCurrency(data?.totalPnL, { compact: true, signed: true })}
              </div>
              {data?.totalPnLPercent != null && (
                <div className={`stat-change ${getPnLClass(data.totalPnLPercent)}`}>
                  {data.totalPnLPercent >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(data.totalPnLPercent))} overall
                </div>
              )}
            </div>

            {/* Today's Change */}
            <div className="card stat-card">
              <div className="stat-label">Today's Change</div>
              <div className={`stat-value ${getPnLClass(data?.todayChange)}`}>
                {formatCurrency(data?.todayChange, { compact: true, signed: true })}
              </div>
              <div className={`stat-change ${getPnLClass(data?.todayChangePercent)}`}>
                {(data?.todayChangePercent >= 0 ? '▲' : '▼')} {formatPercent(Math.abs(data?.todayChangePercent || 0))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      {!loading && (!data || data.totalInvested === 0) ? (
        <div className="card" style={{ marginTop: 'var(--space-5)' }}>
          <EmptyState
            imageSrc="https://images.unsplash.com/photo-1596522354195-e84ae3c98731?q=80&w=400&auto=format&fit=crop"
            title="Welcome to FinVault"
            description="Add your first Indian stock holding to start tracking your paper portfolio."
            action={() => setShowAddModal(true)}
            actionLabel="+ Add Your First Stock"
          />
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Left column */}
          <div className="dashboard-col-main">
            {/* Portfolio Trend */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Portfolio Value Trend</div>
                  <div className="card-subtitle">Weighted historical performance</div>
                </div>
              </div>
              {loading ? <SkeletonChart height={180} /> : (
                <PortfolioTrendChart data={data?.portfolioHistory || []} />
              )}
            </div>

            {/* Top Movers */}
            <div className="grid-2">
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Top Gainers</div>
                  <span className="badge badge-gain">All Time</span>
                </div>
                {loading ? <SkeletonLoader type="table" count={3} /> : (
                  <div className="movers-list">
                    {data?.topMovers?.gainers?.length === 0 && (
                      <div className="movers-empty">No gainers yet</div>
                    )}
                    {data?.topMovers?.gainers?.map((h, i) => (
                      <MoverRow key={h.ticker || h._id || i} holding={h} isGain />
                    ))}
                  </div>
                )}
              </div>
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Top Losers</div>
                  <span className="badge badge-loss">All Time</span>
                </div>
                {loading ? <SkeletonLoader type="table" count={3} /> : (
                  <div className="movers-list">
                    {data?.topMovers?.losers?.length === 0 && (
                      <div className="movers-empty">No losers yet</div>
                    )}
                    {data?.topMovers?.losers?.map((h, i) => (
                      <MoverRow key={h.ticker || h._id || i} holding={h} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Portfolios Quick View */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Portfolios</div>
                <Link to="/portfolios" className="btn btn-ghost btn-sm">View All →</Link>
              </div>
              {loading ? <SkeletonLoader type="table" count={2} /> : (
                <div className="portfolio-mini-list">
                  {data?.portfolios?.map((p) => (
                    <Link key={p._id} to={`/portfolios/${p._id}`} className="portfolio-mini-row">
                      <div>
                        <div className="portfolio-mini-name">{p.name}</div>
                        <div className="portfolio-mini-count">{p.holdingCount} holding{p.holdingCount !== 1 ? 's' : ''}</div>
                      </div>
                      <div className="portfolio-mini-right">
                        <div className="portfolio-mini-value">{formatCurrency(p.totalCurrentValue, { compact: true })}</div>
                        <span className={`badge ${(p.totalPnL || 0) >= 0 ? 'badge-gain' : 'badge-loss'}`}>
                          {formatPercent(p.totalPnLPercent || 0)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column — Allocation */}
          <div className="dashboard-col-side">
            <div className="card" style={{ height: '100%' }}>
              <div className="card-header">
                <div>
                  <div className="card-title">Asset Allocation</div>
                  <div className="card-subtitle">
                    <FinanceTooltip term="allocation">By current value</FinanceTooltip>
                  </div>
                </div>
              </div>
              {loading ? <SkeletonChart height={220} /> : (
                <AllocationChart allocation={data?.allocation || []} />
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddStockModal
          onClose={() => setShowAddModal(false)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}

function MoverRow({ holding: h, isGain }) {
  return (
    <Link to={`/stock/${h.ticker}`} className="mover-row">
      <div>
        <div className="mover-name">{h.companyName || h.ticker}</div>
        <span className="ticker-badge">{h.ticker}</span>
      </div>
      <div className={`mover-pct ${isGain ? 'gain-text' : 'loss-text'}`}>
        {isGain ? '▲' : '▼'} {formatPercent(Math.abs(h.percentPnL || 0))}
      </div>
    </Link>
  );
}
