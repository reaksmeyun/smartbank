// Role Guard Component - Role-based access control for components and features
import React, { useState, useEffect } from 'react';
import { Shield, Crown, User, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AUTH_CONFIG } from '../../config/authConfig';

const RoleGuard = ({ 
  requiredRole, 
  children, 
  fallback = null,
  showFallback = false,
  requireAllRoles = false, // If true, user must have ALL roles (for multiple requirements)
  allowedRoles = null, // Array of allowed roles instead of single role
  hideWhenDenied = false,
  showAccessDeniedMessage = true,
  className = '',
  adminMode = false // Special admin-only features
}) => {
  const { 
    user, 
    isAuthenticated,
    isAdmin,
    hasRole,
    checkRole,
    clearError,
    error 
  } = useAuth();

  // Local state
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [reason, setReason] = useState('');

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Role checking logic
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setAccessDenied(true);
      setReason('Authentication required');
      setIsCheckingRole(false);
      return;
    }

    let hasAccess = false;
    let accessReason = '';

    // Determine required roles
    const rolesToCheck = allowedRoles 
      ? (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles])
      : [requiredRole];

    // Check role requirements
    if (requireAllRoles) {
      // User must have ALL specified roles
      hasAccess = rolesToCheck.every(role => checkRole(role));
      accessReason = hasAccess ? '' : `Missing required roles: ${rolesToCheck.filter(role => !checkRole(role)).join(', ')}`;
    } else {
      // User must have at least ONE of the specified roles
      hasAccess = rolesToCheck.some(role => checkRole(role));
      accessReason = hasAccess ? '' : `Insufficient permissions. Required: ${rolesToCheck.join(' or ')}`;
    }

    // Special admin mode check
    if (adminMode && !isAdmin()) {
      hasAccess = false;
      accessReason = 'Administrator access required';
    }

    setAccessDenied(!hasAccess);
    setReason(accessReason);
    setIsCheckingRole(false);
  }, [user, isAuthenticated, requiredRole, allowedRoles, requireAllRoles, adminMode, checkRole, isAdmin, clearError]);

  /**
   * Get role display information
   */
  const getRoleInfo = (role) => {
    const roleInfo = {
      [AUTH_CONFIG.USER_ROLES.USER]: {
        name: 'Standard User',
        icon: User,
        color: 'blue',
        description: 'Basic user access'
      },
      [AUTH_CONFIG.USER_ROLES.ADMIN]: {
        name: 'Administrator',
        icon: Crown,
        color: 'red',
        description: 'Full administrative access'
      }
    };

    return roleInfo[role] || {
      name: role,
      icon: Shield,
      color: 'gray',
      description: 'Unknown role'
    };
  };

  /**
   * Get current user's highest role
   */
  const getUserHighestRole = () => {
    if (!user) return null;
    
    // Admin has higher priority than user
    if (user.role === AUTH_CONFIG.USER_ROLES.ADMIN) {
      return AUTH_CONFIG.USER_ROLES.ADMIN;
    }
    
    return user.role || AUTH_CONFIG.USER_ROLES.USER;
  };

  /**
   * Render role badge
   */
  const renderRoleBadge = (role) => {
    const info = getRoleInfo(role);
    const IconComponent = info.icon;
    
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${
        info.color === 'red' ? 'bg-red-500 bg-opacity-20 text-red-300 border-red-400 border-opacity-30' :
        info.color === 'blue' ? 'bg-blue-500 bg-opacity-20 text-blue-300 border-blue-400 border-opacity-30' :
        'bg-gray-500 bg-opacity-20 text-gray-300 border-gray-400 border-opacity-30'
      }`}>
        <IconComponent className="w-4 h-4 mr-2" />
        {info.name}
      </div>
    );
  };

  /**
   * Render access denied message
   */
  const renderAccessDenied = () => {
    if (!showAccessDeniedMessage && !showFallback) {
      return hideWhenDenied ? null : fallback;
    }

    if (fallback && !showAccessDeniedMessage) {
      return fallback;
    }

    const userRole = getUserHighestRole();
    const userRoleInfo = getRoleInfo(userRole);

    return (
      <div className={`bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-white border-opacity-20 p-6 ${className}`}>
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 ${
            userRoleInfo.color === 'red' ? 'bg-red-500 bg-opacity-20' :
            userRoleInfo.color === 'blue' ? 'bg-blue-500 bg-opacity-20' :
            'bg-gray-500 bg-opacity-20'
          } rounded-full mb-4`}>
            {adminMode ? (
              <Crown className={`w-8 h-8 ${
                userRoleInfo.color === 'red' ? 'text-red-400' :
                userRoleInfo.color === 'blue' ? 'text-blue-400' :
                'text-gray-400'
              }`} />
            ) : (
              <Shield className={`w-8 h-8 ${
                userRoleInfo.color === 'red' ? 'text-red-400' :
                userRoleInfo.color === 'blue' ? 'text-blue-400' :
                'text-gray-400'
              }`} />
            )}
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            {adminMode ? 'Administrator Access Required' : 'Insufficient Permissions'}
          </h3>

          <p className="text-gray-300 text-sm mb-4">
            {reason || 'You do not have the required permissions to access this feature.'}
          </p>

          {/* Role Information */}
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Your current role:</p>
              <div className="mt-2">
                {user ? renderRoleBadge(userRole) : (
                  <span className="text-gray-400 text-sm">Not authenticated</span>
                )}
              </div>
            </div>

            {requiredRole && !allowedRoles && (
              <div>
                <p className="text-gray-400 text-sm">Required role:</p>
                <div className="mt-2">
                  {renderRoleBadge(requiredRole)}
                </div>
              </div>
            )}

            {allowedRoles && (
              <div>
                <p className="text-gray-400 text-sm">Required roles:</p>
                <div className="mt-2 flex flex-wrap gap-2 justify-center">
                  {allowedRoles.map(role => (
                    <div key={role}>
                      {renderRoleBadge(role)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Role Description */}
          <div className="mt-4 p-3 bg-black bg-opacity-20 rounded-lg">
            <p className="text-gray-300 text-xs">
              {adminMode 
                ? 'This feature is restricted to administrators only. Contact your system administrator for access.'
                : userRoleInfo.description + '. ' + (requiredRole ? `Upgrade your account to access this feature.` : '')
              }
            </p>
          </div>

          {/* Debug Info (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-yellow-500 bg-opacity-20 border border-yellow-400 border-opacity-30 rounded-lg">
              <h4 className="text-yellow-300 font-semibold text-sm mb-2">Debug Information</h4>
              <div className="text-yellow-200 text-xs space-y-1">
                <p>User: {user ? `${user.username} (${user.address})` : 'Not authenticated'}</p>
                <p>User Role: {userRole || 'None'}</p>
                <p>Required Role: {requiredRole || 'None'}</p>
                <p>Allowed Roles: {allowedRoles ? allowedRoles.join(', ') : 'None'}</p>
                <p>Require All: {requireAllRoles ? 'Yes' : 'No'}</p>
                <p>Admin Mode: {adminMode ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render loading state
   */
  const renderLoading = () => (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-white border-opacity-20 p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500 bg-opacity-20 rounded-full mb-3">
            <Shield className="w-6 h-6 text-blue-400 animate-pulse" />
          </div>
          <p className="text-gray-300 text-sm">Checking permissions...</p>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (isCheckingRole) {
    return renderLoading();
  }

  // Access denied
  if (accessDenied) {
    return renderAccessDenied();
  }

  // Access granted - render children
  return children;
};

// Higher-order component for role-based protection
export const withRoleGuard = (Component, roleOptions = {}) => {
  return function RoleProtectedComponent(props) {
    return (
      <RoleGuard {...roleOptions}>
        <Component {...props} />
      </RoleGuard>
    );
  };
};

// Specialized guard components for common use cases
export const AdminOnly = ({ children, ...props }) => (
  <RoleGuard requiredRole={AUTH_CONFIG.USER_ROLES.ADMIN} adminMode={true} {...props}>
    {children}
  </RoleGuard>
);

export const UserOrAdmin = ({ children, ...props }) => (
  <RoleGuard allowedRoles={[AUTH_CONFIG.USER_ROLES.USER, AUTH_CONFIG.USER_ROLES.ADMIN]} {...props}>
    {children}
  </RoleGuard>
);

export const AdminGuard = ({ children, fallback, ...props }) => (
  <RoleGuard requiredRole={AUTH_CONFIG.USER_ROLES.ADMIN} {...props}>
    {children}
  </RoleGuard>
);

// Feature flag component for role-based feature toggles
export const FeatureGuard = ({ 
  feature, 
  roles = [AUTH_CONFIG.USER_ROLES.USER], 
  children, 
  fallback = null,
  ...props 
}) => {
  return (
    <RoleGuard allowedRoles={roles} fallback={fallback} {...props}>
      {children}
    </RoleGuard>
  );
};

// Permission matrix component for complex role scenarios
export const PermissionMatrix = ({ 
  permissions, 
  userRole, 
  children, 
  fallback = null,
  ...props 
}) => {
  const hasPermission = (permission) => {
    const rolePermissions = permissions[userRole] || [];
    return rolePermissions.includes(permission);
  };

  const context = {
    hasPermission,
    userRole,
    permissions
  };

  return (
    <RoleGuard {...props}>
      {React.cloneElement(children, { permissionContext: context })}
    </RoleGuard>
  );
};

// Export all components
export default RoleGuard;
