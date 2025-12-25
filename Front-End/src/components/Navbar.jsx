// src/components/Navbar.jsx - Enhanced with Authentication Integration
import React, { useState } from 'react';
import { Shield, User, LogOut, Settings, ChevronDown, Wallet, CheckCircle } from 'lucide-react';
import { getButtonClasses, getStatusColorClass } from '../utils/designUtils';

const Navbar = ({ 
  currentPage, 
  onNavigate, 
  user, 
  isAuthenticated, 
  onLogout,
  brandColor = "blue-400" 
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Navigation items - some require authentication
  const publicNavItems = [
    { id: 'home', label: 'Home', requiresAuth: false }
  ];

  const protectedNavItems = [
    { id: 'deposit', label: 'Deposit', requiresAuth: true },
    { id: 'withdraw', label: 'Withdraw', requiresAuth: true },
    { id: 'dashboard', label: 'Dashboard', requiresAuth: true }
  ];

  const authNavItems = [
    { id: 'login', label: 'Login', requiresAuth: false, authOnly: false },
    { id: 'register', label: 'Register', requiresAuth: false, authOnly: false }
  ];

  /**
   * Handle user logout
   */
  const handleLogout = () => {
    onLogout?.();
    setShowUserMenu(false);
    onNavigate('home');
  };

  /**
   * Handle navigation with auth checks
   */
  const handleNavClick = (pageId) => {
    // If navigation requires auth but user is not authenticated, redirect to login
    const requiresAuth = [...publicNavItems, ...protectedNavItems].find(item => item.id === pageId)?.requiresAuth;
    if (requiresAuth && !isAuthenticated) {
      onNavigate('login');
      return;
    }

    onNavigate(pageId);
  };

  /**
   * Render authentication status indicator
   */
  const renderAuthStatus = () => {
    if (!isAuthenticated) {
      return (
        <div className={`flex items-center space-x-2 ${getStatusColorClass('disconnected')}`}>
          <Wallet className="w-4 h-4" />
          <span className="text-sm font-medium">Not Connected</span>
        </div>
      );
    }

    return (
      <div className={`flex items-center space-x-2 ${getStatusColorClass('connected')}`}>
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Authenticated</span>
        {user?.role === 'admin' && (
          <span className="bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold animate-glow">
            ADMIN
          </span>
        )}
      </div>
    );
  };

  /**
   * Render user menu dropdown
   */
  const renderUserMenu = () => {
    if (!isAuthenticated || !user) return null;

    return (
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center space-x-3 text-gray-300 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-white hover:bg-opacity-10"
        >
          <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-semibold hidden sm:block">
            {user.username || `User ${user.address?.slice(2, 6)}`}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
        </button>

        {showUserMenu && (
          <div className="absolute right-0 mt-3 w-64 glass-card border border-white border-opacity-20 rounded-xl shadow-2xl z-50 animate-scale-in">
            <div className="p-4">
              {/* User Info */}
              <div className="pb-3 border-b border-white border-opacity-10 mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">
                      {user.username || `User ${user.address?.slice(2, 6)}`}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {user.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : 'No address'}
                    </p>
                    <p className="text-gray-400 text-xs capitalize font-medium">
                      Role: {user.role || 'user'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    onNavigate('profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white transition-all duration-200 rounded-lg flex items-center space-x-3"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Profile Settings</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500 hover:bg-opacity-20 hover:text-red-300 transition-all duration-200 rounded-lg flex items-center space-x-3"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render navigation button
   */
  const renderNavButton = (item) => {
    const isActive = currentPage === item.id;
    const requiresAuth = item.requiresAuth;
    const isDisabled = requiresAuth && !isAuthenticated;

    return (
      <button
        key={item.id}
        onClick={() => handleNavClick(item.id)}
        disabled={isDisabled}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
          isActive 
            ? 'bg-white bg-opacity-20 text-white shadow-lg' 
            : isDisabled
            ? 'text-gray-500 cursor-not-allowed'
            : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
        }`}
        title={isDisabled ? 'Authentication required' : item.label}
      >
        {item.label}
      </button>
    );
  };

  return (
    <nav className="glass-nav border-b border-white border-opacity-10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center space-x-3 hover:opacity-80 transition-all duration-200 group"
            >
              <div className="p-2 rounded-lg bg-white bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-200">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-white group-hover:text-blue-200 transition-colors duration-200">
                SmartBank
              </span>
            </button>

            {/* Auth Status Indicator */}
            <div className="hidden lg:block">
              {renderAuthStatus()}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            {/* Public Navigation */}
            <div className="hidden md:flex space-x-2">
              {publicNavItems.map(renderNavButton)}
            </div>

            {/* Protected Navigation - Show only if authenticated */}
            {isAuthenticated && (
              <div className="hidden md:flex space-x-2">
                {protectedNavItems.map(renderNavButton)}
              </div>
            )}

            {/* Authentication Actions */}
            <div className="flex items-center space-x-3">
              {!isAuthenticated ? (
                // Show Login/Register buttons for unauthenticated users
                <div className="flex space-x-2">
                  {authNavItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        currentPage === item.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'glass-card border border-white border-opacity-20 text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : (
                // Show user menu for authenticated users
                <div className="flex items-center space-x-3">
                  {renderUserMenu()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-white border-opacity-10 pt-3 pb-3">
          <div className="flex flex-wrap gap-2">
            {/* Public nav items */}
            {publicNavItems.map(renderNavButton)}
            
            {/* Protected nav items - show if authenticated */}
            {isAuthenticated && protectedNavItems.map(renderNavButton)}
            
            {/* Auth status for mobile */}
            <div className="w-full mt-2">
              {renderAuthStatus()}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
