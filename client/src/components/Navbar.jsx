import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/contact', label: 'About & Contact' }
];

function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleLabel = user?.role === 'farmer' ? 'Farmer' : user?.role === 'buyer' ? 'Buyer' : user?.role;
  const roleEmoji = user?.role === 'farmer' ? '🌾' : '🏢';
  const displayName = user ? (user.full_name || user.full_Name || 'Account') : '';

  return (
    <nav>
      <div className="nav-inner">
        <Link className="logo" to="/">
          <div className="logo-icon">🌱</div>
          <div>
            <div className="logo-text">Shamba Direct</div>
            <div className="logo-sub">Kenya's Farm Marketplace</div>
          </div>
        </Link>
        <div className="nav-links">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              className={`nav-link${pathname === item.to ? ' active' : ''}`}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
          <Link
            className={`btn-nav-login${pathname === '/dashboard' ? ' active' : ''}`}
            to="/dashboard"
          >
            Dashboard
          </Link>

          {isLoggedIn ? (
            <>
              {/* Clearly shows who is signed in and whether they're a
                  farmer (seller) or buyer, with distinct colour-coding
                  so the two roles are easy to tell apart at a glance. */}
              <span
                className={`nav-role-badge nav-role-badge--${user.role}`}
                title={`Signed in as ${roleLabel}`}
              >
                <span className="nav-role-badge-icon">{roleEmoji}</span>
                <span className="nav-role-badge-text">
                  <span className="nav-role-badge-name">{displayName}</span>
                  <span className="nav-role-badge-role">{roleLabel}</span>
                </span>
              </span>
              <button type="button" className="btn-nav-logout" onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : (
            <Link
              className={`btn-nav-register${pathname === '/register' ? ' active' : ''}`}
              to="/register"
            >
              Register Free
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
