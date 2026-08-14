import { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePortfolios } from '../hooks/usePortfolio';
import { formatCurrency, formatPercent, getPnLClass } from '../utils/currency';
import EmptyState from '../components/EmptyState';
import AddStockModal from '../components/AddStockModal';
import { SkeletonStatCard } from '../components/SkeletonLoader';
import './PortfolioListPage.css';

export default function PortfolioListPage() {
  const { portfolios, loading, error, create, remove, refetch } = usePortfolios();
  const [showAdd, setShowAdd] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const handleCreatePortfolio = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      await create({ name: newName.trim(), description: newDesc.trim() });
      setNewName('');
      setNewDesc('');
      setShowAdd(false);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete portfolio "${name}" and all its holdings?`)) return;
    await remove(id);
  };

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">My Portfolios</h1>
          <div className="section-subtitle">Manage your investment portfolios</div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary" onClick={() => setShowAdd((v) => !v)} id="create-portfolio-btn">
            {showAdd ? 'Cancel' : '+ New Portfolio'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddStock(true)} id="portfoliolist-add-stock-btn">
            + Add Stock
          </button>
        </div>
      </div>

      {/* Create Portfolio Form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Create Portfolio</div>
          {createError && <div className="alert alert-error" style={{ marginBottom: 'var(--space-3)' }}>{createError}</div>}
          <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Long Term"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePortfolio()}
                autoFocus
                id="portfolio-name-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="Optional description"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleCreatePortfolio}
              disabled={!newName.trim() || creating}
              id="create-portfolio-submit-btn"
            >
              {creating ? <><span className="spinner spinner-sm" /> Creating…</> : 'Create Portfolio'}
            </button>
          </div>
        </div>
      )}

      {/* Portfolio Cards */}
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <div className="portfolio-grid">
          {[1,2,3].map((i) => <SkeletonStatCard key={i} />)}
        </div>
      ) : portfolios.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Briefcase}
            title="No portfolios yet"
            description="Create your first portfolio to start tracking your investments."
            action={() => setShowAdd(true)}
            actionLabel="+ Create Portfolio"
          />
        </div>
      ) : (
        <div className="portfolio-grid">
          {portfolios.map((p) => (
            <div key={p._id} className="card portfolio-card">
              <div className="portfolio-card-header">
                <div>
                  <div className="portfolio-card-name">{p.name}</div>
                  {p.description && (
                    <div className="portfolio-card-desc">{p.description}</div>
                  )}
                </div>
                <button
                  className="btn btn-danger btn-icon btn-sm"
                  onClick={() => handleDelete(p._id, p.name)}
                  aria-label={`Delete ${p.name}`}
                  id={`delete-portfolio-${p._id}`}
                >✕</button>
              </div>
              <div className="portfolio-card-stats">
                <div className="portfolio-card-stat">
                  <div className="stat-label">Holdings</div>
                  <div className="portfolio-card-stat-val">{p.holdingCount}</div>
                </div>
                {p.totalCurrentValue != null && (
                  <>
                    <div className="portfolio-card-stat">
                      <div className="stat-label">Value</div>
                      <div className="portfolio-card-stat-val">{formatCurrency(p.totalCurrentValue, { compact: true })}</div>
                    </div>
                    <div className="portfolio-card-stat">
                      <div className="stat-label">P&L</div>
                      <div className={`portfolio-card-stat-val ${getPnLClass(p.totalPnL)}`}>
                        {formatPercent(p.totalPnLPercent || 0)}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <Link
                to={`/portfolios/${p._id}`}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-4)' }}
                id={`view-portfolio-${p._id}`}
              >
                View Holdings →
              </Link>
            </div>
          ))}
        </div>
      )}

      {showAddStock && (
        <AddStockModal
          onClose={() => setShowAddStock(false)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
