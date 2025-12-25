// src/App.jsx
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Web3Provider } from './contexts/Web3Context';
import { useAuthGuard } from './hooks/useAuthGuard';
import HomePage from './pages/Home';
import DepositPage from './pages/Deposit';
import WithdrawPage from './pages/Withdraw';
import DashboardPage from './pages/Dashboard';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ProfilePage from './pages/Profile';
import AuthGuard from './components/auth/AuthGuard';
import Navbar from './components/Navbar';
import { Loader2, AlertCircle } from 'lucide-react';

// Loading component
const AppLoading = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
    <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-white border-opacity-20 p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full mb-4">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Initializing SmartBank</h2>
      <p className="text-gray-300 text-sm">
        Setting up authentication and Web3 connection...
      </p>
    </div>
  </div>
);

// Error boundary component
const AppError = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-pink-900 flex items-center justify-center">
    <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-white border-opacity-20 p-8 max-w-md w-full mx-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 bg-opacity-20 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Application Error</h2>
        <p className="text-gray-300 text-sm mb-4">
          {error || 'An unexpected error occurred while loading the application.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  </div>
);

// Protected page wrapper with authentication guards
const ProtectedPage = ({ children, requireRole = null, fallback = null }) => {
  const guard = useAuthGuard({
    requireAuth: true,
    requireRole,
    showError: false,
    autoRedirect: false
  });

  if (!guard.isReady) {
    return <AppLoading />;
  }

  if (guard.accessDenied) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-white border-opacity-20 p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-300 text-sm mb-4">{guard.denyReason}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      {children}
    </AuthGuard>
  );
};

// Main application content with routing
const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const { isAuthenticated, isInitializing, user, logout } = useAuth();

  // Auto-redirect logic - hooks must be called before any early returns
  useEffect(() => {
    // Redirect authenticated users away from auth pages
    if (isAuthenticated && ['login', 'register'].includes(currentPage)) {
      setCurrentPage('dashboard');
    }

    // Redirect unauthenticated users from protected pages
    if (!isAuthenticated && ['dashboard', 'deposit', 'withdraw', 'profile'].includes(currentPage)) {
      setCurrentPage('home');
    }
  }, [isAuthenticated, currentPage]);

  // Navigation handler with authentication checks
  const handleNavigate = (page) => {
    // Check if navigation requires authentication
    const authRequiredPages = ['dashboard', 'deposit', 'withdraw', 'profile'];

    if (authRequiredPages.includes(page) && !isAuthenticated) {
      setCurrentPage('login');
      return;
    }

    setCurrentPage(page);
  };

  // Show loading during initialization with a timeout to prevent infinite loading
  // But allow content to show after a short delay to prevent hanging
  if (isInitializing) {
    // Add a small delay to prevent immediate loading state
    setTimeout(() => {
      // Force show content after 2 seconds to prevent hanging
      if (isInitializing) {
        console.warn('Authentication initialization taking too long, showing content anyway');
        window.dispatchEvent(new CustomEvent('force-show-content'));
      }
    }, 2000);

    // Only show loading for first 2 seconds
    return <AppLoading />;
  }

  // Render page content based on current route
  const renderPage = () => {
    try {
      switch (currentPage) {
        case 'home':
          return <HomePage onNavigate={handleNavigate} />;
        
        case 'login':
          return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
              <div className="container mx-auto px-4 py-8">
                <div className="max-w-md mx-auto">
                  <LoginPage onSuccess={() => handleNavigate('dashboard')} onCancel={() => handleNavigate('home')} />
                </div>
              </div>
            </div>
          );
        
        case 'register':
          return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
              <div className="container mx-auto px-4 py-8">
                <div className="max-w-md mx-auto">
                  <RegisterPage onSuccess={() => handleNavigate('dashboard')} onCancel={() => handleNavigate('home')} />
                </div>
              </div>
            </div>
          );
        
        case 'dashboard':
          return (
            <ProtectedPage>
              <DashboardPage onNavigate={handleNavigate} />
            </ProtectedPage>
          );
        
        case 'deposit':
          return (
            <ProtectedPage>
              <DepositPage onNavigate={handleNavigate} />
            </ProtectedPage>
          );
        
        case 'withdraw':
          return (
            <ProtectedPage>
              <WithdrawPage onNavigate={handleNavigate} />
            </ProtectedPage>
          );
        
        case 'profile':
          return (
            <ProtectedPage>
              <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
                <ProfilePage onNavigate={handleNavigate} />
              </div>
            </ProtectedPage>
          );
        
        default:
          return <HomePage onNavigate={handleNavigate} />;
      }
    } catch (pageError) {
      console.error('Page rendering error:', pageError);
      return <AppError error={pageError.message || 'Failed to render page'} onRetry={() => window.location.reload()} />;
    }
  };

  // Get current page for navbar
  const getCurrentPageForNavbar = () => {
    if (['login', 'register', 'profile'].includes(currentPage)) {
      return currentPage === 'profile' ? 'profile' : 'home';
    }
    return currentPage;
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      {currentPage !== 'login' && currentPage !== 'register' && (
        <Navbar 
          currentPage={getCurrentPageForNavbar()} 
          onNavigate={handleNavigate}
          user={user}
          isAuthenticated={isAuthenticated}
          onLogout={logout}
        />
      )}
      
      {/* Page Content */}
      {renderPage()}
    </div>
  );
};

// Main App component with providers
export default function App() {
  // Error boundary for the entire app
  // Note: Using global error handling via AuthContext for now

  return (
    <div className="App">
      <AuthProvider>
        <Web3Provider>
          <AppContent />
        </Web3Provider>
      </AuthProvider>
    </div>
  );
}
