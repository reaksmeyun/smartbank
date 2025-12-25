// useAuthGuard Hook - Custom hook for authentication guard logic
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { AUTH_CONFIG, AUTH_ERRORS } from '../config/authConfig';

/**
 * Main authentication guard hook
 * Provides authentication checking and automatic handling
 */
export const useAuthGuard = ({
  requireAuth = true,
  requireRole = null,
  allowedRoles = null,
  requireAllRoles = false,
  redirectToLogin = false,
  onAuthRequired = null,
  onRoleDenied = null,
  autoRedirect = false,
  showError = true,
  retryAttempts = 3,
  retryDelay = 1000
} = {}) => {
  const {
    isAuthenticated,
    isLoading,
    isInitializing,
    user,
    sessionStatus,
    hasRole,
    checkRole,
    isAdmin,
    getSessionStatus
  } = useAuth();

  // Local state
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Memoized role checks
  const hasRequiredRole = useMemo(() => {
    if (!requireRole && !allowedRoles) return true;
    if (!user) return false;

    const rolesToCheck = allowedRoles 
      ? (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles])
      : [requireRole];

    if (requireAllRoles) {
      return rolesToCheck.every(role => checkRole(role));
    } else {
      return rolesToCheck.some(role => checkRole(role));
    }
  }, [user, requireRole, allowedRoles, requireAllRoles, checkRole]);

  // Authentication check logic
  useEffect(() => {
    if (isInitializing || isLoading) {
      return; // Still initializing, don't make decisions yet
    }

    let granted = false;
    let reason = '';

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      reason = AUTH_ERRORS.SESSION_EXPIRED;
      
      if (onAuthRequired) {
        onAuthRequired(reason);
      }
    }
    // Check role requirements
    else if ((requireRole || allowedRoles) && !hasRequiredRole) {
      reason = AUTH_ERRORS.INSUFFICIENT_PERMISSIONS;
      
      if (onRoleDenied) {
        onRoleDenied(user?.role, requireRole || allowedRoles);
      }
    }
    // All checks passed
    else {
      granted = true;
    }

    setAccessGranted(granted);
    setAccessDenied(!granted);
    setDenyReason(reason);

    // Handle automatic redirection
    if (autoRedirect && !granted && (requireAuth || requireRole || allowedRoles)) {
      if (redirectToLogin) {
        // In a real app, this would trigger navigation
        console.log('Redirecting to login due to insufficient permissions');
        if (onAuthRequired) {
          onAuthRequired(reason);
        }
      }
    }
  }, [
    isAuthenticated, 
    isLoading, 
    isInitializing, 
    requireAuth, 
    requireRole, 
    allowedRoles, 
    requireAllRoles,
    hasRequiredRole,
    user,
    redirectToLogin,
    autoRedirect,
    onAuthRequired,
    onRoleDenied
  ]);

  // Retry mechanism for authentication
  const retry = useCallback(async () => {
    if (retryCount >= retryAttempts) {
      return false;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      // Wait for the specified delay
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Refresh session status
      const status = getSessionStatus();
      
      // Check if we now have access
      const hasAccess = requireAuth ? status.isValid : true;
      const roleAccess = (requireRole || allowedRoles) ? hasRequiredRole : true;
      
      const success = hasAccess && roleAccess;
      
      if (success) {
        setAccessGranted(true);
        setAccessDenied(false);
        setDenyReason('');
      }

      setIsRetrying(false);
      return success;
    } catch (error) {
      console.error('Auth guard retry failed:', error);
      setIsRetrying(false);
      return false;
    }
  }, [
    retryCount, 
    retryAttempts, 
    retryDelay, 
    getSessionStatus, 
    requireAuth, 
    requireRole, 
    allowedRoles, 
    hasRequiredRole
  ]);

  // Reset retry count
  const resetRetry = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  // Force re-check of authentication
  const recheck = useCallback(() => {
    setAccessGranted(false);
    setAccessDenied(false);
    setDenyReason('');
    resetRetry();
  }, [resetRetry]);

  return {
    // State
    accessGranted,
    accessDenied,
    denyReason,
    isRetrying,
    retryCount,

    // Derived state
    canAccess: accessGranted && !accessDenied,
    needsAuth: requireAuth && !isAuthenticated,
    needsRole: (requireRole || allowedRoles) && !hasRequiredRole,
    isReady: !isLoading && !isInitializing,

    // Actions
    retry,
    resetRetry,
    recheck
  };
};

/**
 * Hook for protected component logic
 */
export const useProtectedComponent = (options = {}) => {
  const guard = useAuthGuard(options);
  const { user, isLoading } = useAuth();

  // Additional computed properties
  const shouldShowLoading = useMemo(() => {
    return isLoading || !guard.isReady;
  }, [isLoading, guard.isReady]);

  const shouldShowGuard = useMemo(() => {
    return guard.accessDenied && !guard.canAccess;
  }, [guard]);

  const componentProps = useMemo(() => ({
    isAuthenticated: !!user,
    user,
    hasAccess: guard.canAccess,
    loading: shouldShowLoading,
    denied: guard.accessDenied,
    reason: guard.denyReason,
    retry: guard.retry,
    retrying: guard.isRetrying
  }), [
    user, 
    guard.canAccess, 
    shouldShowLoading, 
    guard.accessDenied, 
    guard.denyReason, 
    guard.retry, 
    guard.isRetrying
  ]);

  return {
    ...guard,
    shouldShowLoading,
    shouldShowGuard,
    componentProps
  };
};

