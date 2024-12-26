import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';
import { FiHome, FiSettings, FiLogOut, FiUser, FiGrid, FiDollarSign, FiMenu, FiX, FiBook } from 'react-icons/fi';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/', icon: FiHome, label: 'Home', public: true },
    { path: '/dashboard', icon: FiGrid, label: 'Dashboard', protected: true },
    { path: '/guide', icon: FiBook, label: 'Guide', protected: true },
    { path: '/settings', icon: FiSettings, label: 'Settings', protected: true },
    { path: '/pricing', icon: FiDollarSign, label: 'Pricing', public: true },
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await logout();
      // The AuthContext will handle the redirect after successful logout
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-foreground border-b border-border relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="text-primary font-bold text-xl">
                FeedbackFlow
              </Link>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:ml-6 lg:space-x-4">
              {navLinks.map(({ path, icon: Icon, label, public: isPublic, protected: isProtected }) => {
                if ((isPublic && !currentUser) || (isProtected && currentUser) || isPublic) {
                  return (
                    <Link
                      key={path}
                      to={path}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive(path) ? 'nav-link-active' : 'nav-link'
                        }`}
                    >
                      <Icon className="mr-1.5 h-5 w-5" />
                      {label}
                    </Link>
                  );
                }
                return null;
              })}
            </div>
          </div>

          {/* Desktop Right Menu */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            <ThemeSwitcher />
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <div className="text-secondary-foreground">
                  <FiUser className="h-5 w-5" />
                </div>
                <button
                  onClick={handleSignOut}
                  className="button-primary inline-flex items-center px-3 py-2 text-sm font-medium rounded-md"
                >
                  <FiLogOut className="mr-1.5 h-5 w-5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/signin"
                className="button-primary inline-flex items-center px-3 py-2 text-sm font-medium rounded-md"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-secondary-foreground hover:text-primary hover:bg-primary-10 focus:outline-none"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <FiX className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <FiMenu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden transition-all duration-200 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          } absolute top-16 inset-x-0 z-50`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 bg-foreground border-b border-border shadow-lg">
          {navLinks.map(({ path, icon: Icon, label, public: isPublic, protected: isProtected }) => {
            if ((isPublic && !currentUser) || (isProtected && currentUser) || isPublic) {
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={closeMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isActive(path) ? 'nav-link-active' : 'nav-link'
                    }`}
                >
                  <div className="flex items-center">
                    <Icon className="mr-1.5 h-5 w-5" />
                    {label}
                  </div>
                </Link>
              );
            }
            return null;
          })}
          <div className="pt-4 flex flex-col space-y-4">
            <div className="px-3">
              <ThemeSwitcher />
            </div>
            {currentUser ? (
              <div className="space-y-4">
                <div className="flex items-center px-3">
                  <FiUser className="h-5 w-5 text-secondary-foreground" />
                </div>
                <button
                  onClick={() => {
                    handleSignOut();
                    closeMenu();
                  }}
                  className="w-full button-primary flex items-center px-3 py-2 text-sm font-medium rounded-md"
                >
                  <FiLogOut className="mr-1.5 h-5 w-5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/signin"
                onClick={closeMenu}
                className="button-primary flex items-center px-3 py-2 text-sm font-medium rounded-md mx-3"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
