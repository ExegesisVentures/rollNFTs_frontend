// Comprehensive Error Handling System
// File: src/utils/errorHandler.js
// Purpose: Centralized error handling with detailed context for easy debugging

import toast from 'react-hot-toast';

/**
 * Custom Error Classes with Rich Context
 * Each error type provides specific debugging information
 */

export class AppError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = 'AppError';
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.stack = new Error().stack;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

export class WalletError extends AppError {
  constructor(message, context = {}) {
    super(message, context);
    this.name = 'WalletError';
    this.category = 'WALLET';
    this.suggestions = this.getSuggestions();
  }

  getSuggestions() {
    const suggestions = [];
    
    if (this.message.includes('not installed')) {
      suggestions.push('Install the wallet extension from the official website');
      suggestions.push('Refresh the page after installation');
    }
    
    if (this.message.includes('rejected')) {
      suggestions.push('User rejected the transaction - this is normal');
      suggestions.push('Try the action again if it was accidental');
    }
    
    if (this.message.includes('network')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try switching to a different RPC endpoint');
    }
    
    if (this.message.includes('insufficient')) {
      suggestions.push('Add more funds to your wallet');
      suggestions.push('Check the required amount in the transaction details');
    }

    return suggestions;
  }
}

export class BlockchainError extends AppError {
  constructor(message, context = {}) {
    super(message, context);
    this.name = 'BlockchainError';
    this.category = 'BLOCKCHAIN';
    this.suggestions = this.getSuggestions();
  }

  getSuggestions() {
    const suggestions = [];
    
    if (this.message.includes('gas')) {
      suggestions.push('Increase the gas limit in transaction settings');
      suggestions.push('Wait for network congestion to decrease');
    }
    
    if (this.message.includes('nonce')) {
      suggestions.push('Reset your wallet account in settings');
      suggestions.push('Wait a few seconds and try again');
    }
    
    if (this.message.includes('timeout')) {
      suggestions.push('Transaction may still be processing - check blockchain explorer');
      suggestions.push('Try with a higher gas price');
    }

    return suggestions;
  }
}

export class APIError extends AppError {
  constructor(message, context = {}) {
    super(message, context);
    this.name = 'APIError';
    this.category = 'API';
    this.statusCode = context.statusCode;
    this.endpoint = context.endpoint;
    this.suggestions = this.getSuggestions();
  }

  getSuggestions() {
    const suggestions = [];
    
    if (this.statusCode === 404) {
      suggestions.push('The requested resource was not found');
      suggestions.push('Check the URL/ID being requested');
      suggestions.push('Verify the resource exists in the database');
    }
    
    if (this.statusCode === 401 || this.statusCode === 403) {
      suggestions.push('Authentication/Authorization failed');
      suggestions.push('Reconnect your wallet');
      suggestions.push('Check if you have the required permissions');
    }
    
    if (this.statusCode === 500) {
      suggestions.push('Server error - not your fault');
      suggestions.push('Try again in a few moments');
      suggestions.push('Contact support if issue persists');
    }
    
    if (this.statusCode === 429) {
      suggestions.push('Too many requests - rate limit exceeded');
      suggestions.push('Wait 60 seconds and try again');
    }

    return suggestions;
  }
}

export class ValidationError extends AppError {
  constructor(message, context = {}) {
    super(message, context);
    this.name = 'ValidationError';
    this.category = 'VALIDATION';
    this.field = context.field;
    this.value = context.value;
    this.suggestions = this.getSuggestions();
  }

  getSuggestions() {
    const suggestions = [];
    
    if (this.field) {
      suggestions.push(`Fix the "${this.field}" field`);
    }
    
    if (this.message.includes('required')) {
      suggestions.push('This field cannot be empty');
    }
    
    if (this.message.includes('invalid')) {
      suggestions.push('Check the format of your input');
      suggestions.push('See example format in placeholder text');
    }

    return suggestions;
  }
}

export class IPFSError extends AppError {
  constructor(message, context = {}) {
    super(message, context);
    this.name = 'IPFSError';
    this.category = 'IPFS';
    this.suggestions = this.getSuggestions();
  }