/**
 * Hook for route protection
 */
export const useRouteGuard = (routeOptions = {}) => {
  const guard = useAuthGuard(routeOptions);
  const { isAuthenticated, user, isLoading } = useAuth();

  // Route-specific checks
  const routeAccess = useMemo(() => {
    if (!guard.isReady) return 'loading';
    if (!isAuthenticated) return 'unauthenticated';
    if (guard.accessDenied) return 'forbidden';
    return 'allowed';
  }, [guard.isReady, isAuthenticated, guard.accessDenied]);

  // Navigation helpers
  const canNavigate = routeAccess === 'allowed';
  const shouldRedirect = routeAccess === 'unauthenticated' || routeAccess === 'forbidden';

  // Get redirect path based on access state
  const getRedirectPath = useCallback(() => {
    switch (routeAccess) {
      case 'unauthenticated':
        return '/login';
      case 'forbidden':
        return '/forbidden';
      default:
        return null;
    }
  }, [routeAccess]);

  return {
    ...guard,
    routeAccess,
    canNavigate,
    shouldRedirect,
    getRedirectPath,
    isReady: guard.isReady && !isLoading
  };
};

/**
 * Hook for conditional rendering based on authentication
 */
export const useConditionalRender = (conditions = {}) => {
  const {
    renderWhenAuthenticated = true,
    renderWhenUnauthenticated = false,
    renderWhenAdmin = false,
    renderWhenUser = false,
    fallback = null
  } = conditions;

  const { user, isAuthenticated, isAdmin, hasRole } = useAuth();

  const shouldRender = useMemo(() => {
    // Authentication-based rendering
    if (isAuthenticated && !renderWhenAuthenticated) return false;
    if (!isAuthenticated && !renderWhenUnauthenticated) return false;

    // Role-based rendering
    if (renderWhenAdmin && !isAdmin()) return false;
    if (renderWhenUser && isAdmin()) return false;

    return true;
  }, [
    isAuthenticated,
    renderWhenAuthenticated,
    renderWhenUnauthenticated,
    renderWhenAdmin,
    renderWhenUser,
    isAdmin
  ]);

  return {
    shouldRender,
    isAuthenticated,
    isAdmin: isAdmin(),
    user,
    fallback
  };
};

/**
 * Hook for authentication state monitoring
 */
export const useAuthMonitor = (interval = 30000) => {
  const { sessionStatus, getSessionStatus, isAuthenticated } = useAuth();
  const [monitorData, setMonitorData] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Monitor authentication state
  useEffect(() => {
    if (!isMonitoring) return;

    const updateMonitor = () => {
      const status = getSessionStatus();
      setMonitorData({
        ...status,
        timestamp: Date.now(),
        isMonitoring: true
      });
    };

    // Initial update
    updateMonitor();

    // Set up interval
    const intervalId = setInterval(updateMonitor, interval);

    return () => {
      clearInterval(intervalId);
      setIsMonitoring(false);
    };
  }, [isMonitoring, interval, getSessionStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsMonitoring(false);
    };
  }, []);

  return {
    monitorData,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    isSessionValid: monitorData?.isValid || false,
    timeRemaining: monitorData?.timeRemaining || 0,
    isNearExpiry: (monitorData?.timeRemaining || 0) <= AUTH_CONFIG.SESSION_RENEWAL_THRESHOLD
  };
};

/**
 * Hook for authentication event handling
 */
export const useAuthEvents = () => {
  const { onLogin, onLogout, onProfileUpdate, onSessionRestore } = useAuth();
  const [events, setEvents] = useState([]);

  // Add event to history
  const addEvent = useCallback((type, data) => {
    const event = {
      id: Date.now(),
      type,
      data,
      timestamp: new Date().toISOString()
    };
    
    setEvents(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 events
  }, []);

  // Set up event listeners
  useEffect(() => {
    const cleanup = [];

    // Login event
    cleanup.push(onLogin((user) => {
      addEvent('login', { user });
    }));

    // Logout event
    cleanup.push(onLogout(() => {
      addEvent('logout', {});
    }));

    // Profile update event
    cleanup.push(onProfileUpdate((user) => {
      addEvent('profile_update', { user });
    }));

    // Session restore event
    cleanup.push(onSessionRestore((user) => {
      addEvent('session_restore', { user });
    }));

    return () => {
      cleanup.forEach(cleanupFn => cleanupFn());
    };
  }, [onLogin, onLogout, onProfileUpdate, onSessionRestore, addEvent]);

  // Clear event history
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    clearEvents,
    lastEvent: events[0] || null,
    hasEvents: events.length > 0
  };
};

// Export all hooks
export default useAuthGuard;
