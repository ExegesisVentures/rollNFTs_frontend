// Enhanced Error Boundary Component with Detailed Debugging
// File: src/components/shared/ErrorBoundary.jsx

import React from 'react';
import EmptyState from './EmptyState';
import { getWalletErrorMessage } from '../../utils/walletUtils';
import ErrorHandler, { AppError, ErrorLogger } from '../../utils/errorHandler';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    // Create enhanced error with React component stack
    const enhancedError = new AppError(error.message, {
      componentStack: errorInfo.componentStack,
      originalError: error.toString(),
      boundary: this.props.name || 'ErrorBoundary',
    });

    // Log with full context
    ErrorLogger.log(enhancedError, {
      location: window.location.href,
      timestamp: new Date().toISOString(),
    });

    this.setState({
      errorInfo,
    });
  }

  copyErrorToClipboard = () => {
    const { error, errorInfo } = this.state;
    const errorData = {
      message: error.toString(),
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    navigator.clipboard.writeText(JSON.stringify(errorData, null, 2));
    alert('Error details copied to clipboard! Share with support or AI assistants.');
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
    const { hasError, error, errorInfo, showDetails } = this.state;
    const isDevelopment = import.meta.env.DEV;

    if (hasError) {
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
          <div style={{ maxWidth: '800px', width: '100%' }}>
            {/* User-friendly error display */}
            <EmptyState
              icon={isWalletError ? '💼' : '⚠️'}
              title={isWalletError ? 'Wallet Connection Error' : 'Something Went Wrong'}
              description={errorMessage}
              actionText="Return to Homepage"
              onAction={this.handleReset}
            />
            
            {/* Action buttons */}
            <div style={{ 
              marginTop: '1.5rem', 
              textAlign: 'center',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
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
                }}
              >
                🔄 Reload Page
              </button>

              <button
                onClick={this.copyErrorToClipboard}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(37, 214, 149, 0.1)',
                  border: '1px solid rgba(37, 214, 149, 0.3)',
                  borderRadius: '8px',
                  color: '#25d695',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                }}
              >
                📋 Copy Error Details
              </button>

              {isDevelopment && (
                <button
                  onClick={() => this.setState({ showDetails: !showDetails })}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(220, 38, 38, 0.1)',
                    border: '1px solid rgba(220, 38, 38, 0.3)',
                    borderRadius: '8px',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                  }}
                >
                  {showDetails ? '🔼 Hide' : '🔽 Show'} Developer Details
                </button>
              )}
            </div>

            {/* Developer details (only in development) */}
            {isDevelopment && showDetails && error && (
              <div style={{
                marginTop: '2rem',
                background: '#1a1a1a',
                border: '2px solid #ff4444',
                borderRadius: '12px',
                padding: '1.5rem',
              }}>
                <h3 style={{ color: '#ff4444', marginBottom: '1rem', marginTop: 0 }}>
                  🐛 Developer Details
                </h3>

                {/* Error message */}
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#4d9cff', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    Error Message:
                  </h4>
                  <pre style={{
                    background: '#0e0e0e',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    overflow: 'auto',
                    color: '#ff6b6b',
                    fontSize: '13px',
                    margin: 0,
                  }}>
                    {error.toString()}
                  </pre>
                </div>

                {/* Component stack */}
                {errorInfo?.componentStack && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ color: '#4d9cff', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      Component Stack:
                    </h4>
                    <pre style={{
                      background: '#0e0e0e',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      overflow: 'auto',
                      color: '#94a3b8',
                      fontSize: '11px',
                      maxHeight: '200px',
                      margin: 0,
                    }}>
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}

                {/* Stack trace */}
                {error.stack && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ color: '#4d9cff', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      Stack Trace:
                    </h4>
                    <pre style={{
                      background: '#0e0e0e',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      overflow: 'auto',
                      color: '#94a3b8',
                      fontSize: '11px',
                      maxHeight: '200px',
                      margin: 0,
                    }}>
                      {error.stack}
                    </pre>
                  </div>
                )}

                {/* Debugging tips */}
                <div style={{
                  background: 'rgba(37, 214, 149, 0.1)',
                  border: '1px solid rgba(37, 214, 149, 0.3)',
                  padding: '1rem',
                  borderRadius: '6px',
                  marginTop: '1rem',
                }}>
                  <h4 style={{ color: '#25d695', marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    💡 Debugging Tips:
                  </h4>
                  <ul style={{ color: '#94a3b8', paddingLeft: '1.25rem', margin: 0, fontSize: '0.8125rem' }}>
                    <li>Check browser console for additional error details</li>
                    <li>Review component stack to identify failing component</li>
                    <li>Click "Copy Error Details" to share with AI assistants</li>
                    <li>Check if any props are undefined or null</li>
                    <li>Verify API responses match expected format</li>
                    <li>Look for recent code changes that might have caused this</li>
                  </ul>
                </div>
              </div>
            )}

            {/* AI-friendly error format (collapsible) */}
            {isDevelopment && error && (
              <details style={{
                marginTop: '1rem',
                background: '#1a1a1a',
                border: '1px solid rgba(77, 156, 255, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
              }}>
                <summary style={{
                  cursor: 'pointer',
                  color: '#4d9cff',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                }}>
                  🤖 AI-Friendly Error Format (Click to expand)
                </summary>
                <pre style={{
                  background: '#0e0e0e',
                  padding: '1rem',
                  borderRadius: '6px',
                  overflow: 'auto',
                  color: '#94a3b8',
                  fontSize: '11px',
                  marginTop: '0.75rem',
                  marginBottom: 0,
                }}>
{`ERROR REPORT FOR AI ANALYSIS:

File/Component: ${this.props.name || 'Unknown Component'}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
Environment: ${import.meta.env.MODE}

ERROR MESSAGE:
${error.toString()}

COMPONENT STACK:
${errorInfo?.componentStack || 'N/A'}

STACK TRACE:
${error.stack || 'N/A'}

DEBUGGING SUGGESTIONS:
1. Check if all props are properly defined and not undefined/null
2. Verify API responses match expected schema
3. Look for missing error handling in async operations
4. Review recent code changes that might have introduced this
5. Check for timing issues (race conditions)

SYSTEM INFO:
- User Agent: ${navigator.userAgent}
- Screen: ${window.screen.width}x${window.screen.height}
- Online: ${navigator.onLine}
`}
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
