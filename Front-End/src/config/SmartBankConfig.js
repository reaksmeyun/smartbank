// SmartBank Contract ABI
import { ethers } from 'ethers';
export const SmartBankABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Deposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "InterestApplied",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Withdrawn",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BASE_RATE_FACTOR",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "INTEREST_RATE_BP",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SECONDS_IN_YEAR",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "WETH",
    "outputs": [
      {
        "internalType": "contract IWETH",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "aavePool",
    "outputs": [
      {
        "internalType": "contract IPool",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBankProfit",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "lastInterestCalculationTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdrawBankProfit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Contract addresses - Updated after successful deployment
export const CONTRACT_ADDRESSES = {
  localhost: '0x4d8B3EDE20D9cE6e5655C8ba542be005570f4014',
  mainnet: '0x0000000000000000000000000000000000000000'
};

// Network configurations
export const NETWORK_CONFIGS = {
  localhost: {
    chainId: 1337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    explorer: null
  }
};

// Contract constants
export const CONTRACT_CONSTANTS = {
  MIN_DEPOSIT_AMOUNT: ethers.parseEther('0.001'), // 0.001 ETH
  INTEREST_RATE_BP: 500, // 5%
  SECONDS_IN_YEAR: 31536000,
  BASE_RATE_FACTOR: 10000
};

// Transaction types
export const TX_TYPES = {
  DEPOSIT: 'Deposited',
  WITHDRAW: 'Withdrawn',
  INTEREST: 'InterestApplied'
};

// Utility functions for contract interactions
export const SmartBankUtils = {
  /**
   * Format transaction type for display
   */
  formatTransactionType: (txType) => {
    const typeMap = {
      'Deposit': 'Deposit',
      'Deposited': 'Deposit',
      'Withdraw': 'Withdrawal',
      'Withdrawn': 'Withdrawal',
      'InterestPaid': 'Interest Payment'
    };
    return typeMap[txType] || txType;
  },

  /**
   * Calculate time passed for interest calculation
   */
  calculateTimePassed: (lastTime, currentTime) => {
    return Math.floor((currentTime - lastTime) / 31536000); // Years
  },

  /**
   * Format balance for display with limited decimals
   */
  formatBalance: (balance) => {
    return ethers.formatEther(balance);
  },

  /**
   * Format balance for clean display in UI (limited decimals)
   */
  formatDisplayBalance: (balance, decimals = 4) => {
    try {
      const formatted = ethers.formatEther(balance);
      const parsed = parseFloat(formatted);
      if (isNaN(parsed)) return '0.00';
      return parsed.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: decimals
      });
    } catch {
      return '0.00';
    }
  },

  /**
   * Format timestamp to readable date
   */
  formatTimestamp: (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  },

  /**
   * Format address for display (e.g. 0x1234...5678)
   */
  formatAddress: (address, length = 4) => {
    if (!address) return '';
    if (address.length <= (length * 2) + 2) return address;
    return `${address.substring(0, length + 2)}...${address.substring(address.length - length)}`;
  },

  /**
   * Validate deposit amount
   */
  isValidDepositAmount: (amount) => {
    try {
      const parsedAmount = ethers.parseEther(amount.toString());
      return parsedAmount >= CONTRACT_CONSTANTS.MIN_DEPOSIT_AMOUNT;
    } catch {
      return false;
    }
  }
};
