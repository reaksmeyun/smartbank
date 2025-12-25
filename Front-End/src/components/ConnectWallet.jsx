// Connect Wallet Component - Simple MetaMask Web3 Authentication
import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const ConnectWallet = ({ onConnected, className = '' }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [network, setNetwork] = useState(null);

  // Check if MetaMask is installed on component mount
  useEffect(() => {
    checkMetaMaskInstallation();
  }, []);

  /**
   * Handle successful wallet connection
   */
  const handleWalletConnected = useCallback((address) => {
    if (onConnected) {
      onConnected({
        address,
        network
      });
    }
  }, [onConnected, network]);

  // Listen for account and network changes
  useEffect(() => {
    if (window.ethereum) {
      // Handle account changes
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          setConnectedAddress(null);
          setError(null);
        } else if (accounts[0] !== connectedAddress) {
          // User switched accounts
          setConnectedAddress(accounts[0]);
          handleWalletConnected(accounts[0]);
        }
      };

      // Handle network changes
      const handleChainChanged = (chainId) => {
        // Reload page on network change for simplicity
        window.location.reload();
      };

      // Listen for events
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Cleanup
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [connectedAddress, handleWalletConnected]);

  /**
   * Check if MetaMask is installed
   */
  const checkMetaMaskInstallation = () => {
    const isInstalled = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
    setIsMetaMaskInstalled(isInstalled);
  };

  /**
   * Handle wallet connection
   */
  const handleConnectWallet = async () => {
    if (!isMetaMaskInstalled) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect at least one account.');
      }

      const account = accounts[0];
      setConnectedAddress(account);

      // Get network information
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      setNetwork({
        chainId: parseInt(chainId, 16),
        name: getNetworkName(parseInt(chainId, 16))
      });

      // Call onConnected callback
      if (onConnected) {
        onConnected({
          address: account,
          network: {
            chainId: parseInt(chainId, 16),
            name: getNetworkName(parseInt(chainId, 16))
          }
        });
      }

    } catch (error) {
      console.error('Wallet connection failed:', error);

      if (error.code === 4001) {
        setError('Connection request was rejected. Please try again.');
      } else if (error.code === -32002) {
        setError('Connection request already pending. Please check MetaMask.');
      } else {
        setError(error.message || 'Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };



  /**
   * Get network name from chain ID
   */
  const getNetworkName = (chainId) => {
    const networks = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet',
      1337: 'Hardhat Local',
      31337: 'Hardhat Local',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai'
    };
    return networks[chainId] || `Unknown Network (${chainId})`;
  };

  /**
   * Format address for display
   */
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  /**
   * Check if already connected
   */
  const isAlreadyConnected = connectedAddress !== null;

  // MetaMask not installed
  if (!isMetaMaskInstalled) {
    return (
      <div className={`bg-red-500 bg-opacity-10 border border-red-400 border-opacity-30 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-2">MetaMask Required</h3>
            <p className="text-red-300 text-sm mb-4">
              MetaMask is not installed in your browser. Please install MetaMask to continue.
            </p>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Install MetaMask
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Wallet already connected - show connected state
  if (isAlreadyConnected) {
    return (
      <div className={`bg-green-500 bg-opacity-10 border border-green-400 border-opacity-30 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-green-400">Wallet Connected</h3>
              <p className="text-green-300 text-sm">
                {formatAddress(connectedAddress)}
              </p>
              {network && (
                <p className="text-green-300 text-xs mt-1">
                  {network.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-green-400" />
            <span className="text-green-400 text-sm font-medium">Connected</span>
          </div>
        </div>
      </div>
    );
  }

  // Not connected - show connect button
  return (
    <div className={`bg-blue-500 bg-opacity-10 border border-blue-400 border-opacity-30 rounded-lg p-6 ${className}`}>
      <div className="text-center">
        <Wallet className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-blue-400 mb-2">Connect Your Wallet</h3>
        <p className="text-blue-300 text-sm mb-6">
          Connect your MetaMask wallet to get started with SmartBank.
        </p>

        <button
          onClick={handleConnectWallet}
          disabled={isConnecting}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Wallet className="w-5 h-5" />
              <span>Connect Wallet</span>
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectWallet;

