// src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp, Loader2, ShieldCheck, Heart, Activity, DollarSign, Database, ExternalLink } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { useAuth } from '../contexts/AuthContext';
import smartBankService from '../services/smartBankService';
import transactionService from '../services/transactionService';
import { SmartBankUtils, CONTRACT_ADDRESSES } from '../config/SmartBankConfig';
import StatCard from '../components/StatCard';
import TransactionHistory from '../components/TransactionHistory';
import useInterestSimulation from '../hooks/useInterestSimulation';

const DashboardPage = ({ onNavigate }) => {
  const {
    address,
    balance,
    isConnected,
    isAuthenticated,
    formattedAddress,
    canTransact,
    network,
    connectWallet,
    authenticateWithWeb3,
    isOwner,
    contract,
    provider
  } = useWeb3();

  const { user } = useAuth();
  const [userBalance, setUserBalance] = useState('0.0000');
  const [rawPrincipal, setRawPrincipal] = useState(0);
  const [lastInteraction, setLastInteraction] = useState(0);
  const [lifetimeInterest, setLifetimeInterest] = useState('0.0000');
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [stats, setStats] = useState({ deposits: '0.000', withdrawals: '0.000' });
  const [bankStats, setBankStats] = useState({ liquidity: '0.000', profit: '0.000', health: 100 });
  const [enrichedHistory, setEnrichedHistory] = useState([]);

  // Real-time Interest Simulation
  const { pendingYield, projectedTotal } = useInterestSimulation(rawPrincipal, lastInteraction, isAuthenticated);

  const loadDashboardData = useCallback(async () => {
    if (!isAuthenticated || !address) return;

    try {
      setLoading(true);

      // 1. Fetch interest accrual details (principal and timing)
      const interestDetails = await smartBankService.getInterestDetails(address);
      if (interestDetails.success) {
        // Use the Ether string directly for display and simulation
        setUserBalance(interestDetails.principal);
        setRawPrincipal(interestDetails.principal); // Now passing Ether string
        setLastInteraction(interestDetails.lastInteraction);
      }

      // 2. Fetch lifetime interest from contract mapping
      const interestResult = await smartBankService.getLifetimeInterest(address);
      if (interestResult.success) {
        setLifetimeInterest(SmartBankUtils.formatDisplayBalance(interestResult.rawInterest, 6));
      }

      // 3. Fetch Bank Statistics (Health Indicator)
      const bankResult = await smartBankService.getBankStatistics();
      if (bankResult.success) {
        const liab = parseFloat(bankResult.userLiabilities);
        const liq = parseFloat(bankResult.totalLiquidity);
        const healthScore = liab > 0 ? Math.min(100, (liq / liab) * 100) : 100;

        setBankStats({
          liquidity: bankResult.totalLiquidity,
          profit: bankResult.bankProfit,
          health: healthScore.toFixed(1)
        });
      }

      // 4. Load Unified Transaction History (with Balance After calculation)
      const historyResult = await transactionService.getUserTransactionHistory(address);
      if (historyResult.success) {
        const sortedHistory = [...historyResult.transactions].sort((a, b) =>
          Number(a.timestamp) - Number(b.timestamp)
        );

        let runningBalance = 0;
        const enriched = sortedHistory.map(tx => {
          const amount = parseFloat(tx.amount);
          const isDeposit = tx.eventType === 'Deposit' || tx.eventType === 'InterestPaid';

          if (isDeposit) {
            runningBalance += amount;
          } else {
            runningBalance -= amount;
          }

          return {
            ...tx,
            balanceAfter: runningBalance.toFixed(4)
          };
        });

        setEnrichedHistory([...enriched].reverse());

        // 5. Load unified stats for aggregate cards
        const statsResult = await transactionService.getUserTransactionStats(address);
        if (statsResult.success) {
          setStats({
            inflow: statsResult.stats.totalInflow.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
            outflow: statsResult.stats.totalOutflow.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
            depositCount: statsResult.stats.depositCount,
            withdrawalCount: statsResult.stats.withdrawalCount
          });
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, address]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, isConnected]);

  // Initialize unified transaction service
  useEffect(() => {
    const initializeService = async () => {
      if (provider && contract && address && isAuthenticated) {
        try {
          const signer = await provider.getSigner();
          const network = await provider.getNetwork();
          await transactionService.initialize(provider, signer, contract, network);
          console.log('Transaction service initialized from Dashboard');
          loadDashboardData(); // Reload once initialized
        } catch (error) {
          console.error('Failed to initialize transaction service in Dashboard:', error);
        }
      }
    };

    initializeService();
  }, [provider, contract, address, isAuthenticated, loadDashboardData]);

  // Set up real-time subscription for dashboard updates
  useEffect(() => {
    if (!isAuthenticated || !address) return;

    const subscription = transactionService.subscribeToUserEvents(address, (newEvent) => {
      console.log('New event received in Dashboard, refreshing...', newEvent);
      loadDashboardData();
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [address, isAuthenticated, loadDashboardData]);

  const handleWithdrawFees = async () => {
    if (!isOwner) return;
    try {
      setAdminLoading(true);
      const result = await smartBankService.withdrawFees();
      if (result.success) {
        alert('Treasury fees successfully withdrawn!');
        loadDashboardData();
      }
    } catch (err) {
      alert('Withdrawal failed: ' + err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const AdminSection = () => (
    <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-purple-900 rounded-3xl border border-blue-400 border-opacity-30 p-8 mb-12 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <ShieldCheck className="w-32 h-32 text-blue-400" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Admin Command Center</h2>
            </div>
            <p className="text-blue-200 text-sm font-medium opacity-80 max-w-md">
              Secure oversight of the SmartBank protocol. You are currently connected as the contract owner.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black bg-opacity-30 p-4 rounded-2xl border border-white border-opacity-10">
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest block mb-1">Contract Proxy</span>
              <a href={`https://etherscan.io/address/${CONTRACT_ADDRESSES.localhost}`} target="_blank" rel="noreferrer" className="text-white font-mono text-xs hover:text-blue-400 flex items-center">
                {SmartBankUtils.formatAddress(CONTRACT_ADDRESSES.localhost, 6)} <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
            <div className="bg-green-500 bg-opacity-10 p-4 rounded-2xl border border-green-400 border-opacity-20 transition-all hover:bg-opacity-20">
              <span className="text-[10px] font-bold text-green-300 uppercase tracking-widest block mb-1">Bank Revenue</span>
              <div className="text-xl font-black text-white">{bankStats.profit} ETH</div>
            </div>
          </div>

          <button
            onClick={handleWithdrawFees}
            disabled={adminLoading || parseFloat(bankStats.profit) <= 0}
            className="group relative px-8 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 text-white font-bold rounded-2xl shadow-xl transition-all duration-300 flex items-center space-x-2 overflow-hidden"
          >
            {adminLoading ? <Loader2 className="animate-spin" /> : <DollarSign className="w-5 h-5 group-hover:scale-125 transition-transform" />}
            <span>{adminLoading ? 'Processing...' : 'Claim Treasury Fees'}</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>
        </div>
      </div>
    </div>
  );

  const BankHealthIndicator = () => (
    <div className="bg-white bg-opacity-5 backdrop-blur-md rounded-2xl border border-white border-opacity-10 p-6 flex items-center justify-between mb-8 group hover:border-opacity-30 transition-all">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-2xl bg-opacity-10 ${parseFloat(bankStats.health) > 90 ? 'bg-green-400' : 'bg-yellow-400'}`}>
          <Activity className={`w-6 h-6 ${parseFloat(bankStats.health) > 90 ? 'text-green-400' : 'text-yellow-400'}`} />
        </div>
        <div>
          <h4 className="text-white font-bold text-lg">Bank Health Status</h4>
          <p className="text-gray-400 text-sm">Real-time liquidity coverage for all user deposits</p>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center justify-end space-x-2">
          <Heart className={`w-5 h-5 ${parseFloat(bankStats.health) > 90 ? 'text-green-400' : 'text-red-400'} animate-pulse`} fill="currentColor" />
          <span className="text-3xl font-black text-white">{bankStats.health}%</span>
        </div>
        <div className="w-48 h-2 bg-gray-800 rounded-full mt-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${parseFloat(bankStats.health) > 90 ? 'bg-green-400' : 'bg-yellow-400'}`}
            style={{ width: `${bankStats.health}%` }}
          ></div>
        </div>
      </div>
    </div>
  );

  if (loading && !enrichedHistory.length) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <Database className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-400" />
        </div>
        <span className="text-white font-bold mt-8 text-xl tracking-tighter uppercase italic opacity-50">Syncing Protocol Data</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
              <span className="text-blue-400 font-black uppercase text-xs tracking-[0.3em]">Institutional Grade Web3 Banking</span>
            </div>
            <h1 className="text-6xl font-black text-white tracking-tighter leading-none mb-4">
              {smartBankService.getNetworkKey(network?.chainId) === 'localhost' ? 'DEV_BANK' : 'SMARTBANK'}<span className="text-blue-500">.</span>
            </h1>
            <p className="text-gray-400 font-medium max-w-lg">
              Welcome back, <span className="text-white font-bold">{user?.username || formattedAddress}</span>.
              Your assets are protected by immutable smart contract logic.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Protocol Node</p>
              <div className="flex items-center justify-end space-x-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-white font-bold">{network?.name || 'Hardhat Local'}</span>
              </div>
            </div>
          </div>
        </div>

        {isOwner && <AdminSection />}

        <BankHealthIndicator />

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Main Balance Card (Interest Pulsing) */}
          <div className="md:col-span-2 relative p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl overflow-hidden group">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-white opacity-10 blur-3xl rounded-full group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-12">
                <span className="bg-white bg-opacity-20 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-white border-opacity-20">Live Assets</span>
                <Wallet className="w-8 h-8 text-white opacity-80" />
              </div>

              <div className="flex flex-col md:flex-row md:items-end gap-x-8 gap-y-2">
                <div>
                  <h3 className="text-white text-opacity-70 text-sm font-bold uppercase tracking-widest mb-1">Projected Balance</h3>
                  <div className="text-6xl md:text-7xl font-black text-white tracking-tighter tabular-nums drop-shadow-lg">
                    {projectedTotal.toFixed(6)} <span className="text-2xl opacity-50 -ml-2">ETH</span>
                  </div>
                </div>

                <div className="pb-2">
                  <div className="flex items-center space-x-2 text-green-300 font-black text-xl mb-1">
                    <TrendingUp className="w-5 h-5 animate-bounce" />
                    <span>+{pendingYield.toFixed(8)}</span>
                    <span className="text-xs opacity-70">PENDING YIELD</span>
                  </div>
                  <div className="w-full h-1 bg-white bg-opacity-20 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 animate-loading-bar" style={{ width: '40%' }}></div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white border-opacity-10 grid grid-cols-2 gap-8">
                <div>
                  <span className="text-blue-100 text-[10px] font-bold uppercase tracking-widest block mb-1">Principal Deposit</span>
                  <span className="text-white font-black text-xl">{userBalance} ETH</span>
                </div>
                <div>
                  <span className="text-blue-100 text-[10px] font-bold uppercase tracking-widest block mb-1">Lifetime Earnings</span>
                  <span className="text-white font-black text-xl">{lifetimeInterest} ETH</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white bg-opacity-5 rounded-3xl border border-white border-opacity-10 p-8 hover:bg-opacity-10 transition-all border-l-4 border-l-green-500">
              <div className="flex items-center justify-between mb-4">
                <ArrowDownCircle className="text-green-400 w-8 h-8" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Aggregate Inflow</span>
              </div>
              <div className="text-4xl font-black text-white tracking-tighter">{stats.inflow || '0.0000'} <span className="text-sm opacity-30">ETH</span></div>
            </div>

            <div className="bg-white bg-opacity-5 rounded-3xl border border-white border-opacity-10 p-8 hover:bg-opacity-10 transition-all border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between mb-4">
                <ArrowUpCircle className="text-orange-400 w-8 h-8" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Aggregate Outflow</span>
              </div>
              <div className="text-4xl font-black text-white tracking-tighter">{stats.outflow || '0.0000'} <span className="text-sm opacity-30">ETH</span></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <button
            onClick={() => onNavigate('deposit')}
            disabled={!canTransact}
            className="group relative h-20 bg-green-500 hover:bg-green-600 disabled:bg-gray-800 rounded-3xl font-black text-white text-xl uppercase tracking-tighter overflow-hidden transition-all shadow-xl hover:shadow-green-500/20"
          >
            <div className="absolute inset-0 flex items-center justify-center space-x-3 z-10">
              <ArrowDownCircle className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
              <span>Initiate Deposit</span>
            </div>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>

          <button
            onClick={() => onNavigate('withdraw')}
            disabled={!canTransact}
            className="group relative h-20 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-800 rounded-3xl font-black text-white text-xl uppercase tracking-tighter overflow-hidden transition-all shadow-xl hover:shadow-orange-500/20"
          >
            <div className="absolute inset-0 flex items-center justify-center space-x-3 z-10">
              <ArrowUpCircle className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
              <span>Withdraw Assets</span>
            </div>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>
        </div>

        {/* Unified Ledger Section */}
        <div className="mb-8">
          <TransactionHistory
            transactions={enrichedHistory}
            limit={10}
            showHeader={true}
            onRefresh={loadDashboardData}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;