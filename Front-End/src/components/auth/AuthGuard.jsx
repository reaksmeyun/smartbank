// Authentication Guard Component - Protected route wrapper with authentication checks
import React, { useEffect, useState, useCallback } from 'react';
import { Shield, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AuthGuard = ({ 
  children, 
  fallback = null, 
  showLoginPrompt = true,
  redirectToLogin = false,
  onAuthRequired = null,
  className = '',
  requireRole = null,
  showSessionInfo = true
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    isInitializing,
    user, 
    sessionStatus,
    clearError,
    error 
  } = useAuth();

  // Local state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState('choice'); // 'choice', 'login', 'register'

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Handle authentication requirement
  useEffect(() => {
    if (!isLoading && !isInitializing && !isAuthenticated) {
      if (redirectToLogin) {
        // In a real app, this would redirect to a login page
        console.log('Redirecting to login page...');
        setShowAuthModal(true);
      } else if (onAuthRequired) {
        onAuthRequired();
      } else if (showLoginPrompt) {
        setShowAuthModal(true);
      }
    }
  }, [isAuthenticated, isLoading, isInitializing, redirectToLogin, onAuthRequired, showLoginPrompt]);

  // Check role requirements
  const hasRequiredRole = useCallback(() => {
    if (!requireRole || !user) {
      return true;
    }
    return user.role === requireRole;
  }, [requireRole, user]);

  // Handle role requirement failure
  useEffect(() => {
    if (user && requireRole && !hasRequiredRole()) {
      console.warn(`Access denied. Required role: ${requireRole}, User role: ${user.role}`);
      // Could show a role-based error message here
    }
  }, [user, requireRole, hasRequiredRole]);

  /**
   * Handle successful authentication
   */
  const handleAuthSuccess = useCallback((authenticatedUser) => {
    setShowAuthModal(false);
    setAuthStep('choice');
    // Optionally refresh the page or trigger a re-render
  }, []);

  /**
   * Handle authentication error
   */
  const handleAuthError = useCallback((errorMessage) => {
    console.error('Authentication error:', errorMessage);
    // Error is handled by the auth context
  }, []);

  /**
   * Switch authentication mode
   */
  const switchAuthMode = useCallback((mode) => {
    setAuthStep(mode);
  }, []);

  /**
   * Close auth modal
   */
  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthStep('choice');
    clearError();
  };

  /**
   * Render loading state
   */
  const renderLoading = () => (
    <div className={`flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 ${className}`}>
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-white border-opacity-20 p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full mb-4">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Checking Authentication</h2>
          <p className="text-gray-300 text-sm">
            Verifying your session and permissions...
          </p>
        </div>
      </div>
    </div>
  );

  /**
   * Render access denied message
   */
  const renderAccessDenied = () => (
    <div className={`flex items-center justify-center min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-pink-900 ${className}`}>
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-white border-opacity-20 p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 bg-opacity-20 rounded-full mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-300 text-sm mb-4">
            You don't have permission to access this resource.
            {requireRole && (
              <span className="block mt-2">
                Required role: <span className="font-semibold text-red-300">{requireRole}</span>
              </span>
            )}
          </p>
          {showLoginPrompt && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 mx-auto"
            >
              <Lock className="w-5 h-5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  /**
   * Render authentication modal
   */
  const renderAuthModal = () => {
    if (!showAuthModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-white border-opacity-20 max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-white border-opacity-10">
            <div className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-500 bg-opacity-20 rounded-full">
                <Lock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Authentication Required</h2>
                <p className="text-gray-300 text-sm">Sign in to continue</p>
              </div>
            </div>
            <button
              onClick={closeAuthModal}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Session Info */}
          {showSessionInfo && sessionStatus && (
            <div className="p-4 border-b border-white border-opacity-10">
              <div className="bg-yellow-500 bg-opacity-20 border border-yellow-400 border-opacity-30 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-yellow-300 font-semibold text-sm">Session Information</h4>
                    <p className="text-yellow-200 text-xs mt-1">
                      Your session has expired or is invalid. Please sign in again to continue.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Auth Mode Selection */}
          {authStep === 'choice' && (
            <div className="p-6">
              <p className="text-gray-300 text-center mb-6">
                Choose how you'd like to authenticate with SmartBank
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => switchAuthMode('login')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Lock className="w-5 h-5" />
                    <span>Sign In</span>
                  </div>
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => switchAuthMode('register')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5" />
                    <span>Create Account</span>
                  </div>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={closeAuthModal}
                  className="text-gray-400 hover:text-white text-sm underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-4 bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-red-300 font-semibold mb-1">Authentication Error</h4>
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Login/Register Forms */}
          <div className="p-6">
            {authStep === 'login' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Sign In</h3>
                  <button
                    onClick={() => setAuthStep('choice')}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    ← Back
                  </button>
                </div>
                {/* Login form would be imported and used here */}
                <div className="text-center text-gray-300 text-sm">
                  Login form component would be rendered here
                  <br />
                  (Import and use LoginForm component)
                </div>
              </div>
            )}

            {authStep === 'register' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Create Account</h3>
                  <button
                    onClick={() => setAuthStep('choice')}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    ← Back
                  </button>
                </div>
                {/* Register form would be imported and used here */}
                <div className="text-center text-gray-300 text-sm">
                  Register form component would be rendered here
                  <br />
                  (Import and use RegisterForm component)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading || isInitializing) {
    return renderLoading();
  }

  // Authentication required but not provided
  if (!isAuthenticated) {
    if (fallback) {
      return fallback;
    }
    
    if (!showLoginPrompt) {
      return null;
    }

    return (
      <>
        {renderAuthModal()}
        {children}
      </>
    );
  }

  // Role requirement check
  if (requireRole && !hasRequiredRole()) {
    return renderAccessDenied();
  }

  // Authentication successful, render children
  return (
    <>
      {children}
      {renderAuthModal()}
    </>
  );
};

// Higher-order component for easy wrapping
export const withAuthGuard = (Component, options = {}) => {
  return function AuthenticatedComponent(props) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
};

// Export both the component and HOC
export default AuthGuard;
