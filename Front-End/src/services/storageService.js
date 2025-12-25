// Persistent Storage Service for Transaction History
// Handles local storage operations for transaction data persistence

class StorageService {
  constructor() {
    this.storageKey = 'smartbank_transactions';
    this.userKey = 'smartbank_user';
    this.version = '1.0.0';
  }

  /**
   * Save transaction history for a specific user
   * @param {string} userAddress - User's wallet address
   * @param {Array} transactions - Array of transaction objects
   * @returns {boolean} Success status
   */
  saveUserTransactions(userAddress, transactions) {
    try {
      if (!userAddress || !Array.isArray(transactions)) {
        console.warn('Invalid parameters for saveUserTransactions');
        return false;
      }

      const existingData = this.getAllStoredTransactions();
      const userKey = userAddress.toLowerCase();
      
      // Update or create user transaction data
      existingData[userKey] = {
        transactions: transactions,
        lastUpdated: Date.now(),
        version: this.version
      };

      localStorage.setItem(this.storageKey, JSON.stringify(existingData));
      console.log(`Saved ${transactions.length} transactions for ${userAddress}`);
      return true;
    } catch (error) {
      console.error('Failed to save user transactions:', error);
      return false;
    }
  }

  /**
   * Get transaction history for a specific user
   * @param {string} userAddress - User's wallet address
   * @returns {Array} Array of transaction objects
   */
  getUserTransactions(userAddress) {
    try {
      if (!userAddress) {
        console.warn('No user address provided for getUserTransactions');
        return [];
      }

      const existingData = this.getAllStoredTransactions();
      const userKey = userAddress.toLowerCase();
      const userData = existingData[userKey];

      if (!userData || !userData.transactions) {
        console.log(`No stored transactions found for ${userAddress}`);
        return [];
      }

      // Check if data is stale (older than 1 hour)
      const isStale = Date.now() - userData.lastUpdated > 3600000; // 1 hour
      if (isStale) {
        console.log(`Transaction data for ${userAddress} is stale, consider refreshing`);
      }

      return userData.transactions || [];
    } catch (error) {
      console.error('Failed to get user transactions:', error);
      return [];
    }
  }

  /**
   * Add a single transaction to user's history
   * @param {string} userAddress - User's wallet address
   * @param {Object} transaction - Transaction object to add
   * @returns {boolean} Success status
   */
  addTransaction(userAddress, transaction) {
    try {
      if (!userAddress || !transaction) {
        console.warn('Invalid parameters for addTransaction');
        return false;
      }

      const existingTransactions = this.getUserTransactions(userAddress);
      
      // Check for duplicates (same transaction hash)
      const isDuplicate = existingTransactions.some(existingTx => 
        existingTx.transactionHash && 
        transaction.transactionHash && 
        existingTx.transactionHash === transaction.transactionHash
      );

      if (isDuplicate) {
        console.log('Transaction already exists, skipping duplicate');
        return true;
      }

      // Add new transaction to the beginning of the array
      const updatedTransactions = [transaction, ...existingTransactions];
      
      return this.saveUserTransactions(userAddress, updatedTransactions);
    } catch (error) {
      console.error('Failed to add transaction:', error);
      return false;
    }
  }

  /**
   * Update an existing transaction
   * @param {string} userAddress - User's wallet address
   * @param {string} transactionId - ID of transaction to update
   * @param {Object} updates - Object containing updates
   * @returns {boolean} Success status
   */
  updateTransaction(userAddress, transactionId, updates) {
    try {
      const transactions = this.getUserTransactions(userAddress);
      const transactionIndex = transactions.findIndex(tx => 
        tx.id === transactionId || tx.transactionHash === transactionId
      );

      if (transactionIndex === -1) {
        console.warn(`Transaction not found for update: ${transactionId}`);
        return false;
      }

      transactions[transactionIndex] = {
        ...transactions[transactionIndex],
        ...updates,
        lastUpdated: Date.now()
      };

      return this.saveUserTransactions(userAddress, transactions);
    } catch (error) {
      console.error('Failed to update transaction:', error);
      return false;
    }
  }

  /**
   * Get all stored transaction data
   * @returns {Object} All stored transaction data
   */
  getAllStoredTransactions() {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      if (!storedData) {
        return {};
      }

      const parsedData = JSON.parse(storedData);
      return parsedData && typeof parsedData === 'object' ? parsedData : {};
    } catch (error) {
      console.error('Failed to parse stored transactions:', error);
      return {};
    }
  }

  /**
   * Clear all stored transaction data
   * @returns {boolean} Success status
   */
  clearAllTransactions() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('All transaction data cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear transaction data:', error);
      return false;
    }
  }

  /**
   * Clear transactions for a specific user
   * @param {string} userAddress - User's wallet address
   * @returns {boolean} Success status
   */
  clearUserTransactions(userAddress) {
    try {
      const allData = this.getAllStoredTransactions();
      const userKey = userAddress.toLowerCase();
      
      delete allData[userKey];
      
      localStorage.setItem(this.storageKey, JSON.stringify(allData));
      console.log(`Cleared transactions for ${userAddress}`);
      return true;
    } catch (error) {
      console.error('Failed to clear user transactions:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage statistics
   */
  getStorageStats() {
    try {
      const allData = this.getAllStoredTransactions();
      const stats = {
        totalUsers: Object.keys(allData).length,
        totalTransactions: 0,
        storageSize: 0,
        oldestTransaction: null,
        newestTransaction: null
      };

      Object.values(allData).forEach(userData => {
        if (userData.transactions && Array.isArray(userData.transactions)) {
          stats.totalTransactions += userData.transactions.length;
          
          userData.transactions.forEach(tx => {
            if (tx.timestamp) {
              if (!stats.oldestTransaction || tx.timestamp < stats.oldestTransaction) {
                stats.oldestTransaction = tx.timestamp;
              }
              if (!stats.newestTransaction || tx.timestamp > stats.newestTransaction) {
                stats.newestTransaction = tx.timestamp;
              }
            }
          });
        }
      });

      // Calculate approximate storage size
      const serialized = JSON.stringify(allData);
      stats.storageSize = new Blob([serialized]).size;

      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalUsers: 0,
        totalTransactions: 0,
        storageSize: 0,
        oldestTransaction: null,
        newestTransaction: null
      };
    }
  }

  /**
   * Export user transaction data as JSON
   * @param {string} userAddress - User's wallet address
   * @returns {string} JSON string of transaction data
   */
  exportUserTransactions(userAddress) {
    try {
      const transactions = this.getUserTransactions(userAddress);
      const exportData = {
        userAddress,
        exportDate: new Date().toISOString(),
        version: this.version,
        transactions
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export transactions:', error);
      return null;
    }
  }

  /**
   * Import transaction data from JSON
   * @param {string} userAddress - User's wallet address
   * @param {string} jsonData - JSON string containing transaction data
   * @returns {boolean} Success status
   */
  importUserTransactions(userAddress, jsonData) {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.transactions || !Array.isArray(importData.transactions)) {
        throw new Error('Invalid transaction data format');
      }

      return this.saveUserTransactions(userAddress, importData.transactions);
    } catch (error) {
      console.error('Failed to import transactions:', error);
      return false;
    }
  }

  /**
   * Check if storage is available
   * @returns {boolean} Storage availability status
   */
  isStorageAvailable() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      console.warn('Local storage not available:', error);
      return false;
    }
  }
}

// Export singleton instance
const storageService = new StorageService();
export default storageService;

// Export class for custom instances
export { StorageService };
