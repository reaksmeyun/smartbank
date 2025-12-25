// SmartBank Contract Service
import { ethers } from 'ethers';
import { SmartBankABI, CONTRACT_ADDRESSES, NETWORK_CONFIGS, SmartBankUtils } from '../config/SmartBankConfig';

class SmartBankService {
  constructor() {
    this.contract = null;
    this.provider = null;
    this.signer = null;
  }

  /**
   * Initialize contract connection
   */
  initialize(provider, signer, network) {
    try {
      this.provider = provider;
      this.signer = signer;

      // Determine which network we're on and get contract address
      const chainId = network?.chainId || 1337; // Default to localhost (1337)
      const networkKey = this.getNetworkKey(chainId);
      const contractAddress = CONTRACT_ADDRESSES[networkKey];

      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error(`SmartBank contract not deployed on ${networkKey}. Please deploy first.`);
      }

      this.contract = new ethers.Contract(contractAddress, SmartBankABI, signer);
      return {
        success: true,
        contract: this.contract,
        network: networkKey
      };
    } catch (error) {
      console.error('Failed to initialize SmartBank contract:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get network key based on chain ID
   */
  getNetworkKey(chainId) {
    const networkMap = {
      1337: 'localhost',
      31337: 'localhost',
      11155111: 'sepolia',
      1: 'mainnet'
    };
    return networkMap[chainId] || 'localhost';
  }

  /**
   * Get user's SmartBank balance (with interest)
   */
  async getUserBalance(userAddress) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const balance = await this.contract.getBalance(userAddress);
      console.log(`[SmartBankService] Balance for ${userAddress}:`, balance.toString());
      return {
        success: true,
        balance: SmartBankUtils.formatBalance(balance),
        rawBalance: balance.toString()
      };
    } catch (error) {
      console.error('Failed to get user balance:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's lifetime interest earned
   */
  async getLifetimeInterest(userAddress) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const interest = await this.contract.lifetimeInterest(userAddress);
      return {
        success: true,
        interest: SmartBankUtils.formatBalance(interest),
        rawInterest: interest.toString()
      };
    } catch (error) {
      console.error('Failed to get lifetime interest:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get transaction history for user
   */
  async getTransactionHistory(userAddress) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const history = await this.contract.getHistory(userAddress);
      const formattedHistory = history.map(tx => {
        // Normalize transaction type names to match events
        const normalizedType = tx.txType;

        return {
          id: `${tx.txType}-${tx.timestamp}-${tx.amount}`,
          type: SmartBankUtils.formatTransactionType(normalizedType),
          eventType: normalizedType,
          amount: SmartBankUtils.formatBalance(tx.amount),
          rawAmount: tx.amount.toString(),
          timestamp: tx.timestamp,
          date: SmartBankUtils.formatTimestamp(tx.timestamp),
          txType: tx.txType,
          dataSource: 'contract_storage'
        };
      });

      return {
        success: true,
        history: formattedHistory,
        rawHistory: history
      };
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Deposit ETH to SmartBank
   */
  async deposit(amount, userAddress) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract not initialized');
      }

      // Validate amount
      if (!SmartBankUtils.isValidDepositAmount(amount)) {
        throw new Error('Minimum deposit amount is 0.001 ETH');
      }

      // Parse amount to wei
      const value = ethers.parseEther(amount.toString());

      // Send transaction
      const tx = await this.contract.deposit({ value });

      // Wait for confirmation
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        transaction: tx,
        receipt: receipt,
        amount: amount,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      console.error('Deposit failed:', error);
      return {
        success: false,
        error: error.message,
        code: error.code || 'DEPOSIT_FAILED'
      };
    }
  }

  /**
   * Withdraw ETH from SmartBank
   */
  async withdraw(amount, userAddress) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract not initialized');
      }

      // Get current balance
      const balanceResult = await this.getUserBalance(userAddress);
      if (!balanceResult.success) {
        throw new Error('Failed to check balance');
      }

      const currentBalance = parseFloat(balanceResult.balance);
      const withdrawAmount = parseFloat(amount);

      if (withdrawAmount > currentBalance) {
        throw new Error('Insufficient balance for withdrawal');
      }

      // Convert amount to wei
      const value = ethers.parseEther(amount.toString());

      // Send transaction
      const tx = await this.contract.withdraw(value);

