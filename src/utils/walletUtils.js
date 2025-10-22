// Wallet Utilities
// File: src/utils/walletUtils.js

/**
 * Format wallet address for display
 * @param {string} address - Full wallet address
 * @param {number} startChars - Number of characters to show at start
 * @param {number} endChars - Number of characters to show at end
 * @returns {string} Formatted address
 */
export const formatAddress = (address, startChars = 8, endChars = 6) => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Validate Coreum address format
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
export const isValidCoreumAddress = (address) => {
  if (!address) return false;
  
  // Coreum addresses start with "core" and are 43-45 characters
  const coreumAddressRegex = /^core[a-z0-9]{39,41}$/;
  return coreumAddressRegex.test(address);
};

/**
 * Convert micro COREUM to COREUM
 * @param {string|number} microAmount - Amount in ucore
 * @returns {string} Amount in COREUM
 */
export const microToCoreum = (microAmount) => {
  if (!microAmount) return '0';
  const amount = parseFloat(microAmount) / 1000000;
  return amount.toFixed(6);
};

/**
 * Convert COREUM to micro COREUM
 * @param {string|number} coreumAmount - Amount in COREUM
 * @returns {string} Amount in ucore
 */
export const coreumToMicro = (coreumAmount) => {
  if (!coreumAmount) return '0';
  const amount = parseFloat(coreumAmount) * 1000000;
  return Math.floor(amount).toString();
};

/**
 * Format balance for display
 * @param {string|number} balance - Balance amount
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted balance
 */
export const formatBalance = (balance, decimals = 6) => {
  if (!balance || balance === '0') return '0.000000';
  const num = parseFloat(balance);
  return num.toFixed(decimals);
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

/**
 * Get wallet installation URL
 * @param {string} walletType - Type of wallet
 * @returns {string} Installation URL
 */
export const getWalletInstallUrl = (walletType) => {
  const urls = {
    keplr: 'https://www.keplr.app/download',
    leap: 'https://www.leapwallet.io/download',
    cosmostation: 'https://www.cosmostation.io/wallet',
  };
  return urls[walletType] || '#';
};

/**
 * Check if running in browser
 * @returns {boolean} True if in browser
 */
export const isBrowser = () => {
  return typeof window !== 'undefined';
};

/**
 * Get wallet error message
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export const getWalletErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';

  const message = error.message || error.toString();

  // Common error patterns
  if (message.includes('User rejected')) {
    return 'Connection was rejected. Please try again.';
  }
  if (message.includes('not installed')) {
    return 'Wallet extension not found. Please install it first.';
  }
  if (message.includes('not found')) {
    return 'Wallet not detected. Please ensure your extension is installed and enabled.';
  }
  if (message.includes('locked')) {
    return 'Wallet is locked. Please unlock it and try again.';
  }
  if (message.includes('timeout')) {
    return 'Connection timed out. Please try again.';
  }
  if (message.includes('network')) {
    return 'Network error. Please check your connection.';
  }
  if (message.includes('chain')) {
    return 'Chain not supported. Please add Coreum network to your wallet.';
  }

  // Default to original message if no pattern matches
  return message;
};

/**
 * Calculate transaction fee
 * @param {number} gasLimit - Gas limit for transaction
 * @param {number} gasPrice - Gas price (default: 0.1 ucore)
 * @returns {object} Fee object for CosmJS
 */
export const calculateFee = (gasLimit = 200000, gasPrice = 0.1) => {
  const amount = Math.ceil(gasLimit * gasPrice);
  return {
    amount: [
      {
        denom: 'ucore',
        amount: amount.toString(),
      },
    ],
    gas: gasLimit.toString(),
  };
};

/**
 * Validate transaction fee
 * @param {object} fee - Fee object
 * @returns {boolean} True if valid
 */
export const isValidFee = (fee) => {
  if (!fee || !fee.amount || !fee.gas) return false;
  if (!Array.isArray(fee.amount) || fee.amount.length === 0) return false;
  
  const amount = fee.amount[0];
  return amount && amount.denom === 'ucore' && amount.amount && parseInt(amount.amount) > 0;
};

/**
 * Format transaction hash for display
 * @param {string} hash - Transaction hash
 * @returns {string} Formatted hash
 */
export const formatTxHash = (hash) => {
  if (!hash) return '';
  return formatAddress(hash, 10, 8);
};

/**
 * Get explorer URL for transaction
 * @param {string} txHash - Transaction hash
 * @returns {string} Explorer URL
 */
export const getExplorerUrl = (txHash) => {
  return `https://explorer.coreum.com/coreum/transactions/${txHash}`;
};

/**
 * Get explorer URL for address
 * @param {string} address - Wallet address
 * @returns {string} Explorer URL
 */
export const getAddressExplorerUrl = (address) => {
  return `https://explorer.coreum.com/coreum/accounts/${address}`;
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Parse wallet connection error
 * @param {Error} error - Error object
 * @returns {object} Parsed error with code and message
 */
export const parseWalletError = (error) => {
  const message = getWalletErrorMessage(error);
  
  let code = 'UNKNOWN_ERROR';
  if (message.includes('rejected')) code = 'USER_REJECTED';
  if (message.includes('not installed')) code = 'NOT_INSTALLED';
  if (message.includes('not found')) code = 'NOT_FOUND';
  if (message.includes('locked')) code = 'WALLET_LOCKED';
  if (message.includes('timeout')) code = 'TIMEOUT';
  if (message.includes('network')) code = 'NETWORK_ERROR';
  if (message.includes('chain')) code = 'UNSUPPORTED_CHAIN';

  return {
    code,
    message,
    originalError: error,
  };
};

/**
 * Check if wallet is supported
 * @param {string} walletType - Type of wallet
 * @returns {boolean} True if supported
 */
export const isSupportedWallet = (walletType) => {
  const supportedWallets = ['keplr', 'leap', 'cosmostation'];
  return supportedWallets.includes(walletType);
};

/**
 * Get wallet display info
 * @param {string} walletType - Type of wallet
 * @returns {object} Display info with name and icon
 */
export const getWalletInfo = (walletType) => {
  const walletInfo = {
    keplr: { name: 'Keplr', icon: '🔵', color: '#1E90FF' },
    leap: { name: 'Leap', icon: '🟣', color: '#9333EA' },
    cosmostation: { name: 'Cosmostation', icon: '🟠', color: '#FF6B00' },
  };
  return walletInfo[walletType] || { name: 'Unknown', icon: '💼', color: '#6B7280' };
};

export default {
  formatAddress,
  isValidCoreumAddress,
  microToCoreum,
  coreumToMicro,
  formatBalance,
  copyToClipboard,
  getWalletInstallUrl,
  isBrowser,
  getWalletErrorMessage,
  calculateFee,
  isValidFee,
  formatTxHash,
  getExplorerUrl,
  getAddressExplorerUrl,
  debounce,
  parseWalletError,
  isSupportedWallet,
  getWalletInfo,
};



