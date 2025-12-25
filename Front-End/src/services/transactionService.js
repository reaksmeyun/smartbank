// Unified Transaction Service - Consolidates smartBankService and blockchainEventsService
import { ethers } from 'ethers';
import smartBankService from './smartBankService';
import blockchainEventsService from './blockchainEventsService';
import storageService from './storageService';

class TransactionService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.isInitialized = false;
    this.subscriptions = [];
  }

  /**
   * Initialize the unified transaction service
   * @param {Object} provider - Web3 provider
   * @param {Object} signer - Web3 signer
   * @param {Object} contract - SmartBank contract instance
   * @param {Object} network - Network information
   */
  async initialize(provider, signer, contract, network) {
    try {
      // Graceful handling of missing dependencies
      if (!provider || !signer || !contract) {
        console.warn('Transaction service initialization incomplete - missing dependencies');
        this.provider = provider;
        this.signer = signer;
        this.contract = contract;
        this.isInitialized = false;
        return false;
      }

      this.provider = provider;
      this.signer = signer;
      this.contract = contract;

      // Initialize services with error handling
      try {
        await blockchainEventsService.initialize(provider, contract);
      } catch (eventsError) {
        console.warn('Blockchain events service initialization failed:', eventsError);
      }

      try {
        smartBankService.initialize(provider, signer, network);
      } catch (smartBankError) {
        console.warn('SmartBank service initialization failed:', smartBankError);
      }

      this.isInitialized = true;
      console.log('Transaction service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize transaction service:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Get comprehensive transaction history for a user
   * Uses hybrid approach: persistent storage (primary) + blockchain events (sync)
   * @param {string} userAddress - User's wallet address
   * @param {Object} options - Options for filtering and limiting
   * @returns {Promise<Object>} Transaction history result
   */
  async getUserTransactionHistory(userAddress, options = {}) {
    try {
      // Graceful handling when service is not initialized
      if (!this.isInitialized) {
        console.warn('Transaction service not initialized, falling back to storage only');

        // Try to load from persistent storage as fallback
        try {
          const storedTransactions = storageService.getUserTransactions(userAddress);
          return {
            success: true,
            transactions: storedTransactions || [],
            dataSource: 'fallback_storage',
            syncStatus: 'service_not_initialized',
            totalCount: storedTransactions?.length || 0,
            hasMore: false
          };
        } catch (fallbackError) {
          console.warn('Fallback to storage failed:', fallbackError);
          return {
            success: false,
            error: 'Transaction service not available',
            transactions: [],
            dataSource: 'unavailable',
            syncStatus: 'unavailable',
            totalCount: 0
          };
        }
      }

      const {
        limit = 100,
        includeEvents = true,
        includeStoredHistory = true,
        sortBy = 'timestamp',
        sortOrder = 'desc',
        forceRefresh = false
      } = options;

      let transactions = [];
      let dataSource = 'none';
      let syncStatus = 'unknown';

      // Step 1: Load from persistent storage first (for immediate display)
      if (includeStoredHistory && !forceRefresh) {
        try {
          const storedTransactions = storageService.getUserTransactions(userAddress);

          if (storedTransactions && storedTransactions.length > 0) {
            transactions = storedTransactions;
            dataSource = 'persistent_storage';
            console.log(`Loaded ${storedTransactions.length} transactions from persistent storage`);
          } else {
            console.log('No transactions found in persistent storage');
          }
        } catch (storedError) {
          console.warn('Failed to load from persistent storage:', storedError);
        }
      }

      // Step 2: Fetch from blockchain and sync with storage (background sync)
      if (includeEvents) {
        try {
          console.log('Syncing with blockchain data...');

          // Enhanced node reset detection
          if (this.provider) {
            try {
              // Get current block number - bypass potential ethers cache by using direct send
              const currentBlockHex = await this.provider.send('eth_blockNumber', []);
              const currentBlock = parseInt(currentBlockHex, 16);

              if (transactions.length > 0) {
                const maxStoredBlock = Math.max(...transactions.map(tx => tx.blockNumber || 0));

                // If current block is significantly lower than stored blocks, it's a reset
                // ALSO: if current block is the very start (0-5) but we have much higher stored blocks
                if ((currentBlock < maxStoredBlock && currentBlock < 10) || (maxStoredBlock > 100 && currentBlock < 10)) {
                  console.warn(`Blockchain reset detected (Node: ${currentBlock}, Cache: ${maxStoredBlock}). Clearing stale local storage.`);
                  storageService.clearUserTransactions(userAddress);
                  transactions = [];
                  dataSource = 'reset_cleared';
                }
              }
            } catch (blockError) {
              console.warn('Failed to check current block number for reset detection:', blockError);
            }
          }

          const blockchainData = await blockchainEventsService.getUserTransactionHistory(userAddress, {
            limit: limit,
            fromBlock: 0,
            toBlock: 'latest'
          });

          if (blockchainData.length > 0) {
            // Convert blockchain events to unified format
            const blockchainTransactions = blockchainData.map(event => ({
              id: `blockchain-${event.transactionHash}-${event.logIndex}`,
              eventType: event.eventType,
              type: event.eventType,
              amount: parseFloat(event.amount),
              rawAmount: event.rawAmount,
              timestamp: event.timestamp,
              formattedTimestamp: event.formattedTimestamp,
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber,
              logIndex: event.logIndex,
              dataSource: 'blockchain_event',
              isNew: false
            }));

            // Merge with existing transactions, avoiding duplicates
            const mergedTransactions = this.mergeTransactions(transactions, blockchainTransactions);

            // Update persistent storage with merged data
            storageService.saveUserTransactions(userAddress, mergedTransactions);

            transactions = mergedTransactions;
            dataSource = transactions.length > 0 ? 'hybrid' : 'blockchain_events';
            syncStatus = 'synced';
            console.log(`Synced ${blockchainTransactions.length} blockchain transactions with storage`);
          } else {
            syncStatus = 'no_blockchain_data';
          }
        } catch (eventsError) {
          console.warn('[TransactionService] Failed to sync with blockchain:', eventsError);

          const errorMsg = eventsError.message?.toLowerCase() || '';
          if (errorMsg.includes('invalid block tag') ||
            errorMsg.includes('unknown block') ||
            errorMsg.includes('received invalid block')) {
            console.warn('[TransactionService] Invalid block tag detected! Force clearing stale storage.');
            storageService.clearUserTransactions(userAddress);
            transactions = [];
            dataSource = 'error_reset_cleared';
          }

          syncStatus = 'sync_failed';
        }
      }

      // Step 3: Also get contract storage history as additional source
      if (includeStoredHistory) {
        try {
          const historyResult = await smartBankService.getTransactionHistory(userAddress);
          if (historyResult.success && historyResult.history) {
            // Convert stored history to unified format
            const contractTxs = historyResult.history.map((tx, index) => {
              const eventType = tx.eventType || this.normalizeTransactionType(tx.txType);

              return {
                id: `contract-${eventType}-${tx.timestamp}-${index}`,
                eventType: eventType,
                type: eventType,
                amount: parseFloat(tx.amount),
                rawAmount: tx.rawAmount,
                timestamp: tx.timestamp,
                formattedTimestamp: tx.date,
                transactionHash: '', // Contract storage doesn't have transaction hash
                blockNumber: 0,
                logIndex: index,
                dataSource: 'contract_storage',
                isNew: false
              };
            });

            // Merge with existing transactions
            transactions = this.mergeTransactions(transactions, contractTxs);
            dataSource = 'multi_source';
            console.log(`Added ${contractTxs.length} transactions from contract storage`);
          }
        } catch (contractError) {
          console.warn('Failed to load contract storage history:', contractError);
        }
      }

      // Sort transactions
      transactions.sort((a, b) => {
        const multiplier = sortOrder === 'desc' ? -1 : 1;
        if (sortBy === 'timestamp') {
          return multiplier * (a.timestamp - b.timestamp);
        }
        return multiplier * (a.amount - b.amount);
      });

      // Apply limit
      const limitedTransactions = transactions.slice(0, limit);

      return {
        success: true,
        transactions: limitedTransactions,
        dataSource,
        syncStatus,
        totalCount: limitedTransactions.length,
        hasMore: transactions.length > limit
      };

    } catch (error) {
      console.error('Failed to get user transaction history:', error);
      return {
        success: false,
        error: error.message,
        transactions: [],
        dataSource: 'error',
        syncStatus: 'error',
        totalCount: 0
      };
    }
  }

  /**
   * Merge transactions from multiple sources, avoiding duplicates
   * @param {Array} existingTransactions - Existing transactions
   * @param {Array} newTransactions - New transactions to merge
   * @returns {Array} Merged transactions array
   */
  mergeTransactions(existingTransactions, newTransactions) {
    try {
      // Create a map to track unique transactions by ID or transactionHash
      const transactionMap = new Map();

      // Add existing transactions
      existingTransactions.forEach(tx => {
        const key = tx.transactionHash || tx.id;
        if (key) {
          transactionMap.set(key, tx);
        }
      });

      // Add new transactions, avoiding duplicates
      newTransactions.forEach(tx => {
        const key = tx.transactionHash || tx.id;
        if (key && !transactionMap.has(key)) {
          transactionMap.set(key, tx);
        }
      });

      // Convert back to array and sort by timestamp
      const merged = Array.from(transactionMap.values());
      merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      console.log(`Merged ${existingTransactions.length} + ${newTransactions.length} = ${merged.length} unique transactions`);
      return merged;
    } catch (error) {
      console.error('Failed to merge transactions:', error);
      // Return all transactions if merge fails
      return [...existingTransactions, ...newTransactions];
    }
  }

  /**
   * Get recent transactions for dashboard display
   * @param {string} userAddress - User's wallet address
   * @param {number} limit - Number of transactions to fetch
   * @returns {Promise<Object>} Recent transactions result
   */
  async getRecentTransactions(userAddress, limit = 10) {
    const result = await this.getUserTransactionHistory(userAddress, { limit });
    return {
      success: result.success,
      transactions: result.transactions,
      dataSource: result.dataSource,
      error: result.error
    };
  }

  /**
   * Get transaction statistics for a user
   * @param {string} userAddress - User's wallet address
   * @returns {Promise<Object>} Transaction statistics
   */
  async getUserTransactionStats(userAddress) {
    try {
      const historyResult = await this.getUserTransactionHistory(userAddress, { limit: 1000 });

      if (!historyResult.success) {
        throw new Error('Failed to get transaction history for stats');
      }

      const transactions = historyResult.transactions;

      const stats = {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalInterestEarned: 0,
        totalTransactions: transactions.length,
        depositCount: 0,
        withdrawalCount: 0,
        interestCount: 0,
        dataSource: historyResult.dataSource
      };

      transactions.forEach(tx => {
        const type = tx.eventType || tx.type || '';
        if (type === 'Deposit' || type === 'Deposited') {
          stats.totalDeposits += tx.amount;
          stats.depositCount++;
        } else if (type === 'Withdraw' || type === 'Withdrawn') {
          stats.totalWithdrawals += tx.amount;
          stats.withdrawalCount++;
        } else if (type === 'InterestPaid') {
          stats.totalInterestEarned += tx.amount;
          stats.interestCount++;
        }
      });

      return {
        success: true,
        stats,
        lastUpdated: Date.now()
      };

    } catch (error) {
      console.error('Failed to get user transaction stats:', error);
      return {
        success: false,
        error: error.message,
        stats: {
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalInterestEarned: 0,
          totalTransactions: 0,
          depositCount: 0,
          withdrawalCount: 0,
          interestCount: 0,
          dataSource: 'error'
        }
      };
    }
  }

  /**
   * Subscribe to real-time transaction events
   * @param {string} userAddress - User's wallet address
   * @param {Function} callback - Callback for new events
   * @returns {Object} Subscription object
   */
  subscribeToUserEvents(userAddress, callback) {
    try {
      if (!this.isInitialized) {
        throw new Error('Transaction service not initialized');
      }

      console.log(`Setting up real-time subscription for ${userAddress}`);

      // Subscribe to events through blockchainEventsService
      const subscription = blockchainEventsService.subscribeToUserEvents(userAddress, (newEvent) => {
        try {
          console.log('Real-time event received:', newEvent);

          // Convert event to unified format
          const unifiedEvent = {
            id: `realtime-${newEvent.transactionHash}-${newEvent.logIndex}`,
            eventType: newEvent.eventType,
            type: newEvent.eventType,
            amount: parseFloat(newEvent.amount),
            rawAmount: newEvent.rawAmount,
            timestamp: newEvent.timestamp,
            formattedTimestamp: newEvent.formattedTimestamp,
            transactionHash: newEvent.transactionHash,
            blockNumber: newEvent.blockNumber,
            logIndex: newEvent.logIndex,
            dataSource: 'realtime',
            isNew: true
          };

          // Save to persistent storage immediately
          try {
            const existingTransactions = storageService.getUserTransactions(userAddress);
            const updatedTransactions = [unifiedEvent, ...existingTransactions];
            storageService.saveUserTransactions(userAddress, updatedTransactions);
            console.log('Saved real-time event to persistent storage');
          } catch (storageError) {
            console.warn('Failed to save to persistent storage:', storageError);
          }

          // Call the callback with the unified event
          callback(unifiedEvent);
        } catch (eventError) {
          console.error('Error processing real-time event:', eventError);
        }
      });

      return {
        unsubscribe: () => {
          console.log('Unsubscribing from real-time events');
          if (subscription) {
            subscription.unsubscribe();
          }
        }
      };

    } catch (error) {
      console.error('Failed to subscribe to user events:', error);
      return null;
    }
  }

  /**
   * Subscribe to SmartBank contract events through smartBankService
   * @param {string} userAddress - User's wallet address
   * @param {Object} callbacks - Event callbacks
   * @returns {Function} Cleanup function
   */
  subscribeToContractEvents(userAddress, callbacks = {}) {
    try {
      if (!this.contract) {
        throw new Error('Contract not available');
      }

      const cleanup = smartBankService.setupEventListeners(userAddress, {
        onDeposit: (event) => callbacks.onDeposit?.(this.normalizeEventData(event, 'Deposit')),
        onWithdraw: (event) => callbacks.onWithdraw?.(this.normalizeEventData(event, 'Withdraw')),
        onInterest: (event) => callbacks.onInterest?.(this.normalizeEventData(event, 'InterestPaid'))
      });

      this.subscriptions.push(cleanup);
      return cleanup;

    } catch (error) {
      console.error('Failed to subscribe to contract events:', error);
      return () => { };
    }
  }

  /**
   * Normalize transaction type names
   * @param {string} txType - Raw transaction type
   * @returns {string} Normalized transaction type
   */
  normalizeTransactionType(txType) {
    const typeMap = {
      'Deposit': 'Deposit',
      'Withdraw': 'Withdraw',
      'Interest Earned': 'InterestPaid',
      'InterestPaid': 'InterestPaid'
    };
    return typeMap[txType] || txType;
  }

  /**
   * Normalize event data to unified format
   * @param {Object} event - Raw event data
   * @param {string} eventType - Event type
   * @returns {Object} Normalized event data
   */
  normalizeEventData(event, eventType) {
    return {
      id: `normalized-${eventType}-${event.timestamp}-${event.amount}`,
      eventType: this.normalizeTransactionType(eventType),
      type: eventType,
      amount: parseFloat(event.amount),
      rawAmount: event.rawAmount || event.amount,
      timestamp: event.timestamp,
      formattedTimestamp: event.date || new Date(event.timestamp * 1000).toLocaleString(),
      transactionHash: event.transactionHash || '',
      blockNumber: event.blockNumber || 0,
      logIndex: event.logIndex || 0,
      dataSource: 'contract_event',
      isNew: true
    };
  }

  /**
   * Check if service is ready
   * @returns {boolean} Service readiness status
   */
  isServiceReady() {
    return this.isInitialized && this.provider && this.contract;
  }

  /**
   * Clean up all subscriptions and resources
   */
  cleanup() {
    this.subscriptions.forEach(cleanup => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    });
    this.subscriptions = [];

    blockchainEventsService.cleanup();
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
const transactionService = new TransactionService();
export default transactionService;

// Export class for custom instances
export { TransactionService };

