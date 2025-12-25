// Address Utilities - Centralized address handling for MetaMask compatibility
import { ethers } from 'ethers';

/**
 * Normalize address to lowercase format for consistent comparisons
 * @param {string} address - Ethereum address to normalize
 * @returns {string} Normalized address in lowercase
 */
export const normalizeAddress = (address) => {
  if (!address) return null;
  if (typeof address !== 'string') return null;
  
  try {
    // Remove any whitespace and convert to lowercase
    const cleanAddress = address.trim().toLowerCase();
    
    // Validate it's a proper Ethereum address
    if (!ethers.isAddress(cleanAddress)) {
      throw new Error(`Invalid address format: ${address}`);
    }
    
    return cleanAddress;
  } catch (error) {
    console.error('Address normalization failed:', error);
    return null;
  }
};

/**
 * Compare two addresses for equality
 * @param {string} address1 - First address to compare
 * @param {string} address2 - Second address to compare
 * @returns {boolean} True if addresses match
 */
export const compareAddresses = (address1, address2) => {
  const normalized1 = normalizeAddress(address1);
  const normalized2 = normalizeAddress(address2);
  
  return normalized1 !== null && normalized2 !== null && normalized1 === normalized2;
};

/**
 * Validate if address is a valid Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid address
 */
export const isValidAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  
  try {
    // Check if address is valid using ethers v6
    return ethers.isAddress(address.trim());
  } catch {
    return false;
  }
};

/**
 * Format address for display (shortened version)
 * @param {string} address - Address to format
 * @param {number} startLength - Number of characters to show at start (default: 6)
 * @param {number} endLength - Number of characters to show at end (default: 4)
 * @returns {string} Formatted address
 */
export const formatAddress = (address, startLength = 6, endLength = 4) => {
  const normalized = normalizeAddress(address);
  if (!normalized) return '';
  
  if (normalized.length <= startLength + endLength + 2) {
    return normalized;
  }
  
  return `${normalized.slice(0, startLength)}...${normalized.slice(-endLength)}`;
};

/**
 * Get checksummed address format
 * @param {string} address - Address to checksum
 * @returns {string} Checksummed address
 */
export const getChecksummedAddress = (address) => {
  const normalized = normalizeAddress(address);
  if (!normalized) return null;
  
  try {
    return ethers.getAddress(normalized);
  } catch (error) {
    console.error('Failed to get checksummed address:', error);
    return normalized;
  }
};

/**
 * Validate address format and throw error if invalid
 * @param {string} address - Address to validate
 * @param {string} context - Context for error message
 * @throws {Error} If address is invalid
 */
export const validateAddressOrThrow = (address, context = 'Address validation') => {
  const normalized = normalizeAddress(address);
  
  if (!normalized) {
    throw new Error(`${context}: Invalid or null address provided`);
  }
  
  return normalized;
};

/**
 * Create address comparison result object
 * @param {string} expected - Expected address
 * @param {string} actual - Actual address
 * @returns {Object} Comparison result
 */
export const compareAddressResult = (expected, actual) => {
  const normalizedExpected = normalizeAddress(expected);
  const normalizedActual = normalizeAddress(actual);
  
  return {
    expected: normalizedExpected,
    actual: normalizedActual,
    matches: normalizedExpected !== null && normalizedActual !== null && normalizedExpected === normalizedActual,
    isValid: normalizedExpected !== null && normalizedActual !== null,
    error: !normalizedExpected ? 'Invalid expected address' : 
           !normalizedActual ? 'Invalid actual address' : null
  };
};

/**
 * Extract address from signature with validation
 * @param {string} signature - Signature to extract address from
 * @param {string} message - Message that was signed
 * @param {string} expectedAddress - Expected address to validate against
 * @returns {Object} Extraction result
 */
export const extractAndValidateAddress = (signature, message, expectedAddress) => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    const comparison = compareAddressResult(expectedAddress, recoveredAddress);
    
    return {
      success: true,
      recoveredAddress,
      normalizedExpected: comparison.expected,
      normalizedActual: comparison.actual,
      matches: comparison.matches,
      isValid: comparison.isValid,
      error: comparison.error
    };
  } catch (error) {
    return {
      success: false,
      recoveredAddress: null,
      normalizedExpected: normalizeAddress(expectedAddress),
      normalizedActual: null,
      matches: false,
      isValid: false,
      error: error.message
    };
  }
};

// Export default object with all utilities
const addressUtils = {
  normalizeAddress,
  compareAddresses,
  isValidAddress,
  formatAddress,
  getChecksummedAddress,
  validateAddressOrThrow,
  compareAddressResult,
  extractAndValidateAddress
};

export default addressUtils;
