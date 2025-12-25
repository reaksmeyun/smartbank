// User Profile Component - Display and manage user profile information
import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Settings, Edit3, Save, X, AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AUTH_CONFIG } from '../../config/authConfig';

const UserProfile = ({ className = '' }) => {
  const { 
    user, 
    updateProfile, 
    isLoading, 
    error, 
    clearError,
    isAdmin,
    sessionStatus 
  } = useAuth();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showCopied, setShowCopied] = useState(false);

  // Initialize edit data when user changes
  useEffect(() => {
    if (user) {
      setEditData({
        username: user.username || '',
        email: user.email || '',
        preferences: { ...user.preferences }
      });
    }
  }, [user]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  /**
   * Handle form field changes
   */
  const handleInputChange = (field, value) => {
    if (field.startsWith('preferences.')) {
      const prefField = field.split('.')[1];
      setEditData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefField]: value
        }
      }));
    } else {
      setEditData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  /**
   * Validate profile data
   */
  const validateProfile = () => {
    const errors = {};

    // Username validation
    if (!editData.username || !editData.username.trim()) {
      errors.username = 'Username is required';
    } else if (editData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (editData.username.length > 20) {
      errors.username = 'Username must be less than 20 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(editData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation (optional but if provided, must be valid)
    if (editData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email)) {
      errors.email = 'Invalid email format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Save profile changes
   */
  const handleSave = async () => {
    try {
      if (!validateProfile()) {
        return;
      }

      setIsSaving(true);
      clearError();

      const success = await updateProfile(editData);
      
      if (success) {
        setIsEditing(false);
        // Success feedback could be shown here
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Cancel editing
   */
  const handleCancel = () => {
    setIsEditing(false);
    setValidationErrors({});
    clearError();
    
    // Reset edit data
    if (user) {
      setEditData({
        username: user.username || '',
        email: user.email || '',
        preferences: { ...user.preferences }
      });
    }
  };

  /**
   * Copy wallet address to clipboard
   */
  const copyWalletAddress = async () => {
    try {
      await navigator.clipboard.writeText(user.address);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  /**
   * Format address for display
   */
  const formatAddress = (address) => {
    if (!address) return 'Not set';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  /**
   * Get role display name
   */
  const getRoleDisplayName = (role) => {
    switch (role) {
      case AUTH_CONFIG.USER_ROLES.ADMIN:
        return 'Administrator';
      case AUTH_CONFIG.USER_ROLES.USER:
        return 'Standard User';
      default:
        return role;
    }
  };

  /**
   * Get role badge color
   */
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case AUTH_CONFIG.USER_ROLES.ADMIN:
        return 'bg-red-500 bg-opacity-20 text-red-300 border-red-400 border-opacity-30';
      case AUTH_CONFIG.USER_ROLES.USER:
        return 'bg-blue-500 bg-opacity-20 text-blue-300 border-blue-400 border-opacity-30';
      default:
        return 'bg-gray-500 bg-opacity-20 text-gray-300 border-gray-400 border-opacity-30';
    }
  };

  if (!user) {
    return (
      <div className={`bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-white border-opacity-20 p-6 ${className}`}>
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300">No user profile available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-white border-opacity-20 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500 bg-opacity-20 rounded-full">
            <User className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">User Profile</h2>
            <p className="text-gray-300 text-sm">Manage your account information</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save</span>
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg p-4 flex items-start space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-red-300 font-semibold mb-1">Profile Update Error</h4>
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="bg-yellow-500 bg-opacity-20 border border-yellow-400 border-opacity-30 rounded-lg p-4 mb-6">
          <h4 className="text-yellow-300 font-semibold mb-2">Please fix the following errors:</h4>
          <ul className="text-yellow-200 text-sm space-y-1">
            {Object.entries(validationErrors).map(([field, error]) => (
              <li key={field}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Profile Information */}
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-black bg-opacity-20 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Basic Information</span>
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Username */}
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Username
              </label>
              {isEditing ? (
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className={`w-full bg-white bg-opacity-10 border rounded-lg px-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                      validationErrors.username 
                        ? 'border-red-400 focus:ring-red-400' 
                        : 'border-white border-opacity-20 focus:ring-blue-400'
                    }`}
                    placeholder="Enter username"
                    maxLength={20}
                  />
                </div>
              ) : (
                <div className="bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg px-4 py-3">
                  <p className="text-white">{user.username || 'Not set'}</p>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Email
              </label>
              {isEditing ? (
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full bg-white bg-opacity-10 border rounded-lg px-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                      validationErrors.email 
                        ? 'border-red-400 focus:ring-red-400' 
                        : 'border-white border-opacity-20 focus:ring-blue-400'
                    }`}
                    placeholder="Enter email (optional)"
                  />
                </div>
              ) : (
                <div className="bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg px-4 py-3">
                  <p className="text-white">{user.email || 'Not provided'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wallet Information */}
        <div className="bg-black bg-opacity-20 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Wallet Information</span>
          </h3>
          
          <div className="space-y-4">
            {/* Wallet Address */}
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Wallet Address
              </label>
              <div className="bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-white font-mono text-sm">
                    {formatAddress(user.address)}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={copyWalletAddress}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Copy full address"
                    >
                      {showCopied ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                    <a
                      href={`https://etherscan.io/address/${user.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="View on Etherscan"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Account Role
              </label>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getRoleBadgeColor(user.role)}`}>
                <Shield className="w-4 h-4 mr-2" />
                {getRoleDisplayName(user.role)}
              </div>
            </div>
          </div>
        </div>

        {/* Account Statistics */}
        <div className="bg-black bg-opacity-20 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-4">Account Statistics</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-1">
                Member Since
              </label>
              <p className="text-white">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-1">
                Last Login
              </label>
              <p className="text-white">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            
            {sessionStatus && (
              <>
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-1">
                    Session Expires
                  </label>
                  <p className="text-white">
                    {sessionStatus.expiresAt ? new Date(sessionStatus.expiresAt).toLocaleString() : 'Unknown'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-1">
                    Time Remaining
                  </label>
                  <p className="text-white">
                    {sessionStatus.timeRemaining ? Math.ceil(sessionStatus.timeRemaining / (1000 * 60 * 60)) + ' hours' : 'Unknown'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Preferences (Edit Mode Only) */}
        {isEditing && (
          <div className="bg-black bg-opacity-20 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-4">Preferences</h3>
            
            <div className="space-y-4">
              {/* Theme */}
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Theme
                </label>
                <select
                  value={editData.preferences?.theme || 'dark'}
                  onChange={(e) => handleInputChange('preferences.theme', e.target.value)}
                  className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              {/* Notifications */}
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Notifications
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={editData.preferences?.notifications !== false}
                    onChange={(e) => handleInputChange('preferences.notifications', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="notifications" className="text-sm text-gray-300">
                    Enable notifications
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Notice */}
      {isAdmin() && (
        <div className="mt-6 p-4 bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg">
          <div className="flex items-start space-x-2">
            <Shield className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-red-300 font-semibold text-sm mb-1">Administrator Account</h4>
              <p className="text-red-200 text-xs">
                You have administrator privileges. Use these permissions responsibly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
