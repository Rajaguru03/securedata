import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-term-base border-b border-term-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-12">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="font-mono text-sm text-term-default hover:text-primary transition-colors">
              <span className="text-term-muted">[</span>
              <span className="text-primary">sc</span>
              <span className="text-term-muted">]</span>
              <span className="ml-2 text-term-subtle">securecard</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="font-mono text-sm text-term-subtle hover:text-primary transition-colors px-2 py-1"
                >
                  ~/dashboard
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="font-mono text-sm text-term-subtle hover:text-term-default focus:outline-none transition-colors"
                  >
                    <span className="text-term-muted">[</span>
                    <span className="text-term-subtle">u</span>
                    <span className="text-term-muted">]</span>
                    <span className="ml-1">{user?.name?.split(' ')[0].toLowerCase()}</span>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-term-surface border border-term-border py-1 z-50 animate-fade-in" style={{ borderRadius: '2px' }}>
                      <div className="px-4 py-2 border-b border-term-border">
                        <p className="text-xs font-mono text-term-default">{user?.name}</p>
                        <p className="text-xs font-mono text-term-muted">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center w-full px-4 py-2 text-xs font-mono text-term-subtle hover:bg-term-base hover:text-primary transition-colors"
                      >
                        ~/profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-xs font-mono text-danger hover:bg-danger-muted transition-colors"
                      >
                        logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-mono text-sm text-term-subtle hover:text-primary transition-colors px-2 py-1"
                >
                  login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-xs px-3 py-1"
                >
                  register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="font-mono text-xs text-term-subtle hover:text-term-default focus:outline-none"
            >
              {mobileMenuOpen ? '[x]' : '[menu]'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-term-border">
          <div className="px-4 py-3 space-y-2">
            {isAuthenticated ? (
              <>
                <div className="py-2 border-b border-term-border mb-2">
                  <p className="text-xs font-mono text-term-default">{user?.name}</p>
                  <p className="text-xs font-mono text-term-muted">{user?.email}</p>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-mono text-term-subtle hover:text-primary transition-colors"
                >
                  ~/dashboard
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-mono text-term-subtle hover:text-primary transition-colors"
                >
                  ~/profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 text-sm font-mono text-danger hover:text-danger transition-colors"
                >
                  logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-mono text-term-subtle hover:text-primary transition-colors"
                >
                  login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-mono text-primary"
                >
                  register
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