      // Wait for confirmation
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        transaction: tx,
        receipt: receipt,
        amount: amount,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      console.error('Withdrawal failed:', error);
      return {
        success: false,
        error: error.message,
        code: error.code || 'WITHDRAWAL_FAILED'
      };
    }
  }

  /**
   * Withdraw maximum available balance
   */
  async withdrawMax(userAddress) {
    try {
      const balanceResult = await this.getUserBalance(userAddress);
      if (!balanceResult.success) {
        throw new Error('Failed to get balance');
      }

      return this.withdraw(balanceResult.balance, userAddress);
    } catch (error) {
      console.error('Max withdrawal failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get bank statistics (total liquidity and bank profit)
   */
  async getBankStatistics() {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const stats = await this.contract.getBankStatistics();
      return {
        success: true,
        totalLiquidity: SmartBankUtils.formatBalance(stats[0]),
        bankProfit: SmartBankUtils.formatBalance(stats[1]),
        rawLiquidity: stats[0].toString(),
        rawProfit: stats[1].toString()
      };
    } catch (error) {
      console.error('Failed to get bank statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Listen for SmartBank events
   */
  setupEventListeners(userAddress, callbacks = {}) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const eventHandlers = [];

    // Listen for deposits
    const depositListener = this.contract.on('Deposit', (user, amount, timestamp) => {
      if (user.toLowerCase() === userAddress.toLowerCase()) {
        callbacks.onDeposit?.({
          user,
          amount: SmartBankUtils.formatBalance(amount),
          rawAmount: amount.toString(),
          timestamp,
          date: SmartBankUtils.formatTimestamp(timestamp)
        });
      }
    });
    eventHandlers.push(depositListener);

    // Listen for withdrawals
    const withdrawListener = this.contract.on('Withdraw', (user, amount, timestamp) => {
      if (user.toLowerCase() === userAddress.toLowerCase()) {
        callbacks.onWithdraw?.({
          user,
          amount: SmartBankUtils.formatBalance(amount),
          rawAmount: amount.toString(),
          timestamp,
          date: SmartBankUtils.formatTimestamp(timestamp)
        });
      }
    });
    eventHandlers.push(withdrawListener);

    // Listen for interest payments
    const interestListener = this.contract.on('InterestPaid', (user, amount, timestamp) => {
      if (user.toLowerCase() === userAddress.toLowerCase()) {
        callbacks.onInterest?.({
          user,
          amount: SmartBankUtils.formatBalance(amount),
          rawAmount: amount.toString(),
          timestamp,
          date: SmartBankUtils.formatTimestamp(timestamp)
        });
      }
    });
    eventHandlers.push(interestListener);

    // Return cleanup function
    return () => {
      eventHandlers.forEach(listener => {
        if (listener && listener.removeListener) {
          listener.removeListener();
        }
      });
    };
  }

  /**
   * Check if contract is properly deployed and accessible
   */
  async checkContractHealth() {
    try {
      if (!this.contract) {
        return {
          healthy: false,
          error: 'Contract not initialized'
        };
      }

      // Try to call a view function
      const stats = await this.contract.getBankStatistics();
      return {
        healthy: true,
        totalLiquidity: SmartBankUtils.formatBalance(stats[0]),
        bankProfit: SmartBankUtils.formatBalance(stats[1])
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Get contract constants for UI display
   */
  getContractConstants() {
    return {
      interestRate: '5%',
      performanceFee: '10%',
      minDeposit: '0.001 ETH',
      secondsInYear: 31536000,
      baseRateFactor: 10000
    };
  }

  /**
   * Format transaction for display
   */
  formatTransaction(tx) {
    return {
      id: `${tx.type}-${tx.timestamp}-${tx.amount}`,
      type: SmartBankUtils.formatTransactionType(tx.type),
      amount: `${tx.amount} ETH`,
      rawAmount: tx.rawAmount,
      date: SmartBankUtils.formatTimestamp(tx.timestamp),
      timestamp: tx.timestamp,
      timestampMs: tx.timestamp * 1000
    };
  }

  /**
   * Calculate estimated interest (client-side estimation)
   */
  estimateInterest(balance, timePassedYears = 1) {
    try {
      const principal = parseFloat(balance);
      const rate = 0.05; // 5% annual rate
      const rawInterest = principal * rate * timePassedYears;
      const performanceFee = rawInterest * 0.10; // 10% performance fee
      const userInterest = rawInterest - performanceFee;

      return {
        success: true,
        principal,
        rate: rate * 100, // Convert to percentage for display
        timeYears: timePassedYears,
        rawInterest: rawInterest.toFixed(6),
        performanceFee: performanceFee.toFixed(6),
        userInterest: userInterest.toFixed(6),
        totalAfterInterest: (principal + userInterest).toFixed(6),
        feePercentage: 10
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get detailed interest accrual data for a user
   */
  async getInterestDetails(userAddress) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const principal = await this.contract.getBalance(userAddress);
      const lastCalculationTime = await this.contract.lastInterestCalculationTime(userAddress);

      // Calculate time passed
      const currentTime = Math.floor(Date.now() / 1000);
      const timePassed = lastCalculationTime > 0 ? currentTime - Number(lastCalculationTime) : 0;

      // Constants from contract (or approximate them)
      const interestRateBP = 500; // 5%
      const baseRateFactor = 10000;
      const secondsInYear = 31536000;

      const rawInterest = (principal * BigInt(interestRateBP) * BigInt(timePassed)) /
        (BigInt(baseRateFactor) * BigInt(secondsInYear));

      const performanceFeeBP = 1000; // 10%
      const bankCut = (rawInterest * BigInt(performanceFeeBP)) / BigInt(baseRateFactor);
      const userShare = rawInterest - bankCut;

      return {
        success: true,
        principal: ethers.formatEther(principal),
        rawPrincipal: principal,
        lastInteraction: Number(lastCalculationTime),
        timePassedDays: (timePassed / 86400).toFixed(2),
        netInterest: ethers.formatEther(userShare),
        rawNetInterest: userShare,
        projectedBalance: ethers.formatEther(principal + userShare)
      };
    } catch (error) {
      console.error('Failed to get interest details:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get overall bank statistics (Liquidity, Profit, Liabilities)
   */
  async getBankStatistics() {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const stats = await this.contract.getBankStatistics();
      return {
        success: true,
        totalLiquidity: ethers.formatEther(stats[0]),
        bankProfit: ethers.formatEther(stats[1]),
        userLiabilities: ethers.formatEther(stats[2]),
        raw: stats
      };
    } catch (error) {
      console.error('Failed to get bank statistics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Admin: Withdraw treasury fees
   */
  async withdrawFees() {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const tx = await this.contract.withdrawFees();
      const receipt = await tx.wait();
      return {
        success: true,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to withdraw fees:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const smartBankService = new SmartBankService();
export default smartBankService;

// Export class for custom instances
export { SmartBankService };
