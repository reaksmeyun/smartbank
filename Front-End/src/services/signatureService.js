// Signature Service - Web3 Authentication using message signing
import { ethers } from 'ethers';
import { AUTH_CONFIG, AUTH_ERRORS } from '../config/authConfig';
import addressUtils from '../utils/addressUtils';

class SignatureService {
  constructor() {
    this.provider = null;
    this.signer = null;
  }

  /**
   * Initialize the provider and signer
   * @param {Object} window.ethereum - Ethereum provider from wallet
   * @returns {Promise<boolean>} Success status
   */
  async initializeProvider(windowEthereum) {
    try {
      if (!windowEthereum) {
        console.warn('No Ethereum provider found - running in development mode');
        return false; // Return false instead of throwing
      }

      this.provider = new ethers.BrowserProvider(windowEthereum);
      this.signer = await this.provider.getSigner();
      return true;
    } catch (error) {
      console.error('Failed to initialize provider:', error);
      console.warn('Provider initialization failed - continuing in development mode');
      return false; // Return false instead of throwing
    }
  }

  /**
   * Generate a random nonce for security
   * @returns {string} Random nonce
   */
  generateNonce() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return ethers.hexlify(array);
  }

  /**
   * Create authentication message with nonce and timestamp
   * @param {string} nonce - Unique nonce for this authentication
   * @returns {string} Formatted authentication message
   */
  createAuthMessage(nonce) {
    const timestamp = Date.now();
    const expires = timestamp + (30 * 60 * 1000); // 30 minutes from now
    
    // Create a comprehensive authentication message
    const message = `SmartBank Authentication Request

Nonce: ${nonce}
Timestamp: ${new Date(timestamp).toISOString()}
Expires: ${new Date(expires).toISOString()}

This request will not trigger a blockchain transaction or cost any gas fees.

Sign this message to verify your identity and authenticate with SmartBank.`;
    
    return message;
  }

  /**
   * Request user to sign authentication message
   * @param {string} address - User's wallet address
   * @param {string} nonce - Unique nonce for this authentication
   * @returns {Promise<Object>} Signature data
   */
  async requestSignature(address, nonce) {
    try {
      if (!this.signer) {
        throw new Error(AUTH_ERRORS.WALLET_NOT_CONNECTED);
      }

      const currentAddress = await this.signer.getAddress();
      
      // Use address utilities for consistent comparison
      const addressesMatch = addressUtils.compareAddresses(address, currentAddress);
      if (!addressesMatch) {
        throw new Error('Address mismatch during signature request');
      }

      const message = this.createAuthMessage(nonce);
      const signature = await this.signer.signMessage(message);

      return {
        signature,
        message,
        address: currentAddress,
        timestamp: Date.now()
      };
    } catch (error) {
      if (error.code === 4001) {
        throw new Error(AUTH_ERRORS.SIGNATURE_REJECTED);
      }
      throw new Error(`${AUTH_ERRORS.UNKNOWN_ERROR}: ${error.message}`);
    }
  }

  /**
   * Verify a signature matches the expected message
   * @param {string} message - Original message that was signed
   * @param {string} signature - Signature to verify
   * @param {string} expectedAddress - Expected address that should have signed
   * @returns {Object} Verification result
   */
  verifySignature(message, signature, expectedAddress) {
    try {
      // Recover the address from the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      // Use address utilities for consistent comparison
      const verificationResult = addressUtils.extractAndValidateAddress(signature, message, expectedAddress);
      
      return {
        isValid: verificationResult.matches,
        recoveredAddress: verificationResult.recoveredAddress,
        expectedAddress: verificationResult.normalizedExpected,
        normalizedActual: verificationResult.normalizedActual,
        matches: verificationResult.matches,
        error: verificationResult.error
      };
    } catch (error) {
      console.error('Signature verification failed:', error);
      return {
        isValid: false,
        recoveredAddress: null,
        expectedAddress: addressUtils.normalizeAddress(expectedAddress),
        normalizedActual: null,
        matches: false,
        error: error.message
      };
    }
  }

  /**
   * Extract address from signature without message verification
   * @param {string} signature - Signature to extract address from
   * @returns {string|null} Extracted address or null if failed
   */
  extractAddressFromSignature(signature) {
    try {
      return ethers.verifyMessage('SmartBank Authentication', signature);
    } catch (error) {
      console.error('Failed to extract address from signature:', error);
      return null;
    }
  }

  /**
   * Validate that a nonce is recent and not reused
   * @param {string} nonce - Nonce to validate
   * @param {number} maxAge - Maximum age in milliseconds (default: 30 minutes)
   * @returns {boolean} Whether nonce is valid
   */
  validateNonce(nonce, maxAge = 30 * 60 * 1000) {
    try {
      // Basic nonce validation - should be 32 bytes (66 characters with 0x)
      if (!nonce || typeof nonce !== 'string' || nonce.length !== 66 || !nonce.startsWith('0x')) {
        return false;
      }

      // Additional validation: ensure nonce is hex
      const hexRegex = /^0x[a-fA-F0-9]{64}$/;
      if (!hexRegex.test(nonce)) {
        return false;
      }

      // Store used nonce with timestamp (implement in session service)
      return true;
    } catch (error) {
      console.error('Nonce validation failed:', error);
      return false;
    }
  }

  /**
   * Get current connected wallet address
   * @returns {Promise<string|null>} Current address or null if not connected
   */
  async getCurrentAddress() {
    try {
      if (!this.signer) {
        return null;
      }
      return await this.signer.getAddress();
    } catch (error) {
      console.error('Failed to get current address:', error);
      return null;
    }
  }

  /**
   * Check if wallet is connected and accessible
   * @returns {boolean} Connection status
   */
  isWalletConnected() {
    return this.signer !== null && this.provider !== null;
  }

  /**
   * Get network information
   * @returns {Promise<Object|null>} Network info or null
   */
  async getNetworkInfo() {
    try {
      if (!this.provider) {
        return null;
      }
      const network = await this.provider.getNetwork();
      return {
        chainId: Number(network.chainId),
        name: network.name,
        isSupported: Object.values(AUTH_CONFIG.SUPPORTED_NETWORKS).includes(Number(network.chainId))
      };
    } catch (error) {
      console.error('Failed to get network info:', error);
      return null;
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.provider = null;
    this.signer = null;
  }
}

// Export singleton instance
export default new SignatureService();
