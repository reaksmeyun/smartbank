// src/pages/Withdraw.jsx
import React, { useState, useEffect } from 'react';
import { ArrowUpCircle, Wallet } from 'lucide-react';
import InfoCard from '../components/InfoCard';
import { useWeb3 } from '../contexts/Web3Context';
import smartBankService from '../services/smartBankService';

const WithdrawPage = ({ onNavigate }) => {
  const { address, isConnected, canTransact, isAuthenticated, isContractInitialized } = useWeb3();
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
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handleWithdraw = async () => {
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

    const currentBalance = parseFloat(balance);
    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount > currentBalance) {
      setError(`Insufficient balance. Available: ${balance} ETH`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Initiating withdrawal...', { amount, address });
      
      const result = await smartBankService.withdraw(amount, address);
      
      if (result.success) {
        console.log('Withdrawal successful:', result);
        
        // Refresh balance after successful withdrawal
        setTimeout(async () => {
          await loadBalance();
        }, 2000);
        
        alert(`Withdrawal of ${amount} ETH successful!\nTransaction: ${result.transactionHash}`);
        setAmount('');
        
        // Navigate back to dashboard after successful withdrawal
        setTimeout(() => {
          onNavigate('dashboard');
        }, 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
      setError(`Withdrawal failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawMax = async () => {
    if (!isContractInitialized || !balance || parseFloat(balance) <= 0) {
      setError('No balance available to withdraw');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Initiating max withdrawal...', { balance, address });

      const result = await smartBankService.withdrawMax(address);

      if (result.success) {
        console.log('Max withdrawal successful:', result);

        // Refresh balance after successful withdrawal
        setTimeout(async () => {
          await loadBalance();
        }, 2000);

        alert(`Max withdrawal of ${balance} ETH successful!\nTransaction: ${result.transactionHash}`);

        // Navigate back to dashboard after successful withdrawal
        setTimeout(() => {
          onNavigate('dashboard');
        }, 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Max withdrawal failed:', error);
      setError(`Max withdrawal failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white bg-opacity-10 backdrop-blur-md p-10 rounded-2xl border border-white border-opacity-20 shadow-2xl">
          <div className="flex items-center justify-center mb-8">
            <ArrowUpCircle className="w-16 h-16 text-orange-400" />
          </div>
          
          <h1 className="text-4xl font-bold text-white text-center mb-3">Withdraw ETH</h1>
          <p className="text-gray-300 text-center mb-8">
            Withdraw your ETH from the SmartBank vault to your wallet
          </p>

          <div className="space-y-6">
            <div className="bg-white bg-opacity-5 border border-white border-opacity-20 rounded-lg p-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400 text-sm">Available Balance</span>
                <Wallet className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-white">{balance} ETH</p>
              <p className="text-gray-500 text-sm mt-1">
                {!isAuthenticated ? 'Authenticate to view balance' : isContractInitialized ? 'Balance loaded' : 'Loading...'}
              </p>
            </div>

            {error && (
              <div className="bg-red-900 bg-opacity-30 border border-red-400 border-opacity-30 rounded-lg p-4">
                <p className="text-sm text-red-200">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                max={balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg px-4 py-3 text-white text-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>

            <div className="bg-yellow-900 bg-opacity-30 border border-yellow-400 border-opacity-30 rounded-lg p-4">
              <p className="text-sm text-yellow-200">
                <strong>Important:</strong> You can only withdraw funds that you have deposited. Make sure you have sufficient balance.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleWithdraw}
                disabled={isLoading || !canTransact || !isContractInitialized || !amount || parseFloat(amount) <= 0}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-500 disabled:to-gray-600 text-white py-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? 'Processing...' : 'Withdraw ETH'}
              </button>
              
              <button
                onClick={handleWithdrawMax}
                disabled={isLoading || !canTransact || !isContractInitialized || parseFloat(balance) <= 0}
                className="px-6 py-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-bold transition-all duration-200 transform hover:scale-105 shadow-lg disabled:cursor-not-allowed disabled:transform-none"
              >
                Max
              </button>
            </div>

            <div className="text-center text-sm text-gray-400">
              {!isAuthenticated && 'Please authenticate to make transactions'}
              {isAuthenticated && !isConnected && 'Please connect wallet'}
              {isAuthenticated && isConnected && isContractInitialized && 'Transaction will require MetaMask confirmation'}
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <InfoCard 
            title="Your Control" 
            description="Only you can withdraw your deposited funds" 
          />
          <InfoCard 
            title="Fast Processing" 
            description="Withdrawals are processed immediately on-chain" 
          />
        </div>
      </div>
    </div>
  );
};

export default WithdrawPage;