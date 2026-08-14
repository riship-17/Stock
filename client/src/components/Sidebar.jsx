import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { 
  LayoutDashboard, 
  Briefcase, 
  Eye, 
  ListOrdered, 
  Search, 
  BellRing, 
  Newspaper, 
  Trophy, 
  Receipt,
  LogOut,
  TrendingUp
} from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/portfolios', label: 'Portfolios', icon: Briefcase },
  { path: '/watchlist', label: 'Watchlist', icon: Eye },
  { path: '/transactions', label: 'Transactions', icon: ListOrdered },
  { path: '/screener', label: 'Screener', icon: Search },
  { path: '/alerts', label: 'Alerts', icon: BellRing },
  { path: '/news', label: 'News', icon: Newspaper },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/tax', label: 'Tax & Gains', icon: Receipt },
];

export default function Sidebar({ portfolios = [], onMobileClose, mobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [expandedPortfolios, setExpandedPortfolios] = useState(true);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={onMobileClose} />
      )}

      <aside className={`sidebar${mobileOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <TrendingUp size={24} strokeWidth={3} />
          </div>
          <div>
            <div className="sidebar-logo-title">FinVault</div>
            <div className="sidebar-logo-sub">Paper Trading</div>
          </div>
        </div>

        <div className="sidebar-divider" />

        {/* Main Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-nav-item${isActive(item.path) ? ' active' : ''}`}
                onClick={onMobileClose}
              >
                <span className="sidebar-nav-icon"><Icon size={20} strokeWidth={2.5} /></span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-divider" />

        {/* Portfolios quick-nav */}
        {portfolios.length > 0 && (
          <div className="sidebar-section">
            <button
              className="sidebar-section-header"
              onClick={() => setExpandedPortfolios((v) => !v)}
            >
              <span>Portfolios</span>
              <span className={`sidebar-chevron${expandedPortfolios ? ' up' : ''}`}>›</span>
            </button>
            {expandedPortfolios && (
              <div className="sidebar-portfolio-list">
                {portfolios.map((p) => (
                  <Link
                    key={p._id}
                    to={`/portfolios/${p._id}`}
                    className={`sidebar-portfolio-item${location.pathname === `/portfolios/${p._id}` ? ' active' : ''}`}
                    onClick={onMobileClose}
                  >
                    <span className="sidebar-portfolio-dot" />
                    <span className="sidebar-portfolio-name">{p.name}</span>
                    <span className="sidebar-portfolio-count">{p.holdingCount || 0}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="sidebar-spacer" />

        {/* Footer */}
        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button 
            onClick={handleLogout}
            className="sidebar-nav-item logout-btn"
          >
            <span className="sidebar-nav-icon"><LogOut size={20} strokeWidth={2.5} /></span>
            <span>Logout</span>
          </button>
          <div className="sidebar-disclaimer">
            Note: Paper trading only. No real money involved.
          </div>
        </div>
      </aside>
    </>
  );
}