  getSuggestions() {
    const suggestions = [];
    
    if (this.message.includes('credentials')) {
      suggestions.push('Check VITE_PINATA_JWT in .env file');
      suggestions.push('Verify API key is valid in Pinata dashboard');
      suggestions.push('Make sure environment variables are loaded');
    }
    
    if (this.message.includes('size')) {
      suggestions.push('File is too large - compress the image');
      suggestions.push('Maximum file size is 10MB');
    }
    
    if (this.message.includes('network')) {
      suggestions.push('IPFS gateway may be down');
      suggestions.push('Try again in a few moments');
    }

    return suggestions;
  }
}

/**
 * Error Logger - Logs errors with full context for debugging
 */
export class ErrorLogger {
  static isDevelopment = import.meta.env.DEV;

  static log(error, additionalContext = {}) {
    const errorData = {
      timestamp: new Date().toISOString(),
      environment: this.isDevelopment ? 'development' : 'production',
      url: window.location.href,
      userAgent: navigator.userAgent,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error.context,
      },
      additionalContext,
    };

    // Console log with styling for easy reading
    if (this.isDevelopment) {
      console.group(`🔴 ${error.name}: ${error.message}`);
      console.error('Error Object:', error);
      console.info('Context:', error.context);
      console.info('Additional Context:', additionalContext);
      console.info('Stack Trace:', error.stack);
      
      if (error.suggestions && error.suggestions.length > 0) {
        console.group('💡 Suggestions to Fix:');
        error.suggestions.forEach((suggestion, index) => {
          console.info(`${index + 1}. ${suggestion}`);
        });
        console.groupEnd();
      }
      
      console.groupEnd();
    }

    // Send to error tracking service (e.g., Sentry)
    this.sendToMonitoring(errorData);

    // Save to localStorage for debugging
    this.saveToLocalStorage(errorData);

    return errorData;
  }

  static sendToMonitoring(errorData) {
    // TODO: Integrate with Sentry or similar service
    // Example: Sentry.captureException(errorData);
    
    // For now, just store in memory
    if (!window.__ERROR_LOG__) {
      window.__ERROR_LOG__ = [];
    }
    window.__ERROR_LOG__.push(errorData);
  }

  static saveToLocalStorage(errorData) {
    try {
      const errors = JSON.parse(localStorage.getItem('rollnfts_errors') || '[]');
      errors.push(errorData);
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.shift();
      }
      
      localStorage.setItem('rollnfts_errors', JSON.stringify(errors));
    } catch (e) {
      console.warn('Failed to save error to localStorage:', e);
    }
  }

  static getRecentErrors() {
    try {
      return JSON.parse(localStorage.getItem('rollnfts_errors') || '[]');
    } catch (e) {
      return [];
    }
  }

  static clearErrors() {
    localStorage.removeItem('rollnfts_errors');
    window.__ERROR_LOG__ = [];
  }
}

/**
 * Error Handler - Main handler for all errors
 */
export class ErrorHandler {
  static handle(error, context = {}) {
    // Ensure error is an Error object
    if (typeof error === 'string') {
      error = new AppError(error, context);
    }

    // Log the error with full context
    const errorData = ErrorLogger.log(error, context);

    // Show user-friendly toast notification
    const userMessage = this.getUserMessage(error);
    toast.error(userMessage, {
      duration: 5000,
      icon: '🔴',
    });

    // In development, show detailed error modal
    if (ErrorLogger.isDevelopment) {
      this.showDevelopmentError(error);
    }

    return errorData;
  }

  static getUserMessage(error) {
    // User-friendly messages based on error type
    const messages = {
      WalletError: 'Wallet error: ',
      BlockchainError: 'Blockchain error: ',
      APIError: 'Server error: ',
      ValidationError: 'Validation error: ',
      IPFSError: 'IPFS error: ',
      AppError: 'Error: ',
    };

    const prefix = messages[error.name] || 'Error: ';
    return prefix + error.message;
  }

