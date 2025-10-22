// Enhanced Error Boundary Component with Wallet Error Handling
// File: src/components/shared/ErrorBoundary.jsx

import React from 'react';
import EmptyState from './EmptyState';
import { getWalletErrorMessage } from '../../utils/walletUtils';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error caught by boundary:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Store error info in state
    this.setState({ errorInfo });

    // Optional: Send error to monitoring service
    // this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // Implement error logging service integration here
    // e.g., Sentry, LogRocket, etc.
    try {
      // Example: window.errorLogger?.log({ error, errorInfo });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  getErrorMessage = () => {
    const { error } = this.state;
    
    if (!error) {
      return 'An unexpected error occurred. Please try again.';
    }

    // Check if it's a wallet error
    if (error.message?.includes('wallet') || 
        error.message?.includes('keplr') || 
        error.message?.includes('leap') || 
        error.message?.includes('cosmostation')) {
      return getWalletErrorMessage(error);
    }

    // Check for common React errors
    if (error.message?.includes('Cannot read properties')) {
      return 'A component failed to load properly. Please refresh the page.';
    }

    if (error.message?.includes('Failed to fetch')) {
      return 'Network connection error. Please check your internet connection and try again.';
    }

    if (error.message?.includes('timeout')) {
      return 'Request timed out. Please check your connection and try again.';
    }

    // Return generic message for unknown errors
    return error.message || 'We encountered an unexpected error. Please try refreshing the page.';
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.getErrorMessage();
      const isWalletError = errorMessage.toLowerCase().includes('wallet');

      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '2rem',
          background: '#0e0e0e'
        }}>
          <div style={{ maxWidth: '600px', width: '100%' }}>
            <EmptyState
              icon={isWalletError ? '💼' : '⚠️'}
              title={isWalletError ? 'Wallet Connection Error' : 'Something Went Wrong'}
              description={errorMessage}
              actionText="Return to Homepage"
              onAction={this.handleReset}
            />
            
            <div style={{ 
              marginTop: '1.5rem', 
              textAlign: 'center',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(77, 156, 255, 0.1)',
                  border: '1px solid rgba(77, 156, 255, 0.3)',
                  borderRadius: '8px',
                  color: '#4d9cff',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(77, 156, 255, 0.2)';
                  e.target.style.borderColor = '#4d9cff';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(77, 156, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(77, 156, 255, 0.3)';
                }}
              >
                Reload Page
              </button>
            </div>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginTop: '2rem',
                padding: '1rem',
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{ 
                  overflow: 'auto', 
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word' 
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

