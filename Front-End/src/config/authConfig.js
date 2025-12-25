// Authentication Configuration
export const AUTH_CONFIG = {
  USER_ROLES: {
    USER: 'user',
    ADMIN: 'admin'
  },
  SUPPORTED_NETWORKS: {
    LOCALHOST: 1337,
    SEPOLIA: 11155111,
    MAINNET: 1
  },
  SESSION_DURATION: 30 * 60 * 1000, // 30 minutes
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes (for sessionService compatibility)
  SESSION_RENEWAL_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
  SIGNATURE_MESSAGE: 'Sign this message to authenticate with SmartBank',
  STORAGE_KEYS: {
    SESSION_TOKEN: 'smartbank_session_token',
    USER_PROFILE: 'smartbank_user_profile',
    LAST_ACTIVITY: 'smartbank_last_activity'
  },
  // Development mode configuration
  DEVELOPMENT: {
    ENABLED: true, // Set to false in production
    ALLOW_NO_METAMASK: true,
    MOCK_ADDRESS: '0x1234567890123456789012345678901234567890',
    MOCK_NETWORK: 'localhost',
    MOCK_BALANCE: '100.0'
  }
};

export const AUTH_ERRORS = {
  INVALID_SIGNATURE: 'Invalid signature',
  EXPIRED_SESSION: 'Session expired',
  UNAUTHORIZED: 'Unauthorized access',
  NETWORK_MISMATCH: 'Network mismatch',
  WALLET_NOT_CONNECTED: 'Wallet not connected',
  SIGNATURE_REJECTED: 'Signature request was rejected',
  UNKNOWN_ERROR: 'Unknown error occurred'
};

// Success messages for authentication operations
export const AUTH_SUCCESS = {
  REGISTRATION_SUCCESS: 'Registration successful',
  LOGIN_SUCCESS: 'Login successful',
  PROFILE_UPDATED: 'Profile updated successfully',
  SESSION_EXTENDED: 'Session extended successfully'
};

// Default user profile structure
export const DEFAULT_USER_PROFILE = {
  id: null,
  address: null,
  username: null,
  email: null,
  role: 'user',
  createdAt: null,
  lastLoginAt: null,
  preferences: {
    theme: 'light',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      marketing: false
    },
    privacy: {
      profileVisible: true,
      transactionHistoryVisible: false
    }
  },
  metadata: {
    walletType: null,
    network: null,
    lastActiveAt: null
  }
};
