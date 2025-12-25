// Login Form Component - Web3 wallet authentication interface
import React, { useState, useEffect } from 'react';
import { Wallet, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AUTH_ERRORS } from '../../config/authConfig';

const LoginForm = ({ onSuccess, onError, className = '' }) => {
  const { 
    login, 
    requestAuthSignature, 
    isLoading, 
    error, 
    clearError,
    user 
  } = useAuth();

  // Form state
  const [walletAddress, setWalletAddress] = useState('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [signatureStep, setSignatureStep] = useState('idle'); // idle, requesting, signing, verifying
  const [stepMessage, setStepMessage] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Clear errors when component mounts or user changes
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
          setWalletAddress(accounts[0]);
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

      setWalletAddress(accounts[0]);
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
   * Handle wallet address change
   */
  const handleAddressChange = (e) => {
    const address = e.target.value;
    setWalletAddress(address);
    setIsWalletConnected(!!address);
  };

  /**
   * Initiate the authentication process
   */
  const handleLogin = async () => {
    try {
      if (!walletAddress) {
        throw new Error(AUTH_ERRORS.WALLET_NOT_CONNECTED);
      }

      if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid wallet address format');
      }

      clearError();
      setSignatureStep('requesting');
      setStepMessage('Preparing authentication...');

      // Step 1: Request signature from user
      const signatureResult = await requestAuthSignature(walletAddress);
      
      if (!signatureResult.success) {
        throw new Error(signatureResult.error);
      }

      setSignatureStep('signing');
      setStepMessage('Please sign the message in your wallet...');

      // Step 2: Login with signature data
      const loginResult = await login({
        address: walletAddress,
        signature: signatureResult.signature,
        message: signatureResult.message,
        nonce: signatureResult.nonce
      });

      if (loginResult.success) {
        setSignatureStep('verifying');
        setStepMessage('Verifying authentication...');
        
        // Success!
        setSignatureStep('idle');
        setStepMessage('Authentication successful!');
        
        setTimeout(() => {
          onSuccess?.(loginResult.user);
        }, 1000);
      } else {
        throw new Error(loginResult.error);
      }

    } catch (error) {
      console.error('Login failed:', error);
      setSignatureStep('idle');
      setStepMessage('');
      onError?.(error.message || 'Authentication failed');
    }
  };

  /**
   * Reset form state
   */
  const resetForm = () => {
    setWalletAddress('');
    setIsWalletConnected(false);
    setSignatureStep('idle');
    setStepMessage('');
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
          <h4 className="text-red-300 font-semibold mb-1">Authentication Error</h4>
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      </div>
    );
  };

  /**
   * Render authentication steps
   */
  const renderAuthenticationSteps = () => {
    const steps = [
      { id: 1, title: 'Connect Wallet', completed: isWalletConnected },
      { id: 2, title: 'Sign Message', completed: signatureStep === 'verifying' },
      { id: 3, title: 'Authenticate', completed: signatureStep === 'idle' && isWalletConnected }
    ];

    return (
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step.completed 
                ? 'bg-green-500 text-white' 
                : signatureStep === 'idle' && isWalletConnected && step.id === 2
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
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full mb-4">
          <Lock className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Authenticate with Wallet</h2>
        <p className="text-gray-300 text-sm">
          Connect your wallet and sign a message to authenticate your identity
        </p>
      </div>

      {/* Connection Status */}
      <div className="mb-6">
        {renderConnectionStatus()}
      </div>

      {/* Error Display */}
      {renderError()}

      {/* Authentication Steps */}
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-3">Authentication Steps</h3>
        {renderAuthenticationSteps()}
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
              value={walletAddress}
              onChange={handleAddressChange}
              placeholder="0x..."
              className="flex-1 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              disabled={isConnecting || isLoading}
            />
            <button
              onClick={connectWallet}
              disabled={isConnecting || isLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2"
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

      {/* Advanced Options */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-blue-400 hover:text-blue-300 text-sm underline"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>
        
        {showAdvanced && (
          <div className="mt-3 p-3 bg-black bg-opacity-20 rounded-lg">
            <label className="block text-gray-300 text-sm font-semibold mb-2">
              Manual Address Entry
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={handleAddressChange}
              placeholder="Enter wallet address manually"
              className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
              disabled={isConnecting || isLoading}
            />
            <p className="text-gray-400 text-xs mt-1">
              Advanced users can manually enter their wallet address
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {isWalletConnected && (
          <button
            onClick={handleLogin}
            disabled={isLoading || signatureStep !== 'idle'}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isLoading || signatureStep !== 'idle' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  {signatureStep === 'requesting' && 'Preparing...'}
                  {signatureStep === 'signing' && 'Signing...'}
                  {signatureStep === 'verifying' && 'Verifying...'}
                </span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Authenticate</span>
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
      <div className="mt-6 p-3 bg-yellow-500 bg-opacity-20 border border-yellow-400 border-opacity-30 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-yellow-300 font-semibold text-sm mb-1">Security Notice</h4>
            <p className="text-yellow-200 text-xs">
              Never share your private keys. This application only requests a signature for authentication, 
              not access to your funds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
