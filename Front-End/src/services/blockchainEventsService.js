// Blockchain Events Service - Read and filter SmartBank contract events
import { ethers } from 'ethers';
import { SmartBankABI } from '../config/SmartBankConfig';

class BlockchainEventsService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the service with Web3 provider and contract
   * @param {Object} provider - Web3 provider
   * @param {Object} contract - SmartBank contract instance
   * @returns {Promise<boolean>} Success status
   */
  async initialize(provider, contract) {
    try {
      if (!provider || !contract) {
        throw new Error('Provider and contract are required');
      }

      this.provider = provider;
      this.contract = contract;
      this.isInitialized = true;

      console.log('Blockchain events service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize blockchain events service:', error);
      return false;
    }
  }

  /**
   * Get contract instance
   * @returns {Object} Contract instance
   */
  getContract() {
    return this.contract;
  }

  /**
   * Get transaction history for a specific user by filtering events
   * @param {string} userAddress - User's wallet address
   * @param {Object} options - Filtering options
   * @returns {Promise<Array>} Array of transaction events
   */
  async getUserTransactionHistory(userAddress, options = {}) {
    try {
      if (!this.isInitialized || !this.contract) {
        throw new Error('Service not initialized');
      }

      if (!userAddress) {
        throw new Error('User address is required');
      }

      const {
        fromBlock = 0,
        toBlock = 'latest',
        eventTypes = ['Deposited', 'Withdrawn', 'InterestPaid'],
        limit = 100
      } = options;

      console.log(`Fetching transaction history for ${userAddress} from block ${fromBlock} to ${toBlock}`);
      const allEvents = [];

      // Fetch events for each type using ethers v6 syntax
      for (const eventType of eventTypes) {
        try {
          console.log(`Fetching ${eventType} events for ${userAddress}`);
          const filter = this.contract.filters[eventType](userAddress);
          const events = await this.contract.queryFilter(filter, fromBlock, toBlock);

          console.log(`Found ${events.length} ${eventType} events`);

          // Parse events and add metadata - wait for block timestamps
          const parsedEventsPromises = events.map(async (event) => {
            const parsedEvent = await this.parseEvent(event);
            if (parsedEvent) {
              // Normalize names: Deposited -> Deposit, Withdrawn -> Withdraw
              const normalizedName = eventType === 'Deposited' ? 'Deposit' :
                eventType === 'Withdrawn' ? 'Withdraw' : eventType;

              return {
                ...parsedEvent,
                eventType: normalizedName,
                type: normalizedName,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                logIndex: event.logIndex,
                dataSource: 'blockchain_event'
              };
            }
            return null;
          });

          const resolvedEvents = (await Promise.all(parsedEventsPromises)).filter(Boolean);
          console.log(`Successfully resolved and parsed ${resolvedEvents.length} ${eventType} events`);
          allEvents.push(...resolvedEvents);
        } catch (eventError) {
          console.warn(`Failed to fetch ${eventType} events:`, eventError);
        }
      }

      // Sort by timestamp (most recent first)
      allEvents.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return b.timestamp - a.timestamp;
      });

      // Apply limit
      const limitedEvents = allEvents.slice(0, limit);
      console.log(`Returning ${limitedEvents.length} total events out of ${allEvents.length} found`);

      return limitedEvents;
    } catch (error) {
      console.error('Failed to get user transaction history:', error);
      return [];
    }
  }

  /**
   * Get recent transactions for dashboard display
   * @param {string} userAddress - User's wallet address
   * @param {number} limit - Number of transactions to fetch
   * @returns {Promise<Array>} Recent transaction events
   */
  async getRecentTransactions(userAddress, limit = 10) {
    try {
      return await this.getUserTransactionHistory(userAddress, {
        limit,
        eventTypes: ['Deposited', 'Withdrawn', 'InterestPaid']
      });
    } catch (error) {
      console.error('Failed to get recent transactions:', error);
      return [];
    }
  }

  /**
   * Get transaction statistics for a user
   * @param {string} userAddress - User's wallet address
   * @returns {Promise<Object>} Transaction statistics
   */
  async getUserTransactionStats(userAddress) {
    try {
      const transactions = await this.getUserTransactionHistory(userAddress, {
        limit: 1000 // Get more data for stats
      });

      const stats = {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalInterestEarned: 0,
        totalTransactions: transactions.length,
        depositCount: 0,
        withdrawalCount: 0,
        interestCount: 0
      };

      transactions.forEach(tx => {
        const type = tx.eventType || tx.type;
        switch (type) {
          case 'Deposited':
          case 'Deposit':
            stats.totalDeposits += Number(tx.amount);
            stats.depositCount++;
            break;
          case 'Withdrawn':
          case 'Withdraw':
            stats.totalWithdrawals += Number(tx.amount);
            stats.withdrawalCount++;
            break;
          case 'InterestPaid':
            stats.totalInterestEarned += Number(tx.amount);
            stats.interestCount++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Failed to get user transaction stats:', error);
      return {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalInterestEarned: 0,
        totalTransactions: 0,
        depositCount: 0,
        withdrawalCount: 0,
        interestCount: 0
      };
    }
  }

  /**
   * Subscribe to new events for real-time updates
   * @param {string} userAddress - User's wallet address
   * @param {Function} callback - Callback function for new events
   * @returns {Object} Subscription object
   */
  subscribeToUserEvents(userAddress, callback) {
    try {
      if (!this.isInitialized || !this.contract) {
        throw new Error('Service not initialized');
      }

      if (!userAddress || typeof callback !== 'function') {
        throw new Error('Valid user address and callback function required');
      }

      console.log(`Setting up event subscriptions for user: ${userAddress}`);

      const subscriptions = [];

      // Subscribe to Deposit events
      const depositFilter = this.contract.filters.Deposited(userAddress);
      const depositSubscription = this.contract.on(depositFilter, (event) => {
        try {
          console.log('Deposit event received:', event);

          this.parseEvent(event).then(parsedEvent => {
            if (parsedEvent) {
              callback({
                ...parsedEvent,
                eventType: 'Deposit',
                type: 'Deposit',
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                logIndex: event.logIndex,
                dataSource: 'realtime_event',
                isNew: true
              });
            }
          });
        } catch (eventError) {
          console.error('Error processing deposit event:', eventError);
        }
      });

      if (depositSubscription && typeof depositSubscription.removeAllListeners === 'function') {
        subscriptions.push(depositSubscription);
      }

      // Subscribe to Withdraw events
      const withdrawFilter = this.contract.filters.Withdrawn(userAddress);
      const withdrawSubscription = this.contract.on(withdrawFilter, (event) => {
        try {
          console.log('Withdraw event received:', event);

          this.parseEvent(event).then(parsedEvent => {
            if (parsedEvent) {
              callback({
                ...parsedEvent,
                eventType: 'Withdraw',
                type: 'Withdraw',
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                logIndex: event.logIndex,
                dataSource: 'realtime_event',
                isNew: true
              });
            }
          });
        } catch (eventError) {
          console.error('Error processing withdraw event:', eventError);
        }
      });

      if (withdrawSubscription && typeof withdrawSubscription.removeAllListeners === 'function') {
        subscriptions.push(withdrawSubscription);
      }

      // Subscribe to InterestPaid events
      const interestFilter = this.contract.filters.InterestPaid(userAddress);
      const interestSubscription = this.contract.on(interestFilter, (event) => {
        try {
          console.log('InterestPaid event received:', event);

          this.parseEvent(event).then(parsedEvent => {
            if (parsedEvent) {
              callback({
                ...parsedEvent,
                eventType: 'InterestPaid',
                type: 'InterestPaid',
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                logIndex: event.logIndex,
                dataSource: 'realtime_event',
                isNew: true
              });
            }
          });
        } catch (eventError) {
          console.error('Error processing interest event:', eventError);
        }
      });

      if (interestSubscription && typeof interestSubscription.removeAllListeners === 'function') {
        subscriptions.push(interestSubscription);
      }

      // Return unsubscribe function
      return {
        unsubscribe: () => {
          console.log('Unsubscribing from event subscriptions');
          subscriptions.forEach((sub, index) => {
            try {
              if (sub && typeof sub.removeAllListeners === 'function') {
                sub.removeAllListeners();
              } else if (this.contract) {
                // Fallback: remove all listeners for this filter
                this.contract.removeAllListeners();
              }
            } catch (unsubscribeError) {
              console.warn(`Failed to unsubscribe subscription ${index}:`, unsubscribeError);
            }
          });
          subscriptions.length = 0;
        }
      };
    } catch (error) {
      console.error('Failed to subscribe to user events:', error);
      return null;
    }
  }

  /**
   * Parse event data into standardized format
   * @param {Object} event - Raw event object
   * @returns {Object} Parsed event data
   */
  async parseEvent(event) {
    try {
      console.log('Parsing event:', event);

      // Handle different event formats from MetaMask and direct calls
      let args, eventName;

      if (event.args) {
        args = event.args;
      } else if (event.fragment && event.fragment.inputs) {
        // Handle events from queryFilter
        args = event.args;
      } else {
        console.warn('Event does not have args:', event);
        return null;
      }

      // Ensure we have valid args
      if (!args) {
        console.warn('Invalid event args:', args);
        return null;
      }

      // Determine event type from multiple sources
      if (event.fragment && event.fragment.name) {
        eventName = event.fragment.name;
      } else if (event.event) {
        eventName = event.event;
      } else {
        eventName = 'Unknown';
      }

      // Extract values using multiple fallback methods for MetaMask compatibility
      const user = args.user || args[0] || event.user || this.extractFromIndexedArgs(event, 'user');
      const amount = args.amount || args[1] || event.amount || this.extractFromIndexedArgs(event, 'amount');

      // The contract events (Deposited, Withdrawn) do NOT have a timestamp parameter.
      // We must fetch it from the block.
      let timestampValue = args.timestamp || args[2] || event.timestamp || this.extractFromIndexedArgs(event, 'timestamp');

      if (!timestampValue && event.getBlock) {
        try {
          const block = await event.getBlock();
          timestampValue = block.timestamp;
        } catch (e) {
          console.warn('Failed to fetch block timestamp:', e);
          timestampValue = Math.floor(Date.now() / 1000);
        }
      } else if (!timestampValue) {
        // Fallback if getBlock is not available (e.g. some provider configurations)
        timestampValue = Math.floor(Date.now() / 1000);
      }

      // Validate critical fields
      if (!user || amount === undefined) {
        console.warn('Missing critical event fields:', { user, amount, args, event });
        return null;
      }

      // Convert values to appropriate types
      let userAddress = user;
      let amountWei = amount;

      // Handle BigInt amounts (common in ethers v6)
      if (typeof amountWei === 'bigint') {
        amountWei = amountWei.toString();
      }

      // Convert timestamp to number
      if (typeof timestampValue === 'bigint') {
        timestampValue = Number(timestampValue);
      }

      const formattedTimestamp = new Date(Number(timestampValue) * 1000).toLocaleString();

      // Generate unique ID for the event
      const eventId = `event-${event.transactionHash || 'unknown'}-${event.logIndex || 0}`;

      const parsedEvent = {
        id: eventId,
        user: userAddress.toString().toLowerCase(),
        amount: ethers.formatEther(amountWei),
        rawAmount: amountWei.toString(),
        timestamp: Number(timestampValue),
        formattedAmount: this.formatAmount(amountWei),
        formattedTimestamp: formattedTimestamp,
        eventType: eventName,
        type: eventName,
        blockNumber: event.blockNumber || 0,
        transactionHash: event.transactionHash || '',
        logIndex: event.logIndex || 0,
        dataSource: 'blockchain_event'
      };

      console.log('Successfully parsed event:', parsedEvent);
      return parsedEvent;

    } catch (error) {
      console.error('Failed to parse event:', error, 'Event:', event);
      return null;
    }
  }

  /**
   * Extract parameter from indexed event arguments
   * @param {Object} event - Event object
   * @param {string} paramName - Parameter name to extract
   * @returns {*} Parameter value
   */
  extractFromIndexedArgs(event, paramName) {
    try {
      if (event.args && Array.isArray(event.args)) {
        // Try to match by parameter index based on event signature
        const paramMap = {
          'user': 0,
          'amount': 1,
          'timestamp': 2
        };
        const index = paramMap[paramName];
        if (index !== undefined && event.args[index] !== undefined) {
          return event.args[index];
        }
      }
      return null;
    } catch (error) {
      console.warn('Failed to extract from indexed args:', error);
      return null;
    }
  }

  /**
   * Get event type from event context (filters used)
   * @param {Object} event - Raw event object
   * @returns {string} Event type
   */
  getEventTypeFromContext(event) {
    // Try to determine from event name or args structure
    try {
      // Check if we can determine type from event log
      if (event.fragment && event.fragment.name) {
        return event.fragment.name;
      }

      // Fallback: use transaction type inference
      return 'Unknown';
    } catch (error) {
      console.warn('Failed to determine event type:', error);
      return 'Unknown';
    }
  }

  /**
   * Get event type from event args
   * @param {Object} args - Event arguments
   * @returns {string} Event type
   */
  getEventType(args) {
    if (args.user !== undefined && args.amount !== undefined && args.timestamp !== undefined) {
      // We need to determine the type based on context
      // This is a fallback - in practice, the calling code should specify the type
      return 'Unknown';
    }
    return 'Unknown';
  }

  /**
   * Format amount for display
   * @param {bigint} amount - Amount in wei
   * @returns {string} Formatted amount
   */
  formatAmount(amount) {
    try {
      const ethAmount = ethers.formatEther(amount);
      return `${Number(ethAmount).toFixed(4)} ETH`;
    } catch (error) {
      return '0 ETH';
    }
  }

  /**
   * Check if service is properly initialized
   * @returns {boolean} Initialization status
   */
  isServiceReady() {
    return this.isInitialized && this.provider && this.contract;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.provider = null;
    this.contract = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export default new BlockchainEventsService();
