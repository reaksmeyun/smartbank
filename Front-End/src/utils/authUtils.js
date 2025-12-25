// Authentication Utilities - Helper functions for authentication operations
import { AUTH_CONFIG, AUTH_ERRORS } from '../config/authConfig';

/**
 * Format wallet address for display
 * @param {string} address - Wallet address
 * @param {number} startChars - Number of characters to show at start
 * @param {number} endChars - Number of characters to show at end
 * @returns {string} Formatted address
 */
export const formatAddress = (address, startChars = 6, endChars = 4) => {
  if (!address || typeof address !== 'string') return '';
  
  if (address.length <= startChars + endChars) {
    return address;
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Validate wallet address format
 * @param {string} address - Address to validate
 * @returns {boolean} Whether address is valid
 */
export const isValidAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Normalize address to lowercase
 * @param {string} address - Address to normalize
 * @returns {string} Normalized address
 */
export const normalizeAddress = (address) => {
  if (!address) return '';
  return address.toLowerCase();
};

/**
 * Generate a random nonce
 * @returns {string} Random nonce
 */
export const generateNonce = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return '0x' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Generate a unique session ID
 * @returns {string} Unique session ID
 */
export const generateSessionId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 9);
  return `session_${timestamp}_${randomPart}`;
};

/**
 * Generate a user ID
 * @returns {string} User ID
 */
export const generateUserId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 9);
  return `user_${timestamp}_${randomPart}`;
};

/**
 * Create authentication message
 * @param {string} nonce - Nonce for the message
 * @param {string} address - User address
 * @returns {string} Authentication message
 */
export const createAuthMessage = (nonce, address = '') => {
  const timestamp = Date.now();
  const expires = timestamp + (30 * 60 * 1000); // 30 minutes
  
  return AUTH_CONFIG.AUTH_MESSAGE_TEMPLATE
    .replace('{nonce}', nonce)
    .replace('{timestamp}', new Date(timestamp).toISOString())
    .replace('{expires}', new Date(expires).toISOString());
};

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {Object} Validation result
 */
