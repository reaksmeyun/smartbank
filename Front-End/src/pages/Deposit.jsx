// src/pages/Deposit.jsx
import React, { useState, useEffect } from 'react';
import { ArrowDownCircle } from 'lucide-react';
import InfoCard from '../components/InfoCard';
import { useWeb3 } from '../contexts/Web3Context';
import smartBankService from '../services/smartBankService';

const DepositPage = ({ onNavigate }) => {
  const { address, network, isConnected, canTransact, isAuthenticated, isContractInitialized } = useWeb3();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState('0');

  // Load balance when contract is initialized
  useEffect(() => {
    if (isContractInitialized && address) {
      loadBalance();
    }
  }, [isContractInitialized, address]);

  // Load current SmartBank balance
  const loadBalance = async () => {
    if (!isContractInitialized || !address) return;
    
    try {
      const balanceResult = await smartBankService.getUserBalance(address);
      if (balanceResult.success) {
        setBalance(balanceResult.balance);
      }
    } catch (_error) {
      console.error('Failed to load balance:', _error);
    }
  };

  // Load balance when component mounts or when transaction completes
  useEffect(() => {
    if (isContractInitialized && address) {
      loadBalance();
    }
  }, [isContractInitialized, address]);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!isContractInitialized) {
      setError('Contract not initialized');
      return;
    }

    if (!canTransact) {
      setError('Please authenticate and connect wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Initiating deposit...', { amount, address });

      const result = await smartBankService.deposit(amount, address);

      if (result.success) {
        console.log('Deposit successful:', result);

        // Refresh balance after successful deposit
        setTimeout(async () => {
          await loadBalance();
        }, 2000);

        alert(`Deposit of ${amount} ETH successful!\nTransaction: ${result.transactionHash}`);
        setAmount('');

        // Navigate back to dashboard after successful deposit
        setTimeout(() => {
          onNavigate('dashboard');
        }, 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Deposit failed:', error);
      setError(`Deposit failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white bg-opacity-10 backdrop-blur-md p-10 rounded-2xl border border-white border-opacity-20 shadow-2xl">
          <div className="flex items-center justify-center mb-8">
            <ArrowDownCircle className="w-16 h-16 text-green-400" />
          </div>
          
          <h1 className="text-4xl font-bold text-white text-center mb-3">Deposit ETH</h1>
          <p className="text-gray-300 text-center mb-8">
            Securely deposit your ETH into the SmartBank vault
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg px-4 py-3 text-white text-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-900 bg-opacity-30 border border-red-400 border-opacity-30 rounded-lg p-4">
                <p className="text-sm text-red-200">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}

            <div className="bg-white bg-opacity-5 border border-white border-opacity-20 rounded-lg p-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400 text-sm">Current SmartBank Balance</span>
                <ArrowDownCircle className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white">{balance} ETH</p>
              <p className="text-gray-500 text-sm mt-1">
                {!isAuthenticated ? 'Authenticate to view balance' : isContractInitialized ? 'Balance loaded' : 'Loading...'}
              </p>
            </div>

            <div className="bg-blue-900 bg-opacity-30 border border-blue-400 border-opacity-30 rounded-lg p-4">
              <p className="text-sm text-blue-200">
                <strong>Network:</strong> {network?.name || 'Unknown'} | 
                <strong> Min Deposit:</strong> 0.001 ETH
              </p>
            </div>

            <button
              onClick={handleDeposit}
              disabled={isLoading || !canTransact || !isContractInitialized || parseFloat(amount) < 0.001}
              className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 disabled:from-gray-500 disabled:to-gray-600 text-white py-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Processing...' : 'Deposit ETH'}
            </button>

            <div className="text-center text-sm text-gray-400">
              {!isAuthenticated && 'Please authenticate to make transactions'}
              {isAuthenticated && !isConnected && 'Please connect wallet'}
              {isAuthenticated && isConnected && isContractInitialized && 'Transaction will require MetaMask confirmation'}
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <InfoCard 
            title="Safe & Secure" 
            description="Your funds are protected by audited smart contract code" 
          />
          <InfoCard 
            title="Instant Updates" 
            description="Your balance updates in real-time after confirmation" 
          />
        </div>
      </div>
    </div>
  );
};

export default DepositPage;
