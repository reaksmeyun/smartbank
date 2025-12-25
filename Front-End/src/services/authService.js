// Authentication Service - Main authentication logic and coordination
import { AUTH_CONFIG, AUTH_ERRORS, AUTH_SUCCESS, DEFAULT_USER_PROFILE } from '../config/authConfig';
import signatureService from './signatureService';
import sessionService from './sessionService';

class AuthService {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.isAuthenticated = false;
    this.listeners = [];
  }

  /**
   * Initialize the authentication service
   * @param {Object} windowEthereum - Ethereum provider
   * @returns {Promise<boolean>} Success status
   */
  async initialize(windowEthereum = window.ethereum) {
    try {
      if (this.isInitialized) {
        return true;
      }

      // Add timeout to prevent hanging
      const initTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth service initialization timeout')), 2000);
      });

      const initPromise = this._doInitialize(windowEthereum);
      
      await Promise.race([initPromise, initTimeout]);

      this.isInitialized = true;
      console.log('Authentication service initialized successfully');
      return true;
    } catch (error) {
      console.warn('Auth service initialization failed:', error.message);
      // Mark as initialized even on failure to prevent hanging
      this.isInitialized = true;
      console.log('Authentication service initialized with limited functionality');
      return true;
    }
  }

  /**
   * Core initialization logic
   * @param {Object} windowEthereum - Ethereum provider
   * @returns {Promise<boolean>} Success status
   */
  async _doInitialize(windowEthereum) {
    try {
      // Initialize signature service if provider is available (graceful handling)
      if (windowEthereum) {
        try {
          const providerInitialized = await signatureService.initializeProvider(windowEthereum);
          if (!providerInitialized) {
            console.warn('Provider initialization failed, continuing in development mode');
          }
        } catch (providerError) {
          console.warn('Provider initialization error:', providerError.message);
        }
      } else {
        console.warn('No Ethereum provider available - running in development mode');
      }

      // Try to restore existing session (graceful handling)
      try {
        this.loadExistingSession();
      } catch (sessionError) {
        console.warn('Session restoration failed:', sessionError.message);
      }

      return true;
    } catch (error) {
      console.error('Core initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load existing session from storage
   */
  loadExistingSession() {
    if (sessionService.loadSessionData()) {
      const sessionData = sessionService.getSessionData();
      if (sessionData) {
        this.currentUser = sessionData.userProfile;
        this.isAuthenticated = true;
        this.notifyListeners('session_restored', this.currentUser);
      }
    }
  }

  /**
   * Register a new user with Web3 wallet
   * @param {Object} walletData - Wallet connection data
   * @param {Object} userInfo - Additional user information
   * @returns {Promise<Object>} Registration result
   */
  async register(walletData, userInfo = {}) {
    try {
      const { address, signature, message } = walletData;

      if (!address || !signature) {
        throw new Error(AUTH_ERRORS.WALLET_NOT_CONNECTED);
      }

      // Verify the signature
      const verification = signatureService.verifySignature(message, signature, address);
      if (!verification.isValid) {
        throw new Error(AUTH_ERRORS.INVALID_SIGNATURE);
      }

      // Create user profile
      const userProfile = {
        ...DEFAULT_USER_PROFILE,
        id: this.generateUserId(),
        address: address.toLowerCase(),
        username: userInfo.username || `user_${address.slice(2, 8)}`,
        email: userInfo.email || null,
        role: userInfo.role || AUTH_CONFIG.USER_ROLES.USER,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        preferences: {
          ...DEFAULT_USER_PROFILE.preferences,
          ...userInfo.preferences
        }
      };

      // Start session
      const sessionStarted = sessionService.startSession(userProfile);
      if (!sessionStarted) {
        throw new Error('Failed to create session');
      }

      this.currentUser = userProfile;
      this.isAuthenticated = true;

      this.notifyListeners('user_registered', this.currentUser);

      return {
        success: true,
        user: this.currentUser,
        message: AUTH_SUCCESS.REGISTRATION_SUCCESS
      };

    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        error: error.message,
        user: null
      };
    }
  }

  /**
   * Authenticate existing user with Web3 wallet
   * @param {Object} walletData - Wallet connection data
   * @returns {Promise<Object>} Authentication result
   */
  async login(walletData) {
    try {
      const { address, signature, message, nonce } = walletData;

      if (!address || !signature) {
        throw new Error(AUTH_ERRORS.WALLET_NOT_CONNECTED);
      }

      // Validate nonce
      if (!signatureService.validateNonce(nonce)) {
        throw new Error('Invalid or expired nonce');
      }

      // Check if nonce has been used (replay attack prevention)
      if (sessionService.isNonceUsed(nonce)) {
        throw new Error('Nonce has already been used');
      }

      // Verify the signature
      const verification = signatureService.verifySignature(message, signature, address);
      if (!verification.isValid) {
        throw new Error(AUTH_ERRORS.INVALID_SIGNATURE);
      }

      // Mark nonce as used
      sessionService.markNonceAsUsed(nonce);

      // Check if user exists (in a real app, this would be an API call)
      const existingUser = this.findUserByAddress(address);
      
      if (existingUser) {
        // Update last login
        existingUser.lastLoginAt = new Date().toISOString();
        
        // Start session with existing user data
        sessionService.startSession(existingUser);
        this.currentUser = existingUser;
      } else {
        // User doesn't exist, create new profile
        const userProfile = {
          ...DEFAULT_USER_PROFILE,
          id: this.generateUserId(),
          address: address.toLowerCase(),
          username: `user_${address.slice(2, 8)}`,
          role: AUTH_CONFIG.USER_ROLES.USER,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };

        sessionService.startSession(userProfile);
        this.currentUser = userProfile;
      }

      this.isAuthenticated = true;

      this.notifyListeners('user_logged_in', this.currentUser);

      return {
        success: true,
        user: this.currentUser,
        message: AUTH_SUCCESS.LOGIN_SUCCESS,
        isNewUser: !existingUser
      };

    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.message,
        user: null
      };
    }
  }

  /**
   * Logout current user
   * @returns {boolean} Success status
   */
  logout() {
    try {
      // Clear session
      sessionService.clearSession();

      // Reset state
      this.currentUser = null;
      this.isAuthenticated = false;

      // Clean up signature service
      signatureService.cleanup();

      this.notifyListeners('user_logged_out', null);

      console.log('User logged out successfully');
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  }

  /**
   * Get current authenticated user
   * @returns {Object|null} Current user or null
   */
  getCurrentUser() {
    if (!this.isAuthenticated) {
      return null;
    }

    const sessionData = sessionService.getUserProfile();
    if (!sessionData) {
      this.isAuthenticated = false;
      return null;
    }

    return { ...sessionData };
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isUserAuthenticated() {
    return this.isAuthenticated && this.currentUser && sessionService.isSessionValid();
  }

  /**
   * Request authentication signature from user
   * @param {string} address - User's wallet address
   * @returns {Promise<Object>} Signature request result
   */
  async requestAuthSignature(address) {
    try {
      if (!signatureService.isWalletConnected()) {
        throw new Error(AUTH_ERRORS.WALLET_NOT_CONNECTED);
      }

      const currentAddress = await signatureService.getCurrentAddress();
      if (!currentAddress || currentAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Address mismatch');
      }

      const nonce = signatureService.generateNonce();
      const signatureData = await signatureService.requestSignature(address, nonce);

      return {
        success: true,
        ...signatureData,
        nonce
      };

    } catch (error) {
      console.error('Failed to request signature:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {boolean} Success status
   */
  async updateProfile(updates) {
    try {
      if (!this.isUserAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const updated = sessionService.updateUserProfile(updates);
      if (updated) {
        this.currentUser = sessionService.getUserProfile();
        this.notifyListeners('profile_updated', this.currentUser);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Profile update failed:', error);
      return false;
    }
  }

  /**
   * Extend current session
   * @returns {boolean} Success status
   */
  extendSession() {
    try {
      return sessionService.extendSession();
    } catch (error) {
      console.error('Session extension failed:', error);
      return false;
    }
  }

  /**
   * Get session status and time remaining
   * @returns {Object} Session status
   */
  getSessionStatus() {
    const stats = sessionService.getSessionStats();
    return {
      ...stats,
      isAuthenticated: this.isAuthenticated,
      currentUser: this.currentUser
    };
  }

  /**
   * Check if user has specific role
   * @param {string} role - Role to check
   * @returns {boolean} Whether user has role
   */
  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  }

  /**
   * Check if user has admin privileges
   * @returns {boolean} Whether user is admin
   */
  isAdmin() {
    return this.hasRole(AUTH_CONFIG.USER_ROLES.ADMIN);
  }

  /**
   * Add event listener for authentication events
   * @param {string} event - Event type
   * @param {Function} callback - Callback function
   */
  addEventListener(event, callback) {
    this.listeners.push({ event, callback });
  }

  /**
   * Remove event listener
   * @param {string} event - Event type
   * @param {Function} callback - Callback function
   */
  removeEventListener(event, callback) {
    this.listeners = this.listeners.filter(
      listener => !(listener.event === event && listener.callback === callback)
    );
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event type
   * @param {any} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners
      .filter(listener => listener.event === event)
      .forEach(listener => {
        try {
          listener.callback(data);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
  }

  /**
   * Find user by wallet address (mock implementation)
   * @param {string} address - Wallet address
   * @returns {Object|null} User data or null
   */
  findUserByAddress(address) {
    // In a real application, this would query a database or API
    // For now, return null to indicate new user
    return null;
  }

  /**
   * Generate unique user ID
   * @returns {string} User ID
   */
  generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get available authentication methods
   * @returns {Array} Available auth methods
   */
  getAvailableAuthMethods() {
    const methods = ['wallet'];
    
    if (signatureService.isWalletConnected()) {
      methods.push('signature');
    }

    return methods;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.logout();
    this.listeners = [];
    this.isInitialized = false;
  }
}

// Export singleton instance
export default new AuthService();
