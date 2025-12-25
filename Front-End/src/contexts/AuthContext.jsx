// Authentication Context - Global authentication state management
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import authService from '../services/authService';
import { AUTH_ERRORS } from '../config/authConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // State management
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [sessionStatus, setSessionStatus] = useState(null);

  // Initialize authentication service
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setIsInitializing(true);

        // Initialize auth service with timeout
        const initTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth initialization timeout')), 5000);
        });

        const initPromise = authService.initialize();
        
        await Promise.race([initPromise, initTimeout]);

        // Check if user is already authenticated
        if (authService.isUserAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
        }

        // Set up event listeners
        authService.addEventListener('user_logged_in', handleUserLoggedIn);
        authService.addEventListener('user_logged_out', handleUserLoggedOut);
        authService.addEventListener('user_registered', handleUserRegistered);
        authService.addEventListener('profile_updated', handleProfileUpdated);
        authService.addEventListener('session_restored', handleSessionRestored);

        setIsInitializing(false);
      } catch (error) {
        console.warn('Authentication initialization failed:', error.message);
        setError('Authentication service unavailable - running in development mode');
        setIsInitializing(false); // Ensure initialization completes even on error
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Add a fallback timeout to ensure initialization always completes
    const timeoutId = setTimeout(() => {
      if (isInitializing) {
        console.warn('Authentication initialization timed out, forcing completion');
        setIsInitializing(false);
        setError('Authentication initialization timed out');
      }
    }, 3000); // Reduced to 3 second timeout

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      authService.removeEventListener('user_logged_in', handleUserLoggedIn);
      authService.removeEventListener('user_logged_out', handleUserLoggedOut);
      authService.removeEventListener('user_registered', handleUserRegistered);
      authService.removeEventListener('profile_updated', handleProfileUpdated);
      authService.removeEventListener('session_restored', handleSessionRestored);
    };
  }, []);

  // Event handlers
  const handleUserLoggedIn = useCallback((userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setError(null);
    updateSessionStatus();
  }, []);

  const handleUserLoggedOut = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    setSessionStatus(null);
  }, []);

  const handleUserRegistered = useCallback((userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setError(null);
    updateSessionStatus();
  }, []);

  const handleProfileUpdated = useCallback((userData) => {
    setUser(userData);
  }, []);

  const handleSessionRestored = useCallback((userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    updateSessionStatus();
  }, []);

  // Update session status
  const updateSessionStatus = useCallback(() => {
    const status = authService.getSessionStatus();
    setSessionStatus(status);
  }, []);

  // Authentication methods
  const login = useCallback(async (walletData) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authService.login(walletData);
      
      if (result.success) {
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (error) {
      const errorMessage = error.message || AUTH_ERRORS.UNKNOWN_ERROR;
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        user: null
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (walletData, userInfo = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authService.register(walletData, userInfo);
      
      if (result.success) {
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (error) {
      const errorMessage = error.message || AUTH_ERRORS.UNKNOWN_ERROR;
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        user: null
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      setIsLoading(true);
      authService.logout();
      // State will be updated by event listener
    } catch (error) {
      console.error('Logout error:', error);
      setError('Logout failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestAuthSignature = useCallback(async (address) => {
    try {
      setError(null);
      return await authService.requestAuthSignature(address);
    } catch (error) {
      const errorMessage = error.message || AUTH_ERRORS.UNKNOWN_ERROR;
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
    try {
      setError(null);
      const success = await authService.updateProfile(updates);
      if (!success) {
        setError('Failed to update profile');
      }
      return success;
    } catch (error) {
      const errorMessage = error.message || 'Profile update failed';
      setError(errorMessage);
      return false;
    }
  }, []);

  const extendSession = useCallback(() => {
    try {
      return authService.extendSession();
    } catch (error) {
      console.error('Failed to extend session:', error);
      return false;
    }
  }, []);

  const checkRole = useCallback((role) => {
    return authService.hasRole(role);
  }, []);

  const isAdmin = useCallback(() => {
    return authService.isAdmin();
  }, []);

  const getSessionStatus = useCallback(() => {
    return authService.getSessionStatus();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-refresh session status
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        updateSessionStatus();
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, updateSessionStatus]);

  // Context value
  const contextValue = {
    // State
    user,
    isAuthenticated,
    isLoading,
    isInitializing,
    error,
    sessionStatus,

    // Authentication methods
    login,
    register,
    logout,
    requestAuthSignature,
    updateProfile,
    extendSession,

    // Utility methods
    checkRole,
    isAdmin,
    getSessionStatus,
    clearError,

    // Computed properties
    hasRole: checkRole,
    isAuthenticatedAndAdmin: isAuthenticated && isAdmin(),
    isSessionExpiringSoon: sessionStatus?.timeRemaining <= 30 * 60 * 1000,
    timeRemaining: sessionStatus?.timeRemaining || 0
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Higher-order component for protected components
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
          <div className="bg-white bg-opacity-10 backdrop-blur-md p-8 rounded-xl border border-white border-opacity-20 max-w-md w-full mx-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
              <p className="text-gray-300 mb-6">
                Please authenticate to access this page.
              </p>
              <p className="text-sm text-gray-400">
                You will be redirected to the login page automatically.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

// Export the context for advanced usage
export { AuthContext };

export default AuthProvider;
