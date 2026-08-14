import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerSuccess, authError } from '../store/authSlice';
import api from '../api/axios';
import { UserPlus } from 'lucide-react';
import './Auth.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', { name, email, password });
      if (res.data.success) {
        dispatch(registerSuccess({ token: res.data.token, user: res.data.user }));
        navigate('/');
      }
    } catch (err) {
      dispatch(authError());
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      {/* Left Pane - Image */}
      <div className="auth-pane-image">
        <div className="auth-bg-overlay"></div>
        <img 
          src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2000&auto=format&fit=crop" 
          alt="Abstract financial background" 
          className="auth-bg-image"
        />
        <div className="auth-hero-content">
          <h1 className="auth-hero-title">StockTrackr</h1>
          <p className="auth-hero-subtitle">The most elegant way to track your portfolio and discover new opportunities.</p>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="auth-pane-form">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-logo-icon">
              <UserPlus size={24} />
            </div>
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">Start tracking your portfolio with FinVault</p>
          </div>
        
          {error && <div className="auth-error">{error}</div>}
        
          <form onSubmit={handleRegister} className="form-group" style={{ gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                required
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg mt-2" style={{ width: '100%' }}>
              Create Account
            </button>
          </form>
        
          <p className="auth-footer">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
