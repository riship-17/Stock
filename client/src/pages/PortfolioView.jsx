import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePortfolioHoldings, usePortfolios } from '../hooks/usePortfolio';
import { deleteHolding } from '../api/holdings';
import { formatCurrency, formatPercent, getPnLClass } from '../utils/currency';
import HoldingsTable from '../components/HoldingsTable';
import AddStockModal from '../components/AddStockModal';
import SkeletonLoader, { SkeletonStatCard } from '../components/SkeletonLoader';
import './PortfolioView.css';

export default function PortfolioView() {
  const { id } = useParams();
  const { portfolios } = usePortfolios();
  const { holdings, summary, loading, error, refetch } = usePortfolioHoldings(id);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const portfolio = portfolios.find((p) => p._id === id);

  const handleDelete = async (holdingId) => {
    if (!window.confirm('Remove this holding?')) return;
    setDeleting(holdingId);
    try {
      await deleteHolding(holdingId);
      refetch();
    } finally {
      setDeleting(null);
    }
  };

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/portfolios" className="breadcrumb-link">Portfolios</Link>
        <span className="breadcrumb-sep">›</span>
        <span>{portfolio?.name || 'Portfolio'}</span>
      </div>

      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">{portfolio?.name || 'Portfolio'}</h1>
          {portfolio?.description && (
            <div className="section-subtitle">{portfolio.description}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={refetch}
            disabled={loading}
            id="refresh-portfolio-btn"
          >
            Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            id="portfolio-add-stock-btn"
          >
            + Add Stock
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        {loading ? (
          [1,2,3,4].map((i) => <SkeletonStatCard key={i} />)
        ) : summary ? (
          <>
            <div className="card stat-card-mini">
              <div className="stat-label">Current Value</div>
              <div className="stat-value">{formatCurrency(summary.totalCurrentValue, { compact: true })}</div>
            </div>
            <div className="card stat-card-mini">
              <div className="stat-label">Invested</div>
              <div className="stat-value">{formatCurrency(summary.totalInvested, { compact: true })}</div>
            </div>
            <div className="card stat-card-mini">
              <div className="stat-label">Total P&L</div>
              <div className={`stat-value ${getPnLClass(summary.totalPnL)}`}>
                {formatCurrency(summary.totalPnL, { compact: true, signed: true })}
              </div>
            </div>
            <div className="card stat-card-mini">
              <div className="stat-label">Return</div>
              <div className={`stat-value ${getPnLClass(summary.totalPnLPercent)}`}>
                {formatPercent(summary.totalPnLPercent)}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Holdings Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Holdings</div>
            <div className="card-subtitle">{holdings.length} stocks</div>
          </div>
        </div>
        <HoldingsTable
          holdings={holdings}
          loading={loading}
          onAddStock={() => setShowAddModal(true)}
          onDeleteHolding={handleDelete}
        />
      </div>

      {showAddModal && (
        <AddStockModal
          defaultPortfolioId={id}
          onClose={() => setShowAddModal(false)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