  static showDevelopmentError(error) {
    // Create a detailed error display for development
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      max-width: 500px;
      max-height: 600px;
      overflow: auto;
      background: #1a1a1a;
      color: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      z-index: 10000;
      font-family: monospace;
      font-size: 12px;
    `;

    errorDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #ff4444;">🔴 ${error.name}</h3>
        <button onclick="this.parentElement.parentElement.remove()" style="background: #333; border: none; color: #fff; padding: 5px 10px; cursor: pointer; border-radius: 4px;">✕</button>
      </div>
      <div style="background: #2a2a2a; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
        <strong>Message:</strong><br/>
        ${error.message}
      </div>
      ${error.suggestions && error.suggestions.length > 0 ? `
        <div style="background: #2a4a2a; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
          <strong>💡 How to Fix:</strong>
          <ul style="margin: 5px 0; padding-left: 20px;">
            ${error.suggestions.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      ${error.context && Object.keys(error.context).length > 0 ? `
        <div style="background: #2a2a2a; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
          <strong>Context:</strong>
          <pre style="margin: 5px 0; white-space: pre-wrap; word-wrap: break-word;">${JSON.stringify(error.context, null, 2)}</pre>
        </div>
      ` : ''}
      <div style="background: #2a2a2a; padding: 10px; border-radius: 4px; font-size: 10px; max-height: 200px; overflow: auto;">
        <strong>Stack Trace:</strong>
        <pre style="margin: 5px 0; white-space: pre-wrap;">${error.stack}</pre>
      </div>
      <button onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(error.toJSON ? error.toJSON() : error)}, null, 2)); alert('Error copied to clipboard!')" style="width: 100%; margin-top: 10px; background: #4444ff; border: none; color: #fff; padding: 8px; cursor: pointer; border-radius: 4px;">
        📋 Copy Error Details
      </button>
    `;

    document.body.appendChild(errorDiv);

    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (document.body.contains(errorDiv)) {
        errorDiv.remove();
      }
    }, 30000);
  }

  static async handleAsync(asyncFunction, context = {}) {
    try {
      return await asyncFunction();
    } catch (error) {
      return this.handle(error, context);
    }
  }
}

/**
 * Utility function to wrap async operations with error handling
 */
export function withErrorHandling(asyncFunction, context = {}) {
  return async (...args) => {
    try {
      return await asyncFunction(...args);
    } catch (error) {
      ErrorHandler.handle(error, { ...context, args });
      throw error; // Re-throw so component can handle it
    }
  };
}

/**
 * React Hook for error handling
 */
export function useErrorHandler() {
  return {
    handleError: (error, context) => ErrorHandler.handle(error, context),
    handleAsync: (asyncFn, context) => ErrorHandler.handleAsync(asyncFn, context),
  };
}

/**
 * Debug Helper - Export errors for AI analysis
 */
export function exportErrorsForAI() {
  const errors = ErrorLogger.getRecentErrors();
  const errorReport = {
    generated: new Date().toISOString(),
    totalErrors: errors.length,
    errorsByType: {},
    errors: errors,
  };

  // Group by error type
  errors.forEach(error => {
    const type = error.error.name;
    if (!errorReport.errorsByType[type]) {
      errorReport.errorsByType[type] = 0;
    }
    errorReport.errorsByType[type]++;
  });

  // Create downloadable file
  const blob = new Blob([JSON.stringify(errorReport, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rollnfts-errors-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  console.log('📊 Error Report Generated:', errorReport);
  return errorReport;
}

// Make debug functions available globally in development
if (import.meta.env.DEV) {
  window.__ROLLNFTS_DEBUG__ = {
    exportErrors: exportErrorsForAI,
    getRecentErrors: () => ErrorLogger.getRecentErrors(),
    clearErrors: () => ErrorLogger.clearErrors(),
    testError: (type = 'AppError') => {
      const errorClasses = {
        AppError,
        WalletError,
        BlockchainError,
        APIError,
        ValidationError,
        IPFSError,
      };
      const ErrorClass = errorClasses[type] || AppError;
      const testError = new ErrorClass(`Test ${type}`, { test: true });
      ErrorHandler.handle(testError);
    },
  };

  console.log('🔧 Debug functions available:');
  console.log('  window.__ROLLNFTS_DEBUG__.exportErrors() - Export errors as JSON');
  console.log('  window.__ROLLNFTS_DEBUG__.getRecentErrors() - View recent errors');
  console.log('  window.__ROLLNFTS_DEBUG__.clearErrors() - Clear error log');
  console.log('  window.__ROLLNFTS_DEBUG__.testError("WalletError") - Test error display');
}

export default ErrorHandler;

