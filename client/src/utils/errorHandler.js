import { toast } from 'react-hot-toast';
import * as Sentry from "@sentry/react";

// Initialize error tracking
export const initializeErrorTracking = () => {
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
      beforeSend(event) {
        // Don't send errors in development
        if (process.env.NODE_ENV === 'development') {
          return null;
        }
        return event;
      },
    });
  }
};

// Error types
export const ErrorTypes = {
  AUTHENTICATION: 'auth_error',
  NETWORK: 'network_error',
  FILE_OPERATION: 'file_error',
  DATABASE: 'database_error',
  VALIDATION: 'validation_error',
  PERMISSION: 'permission_error',
  UNKNOWN: 'unknown_error'
};

// Error severity levels
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Main error handler
export const handleError = (error, type = ErrorTypes.UNKNOWN, severity = ErrorSeverity.MEDIUM) => {
  // Log error details
  const errorDetails = {
    message: error.message,
    type,
    severity,
    timestamp: new Date().toISOString(),
    stack: error.stack
  };

  // Send to error tracking service in production
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      level: severity,
      tags: {
        type,
        environment: process.env.NODE_ENV
      },
      extra: errorDetails
    });
  }

  // Show user-friendly message
  const userMessage = getUserFriendlyMessage(error, type);
  toast.error(userMessage);

  // Return error details for handling
  return errorDetails;
};

// Performance monitoring
export const monitorPerformance = (operationName, callback) => {
  const startTime = performance.now();

  try {
    return callback();
  } finally {
    const duration = performance.now() - startTime;

    // Log performance metrics
    if (duration > 1000) { // Log operations taking more than 1 second
      Sentry.captureMessage(`Slow operation: ${operationName}`, {
        level: 'warning',
        extra: {
          duration,
          operation: operationName
        }
      });
    }
  }
};

// User-friendly error messages
const getUserFriendlyMessage = (error, type) => {
  switch (type) {
    case ErrorTypes.AUTHENTICATION:
      return 'Authentication failed. Please try signing in again.';
    case ErrorTypes.NETWORK:
      return 'Network error. Please check your connection and try again.';
    case ErrorTypes.FILE_OPERATION:
      return 'Failed to process file. Please try again.';
    case ErrorTypes.DATABASE:
      return 'Database operation failed. Please try again.';
    case ErrorTypes.VALIDATION:
      return error.message || 'Invalid input. Please check your data.';
    case ErrorTypes.PERMISSION:
      return 'You don\'t have permission to perform this action.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

// Rate limiting for operations
const rateLimits = new Map();

export const checkRateLimit = (operationKey, limit = 5, windowMs = 60000) => {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get or initialize operation history
  const history = rateLimits.get(operationKey) || [];

  // Remove old entries
  const recentCalls = history.filter(timestamp => timestamp > windowStart);

  // Check if limit exceeded
  if (recentCalls.length >= limit) {
    throw new Error(`Rate limit exceeded for ${operationKey}`);
  }

  // Add new timestamp
  recentCalls.push(now);
  rateLimits.set(operationKey, recentCalls);

  return true;
};

// Monitor API calls
export const monitorApiCall = async (apiCall, options = {}) => {
  const {
    name = 'API Call',
    timeout = 30000,
    retries = 3,
    shouldRetry = (error) => error.status === 429 || error.status >= 500
  } = options;

  let attempt = 0;

  while (attempt < retries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const result = await Promise.race([
        apiCall(controller.signal),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
      ]);

      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      attempt++;

      if (attempt === retries || !shouldRetry(error)) {
        handleError(error, ErrorTypes.NETWORK);
        throw error;
      }

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 10000))
      );
    }
  }
}; 