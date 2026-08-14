import { useState, useEffect, Suspense, lazy } from 'react';
import { Menu, Search } from 'lucide-react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { userLoaded, authError } from './store/authSlice';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Lazy loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PortfolioListPage = lazy(() => import('./pages/PortfolioListPage'));
const PortfolioView = lazy(() => import('./pages/PortfolioView'));
const StockDetailPage = lazy(() => import('./pages/StockDetailPage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const ScreenerPage = lazy(() => import('./pages/ScreenerPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const TaxPage = lazy(() => import('./pages/TaxPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Close sidebar on nav
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        portfolios={[]} // We'll fetch portfolios dynamically in the sidebar or via context/redux
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="main-content relative bg-gray-50 min-h-screen">
        {/* Mobile Header */}
        <div className="mobile-header lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <button
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-lg text-gray-900">FinVault</span>
          <div className="w-10"></div>
        </div>

        <Suspense fallback={<div className="h-full w-full flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/portfolios" element={<PortfolioListPage />} />
              <Route path="/portfolios/:id" element={<PortfolioView />} />
              <Route path="/stock/:ticker" element={<StockDetailPage />} />
              <Route path="/watchlist" element={<WatchlistPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/screener" element={<ScreenerPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/tax" element={<TaxPage />} />
              <Route path="*" element={
                <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                  <div className="text-4xl mb-4"><Search size={48} className="text-gray-400" /></div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
                  <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
                  <a href="/" className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">Go to Dashboard</a>
                </div>
              } />
            </Route>
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await axios.get('http://localhost:5050/api/auth/me');
          if (res.data.success) {
            dispatch(userLoaded(res.data.data));
          }
        } catch (err) {
          dispatch(authError());
        }
      } else {
        dispatch(authError());
      }
    };
    loadUser();
  }, [dispatch]);

  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
