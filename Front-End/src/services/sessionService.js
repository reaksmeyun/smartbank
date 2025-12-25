// Session Service - Secure session management for Web3 authentication
import { AUTH_CONFIG, AUTH_ERRORS } from '../config/authConfig';

class SessionService {
  constructor() {
    this.sessionToken = null;
    this.userProfile = null;
    this.sessionExpiry = null;
    this.renewalTimer = null;
    this.usedNonces = new Set();
    this.lastActivity = null;
  }

  /**
   * Create a secure session token
   * @param {Object} userData - User authentication data
   * @returns {string} Encrypted session token
   */
  createSessionToken(userData) {
    try {
      const sessionData = {
        userId: userData.id || this.generateUserId(),
        address: userData.address,
        role: userData.role || AUTH_CONFIG.USER_ROLES.USER,
        issuedAt: Date.now(),
        expiresAt: Date.now() + AUTH_CONFIG.SESSION_TIMEOUT,
        sessionId: this.generateSessionId()
      };

      // Simple encoding (in production, use proper encryption)
      const tokenData = btoa(JSON.stringify(sessionData));
      return `smartbank_session_${tokenData}`;
    } catch (error) {
      console.error('Failed to create session token:', error);
      throw new Error('Session creation failed');
    }
  }

  /**
   * Validate and parse a session token
   * @param {string} token - Session token to validate
   * @returns {Object|null} Session data or null if invalid
   */
  validateSessionToken(token) {
    try {
      if (!token || !token.startsWith('smartbank_session_')) {
        return null;
      }

      const tokenData = token.replace('smartbank_session_', '');
      const sessionData = JSON.parse(atob(tokenData));

      // Check if session has expired
      if (Date.now() > sessionData.expiresAt) {
        this.clearSession();
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error('Session token validation failed:', error);
      return null;
    }
  }

  /**
   * Start a new user session
   * @param {Object} userData - User authentication data
   * @returns {boolean} Success status
   */
  startSession(userData) {
    try {
      this.sessionToken = this.createSessionToken(userData);
      this.userProfile = {
        ...userData,
        id: userData.id || this.generateUserId(),
        createdAt: userData.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      this.sessionExpiry = Date.now() + AUTH_CONFIG.SESSION_TIMEOUT;
      this.lastActivity = Date.now();

      // Store in localStorage
      this.storeSessionData();

      // Set up automatic session renewal
      this.setupSessionRenewal();

      // Track last activity
      this.trackActivity();

      console.log('Session started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start session:', error);
      return false;
    }
  }

  /**
   * Check if current session is valid
   * @returns {boolean} Session validity
   */
  isSessionValid() {
    if (!this.sessionToken || !this.sessionExpiry) {
      return false;
    }

    // Check expiry
    if (Date.now() > this.sessionExpiry) {
      this.clearSession();
      return false;
    }

    // Validate token format
    const sessionData = this.validateSessionToken(this.sessionToken);
    if (!sessionData) {
      this.clearSession();
      return false;
    }

    return true;
  }

  /**
   * Get current session data
   * @returns {Object|null} Current session data
   */
  getSessionData() {
    if (!this.isSessionValid()) {
      return null;
    }

    return {
      token: this.sessionToken,
      userProfile: this.userProfile,
      expiresAt: this.sessionExpiry,
      isValid: true
    };
  }

  /**
   * Get current user profile
   * @returns {Object|null} User profile or null
   */
  getUserProfile() {
    if (!this.isSessionValid() || !this.userProfile) {
      return null;
    }

    return { ...this.userProfile };
  }

  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {boolean} Success status
   */
  updateUserProfile(updates) {
    try {
      if (!this.userProfile) {
        return false;
      }

      this.userProfile = {
        ...this.userProfile,
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      this.storeSessionData();
      return true;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return false;
    }
  }

  /**
   * Extend session expiry time
   * @returns {boolean} Success status
   */
  extendSession() {
    try {
      if (!this.isSessionValid()) {
        return false;
      }

      this.sessionExpiry = Date.now() + AUTH_CONFIG.SESSION_TIMEOUT;
      this.lastActivity = Date.now();

      this.storeSessionData();
      this.setupSessionRenewal();

      return true;
    } catch (error) {
      console.error('Failed to extend session:', error);
      return false;
    }
  }

  /**
   * Clear current session
   */
  clearSession() {
    this.sessionToken = null;
    this.userProfile = null;
    this.sessionExpiry = null;
    this.lastActivity = null;

    if (this.renewalTimer) {
      clearTimeout(this.renewalTimer);
      this.renewalTimer = null;
    }

    // Clear from localStorage
    this.clearStoredSession();

    // Clear used nonces
    this.usedNonces.clear();

    console.log('Session cleared');
  }

  /**
   * Check if nonce has been used (prevents replay attacks)
   * @param {string} nonce - Nonce to check
   * @returns {boolean} Whether nonce has been used
   */
  isNonceUsed(nonce) {
    return this.usedNonces.has(nonce);
  }

  /**
   * Mark nonce as used
   * @param {string} nonce - Nonce to mark as used
   */
  markNonceAsUsed(nonce) {
    this.usedNonces.add(nonce);
    
    // Limit memory usage by cleaning old nonces
    if (this.usedNonces.size > 1000) {
      const noncesArray = Array.from(this.usedNonces);
      this.usedNonces.clear();
      // Keep most recent 500 nonces
      noncesArray.slice(-500).forEach(n => this.usedNonces.add(n));
    }
  }

  /**
   * Store session data in localStorage
   */
  storeSessionData() {
    try {
      if (this.sessionToken) {
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.SESSION_TOKEN, this.sessionToken);
      }
      
      if (this.userProfile) {
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(this.userProfile));
      }
      
      if (this.sessionExpiry) {
        localStorage.setItem('smartbank_session_expiry', this.sessionExpiry.toString());
      }
      
      if (this.lastActivity) {
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.LAST_ACTIVITY, this.lastActivity.toString());
      }
    } catch (error) {
      console.error('Failed to store session data:', error);
    }
  }

