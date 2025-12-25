// Registration Form Component - New user registration with Web3 wallet
import React, { useState, useEffect } from 'react';
import { UserPlus, Wallet, AlertCircle, CheckCircle, Loader2, Shield, Mail, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AUTH_CONFIG, AUTH_ERRORS } from '../../config/authConfig';

const RegisterForm = ({ onSuccess, onError, className = '' }) => {
  const { 
    register, 
    requestAuthSignature, 
    isLoading, 
    error, 
    clearError,
    user 
  } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: AUTH_CONFIG.USER_ROLES.USER,
    acceptTerms: false,
    walletAddress: ''
  });

  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [signatureStep, setSignatureStep] = useState('idle'); // idle, requesting, signing, verifying
  const [stepMessage, setStepMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Check if wallet is already connected
  useEffect(() => {
    checkWalletConnection();
  }, []);

  /**
   * Check if wallet is connected and get address
   */
  const checkWalletConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setFormData(prev => ({ ...prev, walletAddress: accounts[0] }));
          setIsWalletConnected(true);
        }
      }
    } catch (error) {
      console.error('Failed to check wallet connection:', error);
    }
  };

  /**
   * Connect wallet to the application
   */
  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setStepMessage('Connecting to wallet...');
      clearError();

      if (!window.ethereum) {
        throw new Error(AUTH_ERRORS.WALLET_NOT_CONNECTED);
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      setFormData(prev => ({ ...prev, walletAddress: accounts[0] }));
      setIsWalletConnected(true);
      setStepMessage('Wallet connected successfully!');
      
      setTimeout(() => {
        setStepMessage('');
      }, 2000);

    } catch (error) {
      console.error('Wallet connection failed:', error);
      onError?.(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Handle form field changes
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = {};

    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 20) {
      errors.username = 'Username must be less than 20 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation (optional but if provided, must be valid)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    // Wallet address validation
    if (!formData.walletAddress) {
      errors.walletAddress = 'Wallet connection is required';
    } else if (!formData.walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      errors.walletAddress = 'Invalid wallet address format';
    }

    // Terms acceptance
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions';
    }

    // Role validation
    if (!Object.values(AUTH_CONFIG.USER_ROLES).includes(formData.role)) {
      errors.role = 'Invalid role selected';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Initiate the registration process
   */
  const handleRegister = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      clearError();
      setSignatureStep('requesting');
      setStepMessage('Preparing registration...');

      // Step 1: Request signature from user
      const signatureResult = await requestAuthSignature(formData.walletAddress);
      
      if (!signatureResult.success) {
        throw new Error(signatureResult.error);
      }

      setSignatureStep('signing');
      setStepMessage('Please sign the registration message in your wallet...');

      // Step 2: Register with signature data
      const registerResult = await register({
        address: formData.walletAddress,
        signature: signatureResult.signature,
        message: signatureResult.message,
        nonce: signatureResult.nonce
      }, {
        username: formData.username,
        email: formData.email || null,
        role: formData.role
      });

      if (registerResult.success) {
        setSignatureStep('verifying');
        setStepMessage('Creating your account...');
        
        // Success!
        setSignatureStep('idle');
        setStepMessage('Account created successfully!');
        
        setTimeout(() => {
          onSuccess?.(registerResult.user);
        }, 1000);
      } else {
        throw new Error(registerResult.error);
      }

    } catch (error) {
      console.error('Registration failed:', error);
      setSignatureStep('idle');
      setStepMessage('');
      onError?.(error.message || 'Registration failed');
    }
  };

  /**
   * Reset form state
   */
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      role: AUTH_CONFIG.USER_ROLES.USER,
      acceptTerms: false,
      walletAddress: ''
    });
    setIsWalletConnected(false);
    setSignatureStep('idle');
    setStepMessage('');
    setValidationErrors({});
    clearError();
  };

  /**
   * Render connection status
   */
  const renderConnectionStatus = () => {
    if (signatureStep === 'requesting' || signatureStep === 'signing' || signatureStep === 'verifying') {
      return (
        <div className="flex items-center space-x-2 text-blue-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">{stepMessage}</span>
        </div>
      );
    }

    if (isWalletConnected) {
      return (
        <div className="flex items-center space-x-2 text-green-400">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm">Wallet Connected</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <Wallet className="w-5 h-5" />
        <span className="text-sm">No wallet connected</span>
      </div>
    );
  };

  /**
   * Render error message
   */
  const renderError = () => {
    if (!error) return null;

    return (
      <div className="bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg p-4 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-red-300 font-semibold mb-1">Registration Error</h4>
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      </div>
    );
  };

  /**
   * Render validation errors
   */
  const renderValidationErrors = () => {
    if (Object.keys(validationErrors).length === 0) return null;

    return (
      <div className="bg-yellow-500 bg-opacity-20 border border-yellow-400 border-opacity-30 rounded-lg p-4">
        <h4 className="text-yellow-300 font-semibold mb-2">Please fix the following errors:</h4>
        <ul className="text-yellow-200 text-sm space-y-1">
          {Object.entries(validationErrors).map(([field, error]) => (
            <li key={field}>• {error}</li>
          ))}
        </ul>
      </div>
    );
  };

  /**
   * Render authentication steps
   */
  const renderRegistrationSteps = () => {
    const steps = [
      { id: 1, title: 'Connect Wallet', completed: isWalletConnected },
      { id: 2, title: 'Fill Information', completed: formData.username && formData.acceptTerms },
      { id: 3, title: 'Sign & Register', completed: signatureStep === 'verifying' }
    ];

    return (
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step.completed 
                ? 'bg-green-500 text-white' 
                : signatureStep === 'idle' && step.id === 2 && isWalletConnected
                ? 'bg-blue-500 text-white'
                : 'bg-gray-600 text-gray-300'
            }`}>
              {step.completed ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                step.id
              )}
            </div>
            <span className={`text-sm ${
              step.completed ? 'text-green-300' : 'text-gray-300'
            }`}>
              {step.title}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-white border-opacity-20 p-6 ${className}`}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 bg-opacity-20 rounded-full mb-4">
          <UserPlus className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
        <p className="text-gray-300 text-sm">
          Register with your Web3 wallet to get started with SmartBank
        </p>
      </div>

      {/* Connection Status */}
      <div className="mb-6">
        {renderConnectionStatus()}
      </div>

      {/* Error Display */}
      {renderError()}

      {/* Validation Errors */}
      {renderValidationErrors()}

      {/* Registration Steps */}
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-3">Registration Steps</h3>
        {renderRegistrationSteps()}
      </div>

      {/* Wallet Connection */}
      {!isWalletConnected && (
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-semibold mb-2">
            Wallet Address
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={formData.walletAddress}
              onChange={(e) => handleInputChange('walletAddress', e.target.value)}
              placeholder="0x..."
              className="flex-1 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
              disabled={isConnecting || isLoading}
            />
            <button
              onClick={connectWallet}
              disabled={isConnecting || isLoading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2"
            >
              {isConnecting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Wallet className="w-5 h-5" />
              )}
              <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Registration Form */}
      {isWalletConnected && (
        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">
              Username *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter your username"
                className={`w-full bg-white bg-opacity-10 border rounded-lg px-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                  validationErrors.username 
                    ? 'border-red-400 focus:ring-red-400' 
                    : 'border-white border-opacity-20 focus:ring-green-400'
                }`}
                disabled={isLoading}
                maxLength={20}
              />
            </div>
            {validationErrors.username && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.username}</p>
            )}
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">
              Email (Optional)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your@email.com"
                className={`w-full bg-white bg-opacity-10 border rounded-lg px-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                  validationErrors.email 
                    ? 'border-red-400 focus:ring-red-400' 
                    : 'border-white border-opacity-20 focus:ring-green-400'
                }`}
                disabled={isLoading}
              />
            </div>
            {validationErrors.email && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.email}</p>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">
              Account Type
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className={`w-full bg-white bg-opacity-10 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:border-transparent ${
                validationErrors.role 
                  ? 'border-red-400 focus:ring-red-400' 
                  : 'border-white border-opacity-20 focus:ring-green-400'
              }`}
              disabled={isLoading}
            >
              <option value={AUTH_CONFIG.USER_ROLES.USER}>Standard User</option>
              <option value={AUTH_CONFIG.USER_ROLES.ADMIN}>Administrator</option>
            </select>
            {validationErrors.role && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.role}</p>
            )}
          </div>

          {/* Terms Acceptance */}
          <div>
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={formData.acceptTerms}
                onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                className="mt-1 w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                disabled={isLoading}
              />
              <label htmlFor="acceptTerms" className="text-sm text-gray-300">
                I accept the{' '}
                <button 
                  type="button"
                  className="text-green-400 hover:text-green-300 underline"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  terms and conditions
                </button>{' '}
                and understand that this is a demonstration application
              </label>
            </div>
            {validationErrors.acceptTerms && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.acceptTerms}</p>
            )}
          </div>
        </div>
      )}

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="mt-4 p-3 bg-black bg-opacity-20 rounded-lg">
          <h4 className="text-white font-semibold mb-2">Advanced Options</h4>
          <label className="block text-gray-300 text-sm font-semibold mb-2">
            Manual Address Entry
          </label>
          <input
            type="text"
            value={formData.walletAddress}
            onChange={(e) => handleInputChange('walletAddress', e.target.value)}
            placeholder="Enter wallet address manually"
            className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-sm"
            disabled={isConnecting || isLoading}
          />
          <p className="text-gray-400 text-xs mt-1">
            Advanced users can manually enter their wallet address
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3 mt-6">
        {isWalletConnected && formData.username && formData.acceptTerms && (
          <button
            onClick={handleRegister}
            disabled={isLoading || signatureStep !== 'idle'}
            className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isLoading || signatureStep !== 'idle' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  {signatureStep === 'requesting' && 'Preparing...'}
                  {signatureStep === 'signing' && 'Signing...'}
                  {signatureStep === 'verifying' && 'Creating...'}
                </span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Create Account</span>
              </>
            )}
          </button>
        )}
        
        <button
          onClick={resetForm}
          disabled={isLoading}
          className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
        >
          Reset
        </button>
      </div>

      {/* Security Notice */}
      <div className="mt-6 p-3 bg-blue-500 bg-opacity-20 border border-blue-400 border-opacity-30 rounded-lg">
        <div className="flex items-start space-x-2">
          <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-blue-300 font-semibold text-sm mb-1">Registration Security</h4>
            <p className="text-blue-200 text-xs">
              Your wallet signature is used only for authentication. No private keys are requested, 
              and your funds remain completely secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
