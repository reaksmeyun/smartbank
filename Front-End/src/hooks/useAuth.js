// useAuth Hook - Custom hook for authentication state and operations
import { useAuth as useAuthContext } from '../contexts/AuthContext';
import { useCallback, useMemo } from 'react';
import { AUTH_ERRORS, AUTH_CONFIG } from '../config/authConfig';

export const useAuth = () => {
  const authContext = useAuthContext();

  // Memoized user data for performance
  const user = useMemo(() => authContext.user, [authContext.user]);
  const sessionStatus = useMemo(() => authContext.sessionStatus, [authContext.sessionStatus]);

  // Authentication state
  const isAuthenticated = authContext.isAuthenticated;
  const isLoading = authContext.isLoading;
  const isInitializing = authContext.isInitializing;
  const error = authContext.error;

  // Authentication methods
  const login = useCallback(authContext.login, [authContext.login]);
  const register = useCallback(authContext.register, [authContext.register]);
  const logout = useCallback(authContext.logout, [authContext.logout]);
  const requestAuthSignature = useCallback(authContext.requestAuthSignature, [authContext.requestAuthSignature]);
  const updateProfile = useCallback(authContext.updateProfile, [authContext.updateProfile]);
  const extendSession = useCallback(authContext.extendSession, [authContext.extendSession]);
  const clearError = useCallback(authContext.clearError, [authContext.clearError]);
  const getSessionStatus = useCallback(authContext.getSessionStatus, [authContext.getSessionStatus]);

  // Role and permission checks
  const checkRole = useCallback(authContext.checkRole, [authContext.checkRole]);
  const isAdmin = useCallback(authContext.isAdmin, [authContext.isAdmin]);

  // Computed properties
  const hasRole = checkRole;
  const isAuthenticatedAndAdmin = useMemo(() => isAuthenticated && isAdmin(), [isAuthenticated, isAdmin]);
  const isSessionExpiringSoon = useMemo(() => {
    return sessionStatus?.timeRemaining <= AUTH_CONFIG.SESSION_RENEWAL_THRESHOLD;
  }, [sessionStatus]);
  const timeRemaining = sessionStatus?.timeRemaining || 0;

  // Enhanced authentication methods with error handling
  const safeLogin = useCallback(async (walletData) => {
    try {
      if (!walletData?.address || !walletData?.signature) {
        throw new Error(AUTH_ERRORS.WALLET_NOT_CONNECTED);
      }
      return await login(walletData);
    } catch (error) {
      console.error('Safe login error:', error);
      return {
        success: false,
        error: error.message || AUTH_ERRORS.UNKNOWN_ERROR,
        user: null
      };
    }
  }, [login]);

  const safeRegister = useCallback(async (walletData, userInfo = {}) => {
    try {
      if (!walletData?.address || !walletData?.signature) {
        throw new Error(AUTH_ERRORS.WALLET_NOT_CONNECTED);
      }
      if (!userInfo.username) {
        throw new Error('Username is required');
      }
      return await register(walletData, userInfo);
    } catch (error) {
      console.error('Safe register error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed',
        user: null
      };
    }
  }, [register]);

  // Session management methods
  const refreshSession = useCallback(async () => {
    try {
      const success = extendSession();
      if (!success) {
        throw new Error('Failed to extend session');
      }
      return { success: true };
    } catch (error) {
      console.error('Session refresh error:', error);
      return {
        success: false,
        error: error.message || 'Session refresh failed'
      };
    }
  }, [extendSession]);

  const forceLogout = useCallback(() => {
    try {
      logout();
      return { success: true };
    } catch (error) {
      console.error('Force logout error:', error);
      return {
        success: false,
        error: error.message || 'Logout failed'
      };
    }
  }, [logout]);

  // Utility methods
  const getCurrentUser = useCallback(() => {
    return user ? { ...user } : null;
  }, [user]);

  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    
    // Simple permission system - can be extended
    const permissions = {
      [AUTH_CONFIG.USER_ROLES.USER]: [
        'view_dashboard',
        'make_deposits',
        'make_withdrawals',
        'view_profile'
      ],
      [AUTH_CONFIG.USER_ROLES.ADMIN]: [
        'view_dashboard',
        'make_deposits',
        'make_withdrawals',
        'view_profile',
        'view_all_users',
        'manage_users',
        'admin_settings',
        'system_logs'
      ]
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes(permission);
  }, [user]);

  const getUserDisplayName = useCallback(() => {
    if (!user) return 'Guest';
    return user.username || user.address?.slice(0, 8) || 'User';
  }, [user]);

  const getUserAvatar = useCallback(() => {
    if (!user) return null;
    
    // Generate avatar based on address
    const address = user.address;
    if (address) {
      const colors = ['blue', 'purple', 'green', 'red', 'yellow', 'pink'];
      const colorIndex = parseInt(address.slice(2, 8), 16) % colors.length;
      return colors[colorIndex];
    }
    return 'blue';
  }, [user]);

  // Session validation methods
  const isSessionValid = useCallback(() => {
    return sessionStatus?.isValid === true;
  }, [sessionStatus]);

  const getSessionTimeRemaining = useCallback(() => {
    return sessionStatus?.timeRemaining || 0;
  }, [sessionStatus]);

  const isNearExpiry = useCallback(() => {
    const timeRemaining = getSessionTimeRemaining();
    return timeRemaining <= AUTH_CONFIG.SESSION_RENEWAL_THRESHOLD;
  }, [getSessionTimeRemaining]);

  // Authentication event listeners
  const onLogin = useCallback((callback) => {
    authContext.addEventListener?.('user_logged_in', callback);
    return () => authContext.removeEventListener?.('user_logged_in', callback);
  }, [authContext]);

  const onLogout = useCallback((callback) => {
    authContext.addEventListener?.('user_logged_out', callback);
    return () => authContext.removeEventListener?.('user_logged_out', callback);
  }, [authContext]);

  const onProfileUpdate = useCallback((callback) => {
    authContext.addEventListener?.('profile_updated', callback);
    return () => authContext.removeEventListener?.('profile_updated', callback);
  }, [authContext]);

  const onSessionRestore = useCallback((callback) => {
    authContext.addEventListener?.('session_restored', callback);
    return () => authContext.removeEventListener?.('session_restored', callback);
  }, [authContext]);

  // Form validation helpers
  const validateWalletAddress = useCallback((address) => {
    if (!address) return false;
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }, []);

  const validateUsername = useCallback((username) => {
    if (!username || typeof username !== 'string') return false;
    if (username.length < 3 || username.length > 20) return false;
    return /^[a-zA-Z0-9_]+$/.test(username);
  }, []);

  const validateEmail = useCallback((email) => {
    if (!email) return true; // Email is optional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  // Network and wallet helpers
  const getWalletStatus = useCallback(async () => {
    try {
      if (!window.ethereum) {
        return { available: false, connected: false };
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return {
        available: true,
        connected: accounts.length > 0,
        accounts: accounts || []
      };
    } catch (error) {
      console.error('Wallet status check failed:', error);
      return { available: false, connected: false, error: error.message };
    }
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        throw new Error('No wallet provider found');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      return {
        success: true,
        address: accounts[0],
        accounts
      };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      return {
        success: false,
        error: error.message || 'Wallet connection failed'
      };
    }
  }, []);

  // Return enhanced hook with all methods and state
  return {
    // State
    user,
    sessionStatus,
    isAuthenticated,
    isLoading,
    isInitializing,
    error,

    // Basic authentication methods
    login,
    register,
    logout,
    requestAuthSignature,
    updateProfile,
    extendSession,
    clearError,
    getSessionStatus,

    // Safe methods with error handling
    safeLogin,
    safeRegister,
    refreshSession,
    forceLogout,

    // Role and permissions
    checkRole,
    hasRole,
    isAdmin,
    isAuthenticatedAndAdmin,
    hasPermission,

    // Utility methods
    getCurrentUser,
    getUserDisplayName,
    getUserAvatar,

    // Session management
    isSessionValid,
    getSessionTimeRemaining,
    isNearExpiry,
    isSessionExpiringSoon,
    timeRemaining,

    // Event listeners
    onLogin,
    onLogout,
    onProfileUpdate,
    onSessionRestore,

    // Validation helpers
    validateWalletAddress,
    validateUsername,
    validateEmail,

    // Wallet helpers
    getWalletStatus,
    connectWallet,

    // Configuration
    config: AUTH_CONFIG
  };
};

export default useAuth;
