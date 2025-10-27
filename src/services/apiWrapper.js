// Enhanced API Wrapper with Comprehensive Error Handling
// File: src/services/apiWrapper.js
// Purpose: Wrap all API calls with detailed error handling and logging

import ErrorHandler, { APIError } from '../utils/errorHandler';

/**
 * API Wrapper with Error Handling
 * Usage: 
 *   const result = await apiWrapper(
 *     () => axios.get('/endpoint'),
 *     { context: 'Fetching data', endpoint: '/endpoint' }
 *   );
 */
export async function apiWrapper(apiCall, options = {}) {
  const {
    context = 'API call',
    endpoint = 'unknown',
    method = 'GET',
    showToast = true,
    retries = 0,
    retryDelay = 1000,
  } = options;

  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    try {
      const response = await apiCall();
      
      // Log successful API call in development
      if (import.meta.env.DEV) {
        console.log(`✅ API Success [${method}] ${endpoint}:`, response.data);
      }

      return {
        success: true,
        data: response.data,
        status: response.status,
      };

    } catch (error) {
      lastError = error;
      attempt++;

      // If we have retries left, wait and try again
      if (attempt <= retries) {
        console.warn(`⚠️ API retry ${attempt}/${retries} for ${endpoint}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }

      // No more retries, handle the error
      return handleAPIError(error, {
        context,
        endpoint,
        method,
        showToast,
        attempt,
      });
    }
  }

  // This should never be reached, but just in case
  return handleAPIError(lastError, { context, endpoint, method, showToast });
}

/**
 * Handle API errors with detailed context
 */
function handleAPIError(error, options = {}) {
  const {
    context = 'API call',
    endpoint = 'unknown',
    method = 'GET',
    showToast = true,
    attempt = 1,
  } = options;

  // Extract error details
  const statusCode = error.response?.status;
  const responseData = error.response?.data;
  const errorMessage = getErrorMessage(error);

  // Create detailed API error
  const apiError = new APIError(errorMessage, {
    endpoint,
    method,
    statusCode,
    responseData,
    context,
    attempt,
    url: error.config?.url,
    headers: error.config?.headers,
  });

  // Log error with full context
  if (showToast) {
    ErrorHandler.handle(apiError);
  } else {
    console.error(`🔴 API Error [${method}] ${endpoint}:`, {
      message: errorMessage,
      statusCode,
      responseData,
      error,
    });
  }

  return {
    success: false,
    error: errorMessage,
    statusCode,
    data: null,
  };
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error) {
  // Network errors
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout - please try again';
    }
    if (error.code === 'ERR_NETWORK') {
      return 'Network error - check your internet connection';
    }
    return 'Unable to connect to server - please check your connection';
  }

  // HTTP status codes
  const status = error.response.status;
  const data = error.response.data;

  // Use server-provided error message if available
  if (data?.message) {
    return data.message;
  }
  if (data?.error) {
    return typeof data.error === 'string' ? data.error : 'Server error';
  }

  // Default messages based on status code
  const statusMessages = {
    400: 'Invalid request - please check your input',
    401: 'Unauthorized - please reconnect your wallet',
    403: 'Forbidden - you don\'t have permission',
    404: 'Resource not found',
    409: 'Conflict - resource already exists',
    422: 'Validation error - please check your input',
    429: 'Too many requests - please wait and try again',
    500: 'Server error - please try again later',
    502: 'Server is temporarily unavailable',
    503: 'Service unavailable - please try again later',
  };

  return statusMessages[status] || `Server error (${status})`;
}

/**
 * Validate API response format
 */
export function validateAPIResponse(response, requiredFields = []) {
  if (!response) {
    throw new APIError('Empty API response', {
      requiredFields,
    });
  }

  if (!response.success && response.error) {
    throw new APIError(response.error, {
      responseData: response,
    });
  }

  // Check required fields
  const missing = requiredFields.filter(field => !(field in response));
  if (missing.length > 0) {
    throw new APIError(`Missing required fields in API response: ${missing.join(', ')}`, {
      requiredFields,
      receivedFields: Object.keys(response),
      responseData: response,
    });
  }

  return true;
}

/**
 * API call with retry logic
 */
export async function apiWithRetry(apiCall, options = {}) {
  return apiWrapper(apiCall, {
    ...options,
    retries: options.retries || 2,
    retryDelay: options.retryDelay || 1000,
  });
}

/**
 * Batch API calls with error handling
 */
export async function batchAPIcalls(calls = []) {
  const results = await Promise.allSettled(
    calls.map(({ apiCall, options }) => 
      apiWrapper(apiCall, options)
    )
  );

  const succeeded = results.filter(r => r.status === 'fulfilled' && r.value.success);
  const failed = results.filter(r => r.status === 'rejected' || !r.value.success);

  if (import.meta.env.DEV) {
    console.log(`📊 Batch API calls: ${succeeded.length} succeeded, ${failed.length} failed`);
  }

  return {
    succeeded: succeeded.map(r => r.value),
    failed: failed.map(r => r.reason || r.value),
    total: results.length,
    successRate: (succeeded.length / results.length) * 100,
  };
}

/**
 * Create API method with automatic error handling
 */
export function createAPIMethod(axiosMethod, options = {}) {
  return async (...args) => {
    return apiWrapper(
      () => axiosMethod(...args),
      options
    );
  };
}

export default apiWrapper;