  /**
   * Load session data from localStorage
   * @returns {boolean} Success status
   */
  loadSessionData() {
    try {
      // Graceful handling of missing localStorage
      if (typeof localStorage === 'undefined') {
        console.warn('localStorage not available - session data cannot be loaded');
        return false;
      }

      const storedToken = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.SESSION_TOKEN);
      const storedProfile = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER_PROFILE);
      const storedExpiry = localStorage.getItem('smartbank_session_expiry');
      const storedActivity = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.LAST_ACTIVITY);

      if (storedToken && storedProfile && storedExpiry) {
        try {
          this.sessionToken = storedToken;
          this.userProfile = JSON.parse(storedProfile);
          this.sessionExpiry = parseInt(storedExpiry);
          this.lastActivity = storedActivity ? parseInt(storedActivity) : Date.now();

          // Validate loaded session
          if (this.isSessionValid()) {
            console.log('Session loaded from storage');
            this.setupSessionRenewal();
            this.trackActivity();
            return true;
          } else {
            console.log('Loaded session is invalid or expired, clearing...');
            this.clearSession();
          }
        } catch (parseError) {
          console.error('Failed to parse stored session data:', parseError);
          // Clear corrupted data
          this.clearStoredSession();
        }
      } else {
        console.log('No session data found in storage');
      }

      return false;
    } catch (error) {
      console.error('Failed to load session data:', error);
      // Don't propagate the error, just return false
      return false;
    }
  }

  /**
   * Clear stored session data from localStorage
   */
  clearStoredSession() {
    try {
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.SESSION_TOKEN);
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.USER_PROFILE);
      localStorage.removeItem('smartbank_session_expiry');
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.LAST_ACTIVITY);
    } catch (error) {
      console.error('Failed to clear stored session:', error);
    }
  }

  /**
   * Set up automatic session renewal
   */
  setupSessionRenewal() {
    if (this.renewalTimer) {
      clearTimeout(this.renewalTimer);
    }

    const timeUntilExpiry = this.sessionExpiry - Date.now();
    const renewalTime = timeUntilExpiry - AUTH_CONFIG.SESSION_RENEWAL_THRESHOLD;

    if (renewalTime > 0) {
      this.renewalTimer = setTimeout(() => {
        console.log('Auto-extending session');
        this.extendSession();
      }, renewalTime);
    }
  }

  /**
   * Track user activity for session management
   */
  trackActivity() {
    const updateActivity = () => {
      this.lastActivity = Date.now();
      localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.LAST_ACTIVITY, this.lastActivity.toString());
    };

    // Update activity on user interactions
    ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
  }

  /**
   * Generate a unique user ID
   * @returns {string} Unique user ID
   */
  generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique session ID
   * @returns {string} Unique session ID
   */
  generateSessionId() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get session time remaining
   * @returns {number} Milliseconds remaining in session
   */
  getTimeRemaining() {
    if (!this.sessionExpiry) {
      return 0;
    }
    return Math.max(0, this.sessionExpiry - Date.now());
  }

  /**
   * Check if session is about to expire
   * @returns {boolean} Whether session expires soon
   */
  isSessionExpiringSoon() {
    const timeRemaining = this.getTimeRemaining();
    return timeRemaining <= AUTH_CONFIG.SESSION_RENEWAL_THRESHOLD;
  }

  /**
   * Get session statistics
   * @returns {Object} Session statistics
   */
  getSessionStats() {
    return {
      isValid: this.isSessionValid(),
      timeRemaining: this.getTimeRemaining(),
      expiresAt: this.sessionExpiry,
      userProfile: this.userProfile,
      lastActivity: this.lastActivity
    };
  }
}

// Export singleton instance
export default new SessionService();