export const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }
  
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 20) {
    return { valid: false, error: 'Username must be less than 20 characters' };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { valid: true };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {Object} Validation result
 */
export const validateEmail = (email) => {
  if (!email) {
    return { valid: true }; // Email is optional
  }
  
  if (typeof email !== 'string') {
    return { valid: false, error: 'Email must be a string' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true };
};

/**
 * Validate role
 * @param {string} role - Role to validate
 * @returns {boolean} Whether role is valid
 */
export const isValidRole = (role) => {
  return Object.values(AUTH_CONFIG.USER_ROLES).includes(role);
};

/**
 * Check if session is expired
 * @param {number} expiresAt - Expiration timestamp
 * @returns {boolean} Whether session is expired
 */
export const isSessionExpired = (expiresAt) => {
  if (!expiresAt) return true;
  return Date.now() > expiresAt;
};

/**
 * Get time remaining in session
 * @param {number} expiresAt - Expiration timestamp
 * @returns {number} Time remaining in milliseconds
 */
export const getTimeRemaining = (expiresAt) => {
  if (!expiresAt) return 0;
  return Math.max(0, expiresAt - Date.now());
};

/**
 * Format time remaining for display
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} Formatted time string
 */
export const formatTimeRemaining = (milliseconds) => {
  if (milliseconds <= 0) return 'Expired';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Check if session is expiring soon
 * @param {number} expiresAt - Expiration timestamp
 * @param {number} threshold - Warning threshold in milliseconds
 * @returns {boolean} Whether session is expiring soon
 */
export const isSessionExpiringSoon = (expiresAt, threshold = AUTH_CONFIG.SESSION_RENEWAL_THRESHOLD) => {
  return getTimeRemaining(expiresAt) <= threshold;
};

/**
 * Sanitize user input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Generate secure token
 * @param {number} length - Token length
 * @returns {string} Secure token
 */
export const generateSecureToken = (length = 32) => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Encrypt data (simple base64 encoding - use proper encryption in production)
 * @param {string} data - Data to encrypt
 * @returns {string} Encrypted data
 */
export const encryptData = (data) => {
  try {
    return btoa(data);
  } catch (error) {
    console.error('Encryption failed:', error);
    return data; // Return original data if encryption fails
  }
};

/**
 * Decrypt data (simple base64 decoding - use proper decryption in production)
 * @param {string} encryptedData - Data to decrypt
 * @returns {string} Decrypted data
 */
export const decryptData = (encryptedData) => {
  try {
    return atob(encryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedData; // Return original data if decryption fails
  }
};

/**
 * Get browser information
 * @returns {Object} Browser information
 */
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  
  // eslint-disable-next-line no-restricted-globals
  const screenInfo = typeof screen !== 'undefined' ? {
    // eslint-disable-next-line no-restricted-globals
    width: screen.width,
    // eslint-disable-next-line no-restricted-globals
    height: screen.height,
    // eslint-disable-next-line no-restricted-globals
    colorDepth: screen.colorDepth
  } : { width: 0, height: 0, colorDepth: 0 };
  
  return {
    userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    screen: screenInfo,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };
};

/**
 * Check if wallet is available
 * @returns {Object} Wallet availability status
 */
export const checkWalletAvailability = () => {
  return {
    ethereum: typeof window.ethereum !== 'undefined',
    web3: typeof window.web3 !== 'undefined',
    solana: typeof window.solana !== 'undefined',
    phantom: typeof window.phantom !== 'undefined'
  };
};

/**
 * Get wallet type
 * @param {string} provider - Provider name or detection method
 * @returns {string} Wallet type
 */
export const getWalletType = (provider) => {
  if (!provider) return 'unknown';
  
  const providerStr = provider.toString().toLowerCase();
  
  if (providerStr.includes('metamask')) return 'metamask';
  if (providerStr.includes('walletconnect')) return 'walletconnect';
  if (providerStr.includes('coinbase')) return 'coinbase';
  if (providerStr.includes('trust')) return 'trust';
  if (providerStr.includes('phantom')) return 'phantom';
  if (providerStr.includes('solflare')) return 'solflare';
  
  return 'unknown';
};

/**
 * Parse error message for user-friendly display
 * @param {Error|string} error - Error to parse
 * @returns {string} User-friendly error message
 */
export const parseErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    // Handle common Web3 errors
    if (error.message.includes('User denied')) {
      return 'Transaction was rejected';
    }
    
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }
    
    if (error.message.includes('gas')) {
      return 'Insufficient gas for transaction';
    }
    
    return error.message;
  }
  
  return AUTH_ERRORS.UNKNOWN_ERROR;
};

/**
 * Debounce function for search and validation
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Throttle function for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  
  return (...args) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    }
};

/**
 * Check if value return cloned;
  is empty
 * @param {any} value - Value to check
 * @returns {boolean} Whether value is empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Get local storage item with error handling
 * @param {string} key - Storage key
 * @returns {any} Stored value or null
 */
export const safeGetStorageItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Failed to get storage item:', error);
    return null;
  }
};

/**
 * Set local storage item with error handling
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {boolean} Success status
 */
export const safeSetStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Failed to set storage item:', error);
    return false;
  }
};

/**
 * Remove local storage item with error handling
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export const safeRemoveStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed to remove storage item:', error);
    return false;
  }
};

/**
 * Clear all authentication-related storage
 * @returns {boolean} Success status
 */
export const clearAuthStorage = () => {
  const keys = Object.values(AUTH_CONFIG.STORAGE_KEYS);
  let success = true;
  
  keys.forEach(key => {
    if (!safeRemoveStorageItem(key)) {
      success = false;
    }
  });
  
  return success;
};

// Export all utilities
export default {
  formatAddress,
  isValidAddress,
  normalizeAddress,
  generateNonce,
  generateSessionId,
  generateUserId,
  createAuthMessage,
  validateUsername,
  validateEmail,
  isValidRole,
  isSessionExpired,
  getTimeRemaining,
  formatTimeRemaining,
  isSessionExpiringSoon,
  sanitizeInput,
  generateSecureToken,
  encryptData,
  decryptData,
  getBrowserInfo,
  checkWalletAvailability,
  getWalletType,
  parseErrorMessage,
  debounce,
  throttle,
  deepClone,
  isEmpty,
  safeGetStorageItem,
  safeSetStorageItem,
  safeRemoveStorageItem,
  clearAuthStorage
};
