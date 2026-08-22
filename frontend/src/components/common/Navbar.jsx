import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">🔍 Retrievo</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-primary transition-colors">
              Home
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link to="/post-item" className="btn-primary text-sm">
                  + Post Item
                </Link>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {user?.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-danger hover:text-danger/80 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary transition-colors">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Register
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-gray-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              <Link to="/" className="text-gray-700 hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="text-gray-700 hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <Link to="/post-item" className="btn-primary text-center" onClick={() => setIsMenuOpen(false)}>
                    + Post Item
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-danger text-left hover:text-danger/80"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary text-center" onClick={() => setIsMenuOpen(false)}>
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
