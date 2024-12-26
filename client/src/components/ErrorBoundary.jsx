import React from 'react';
import * as Sentry from "@sentry/react";
import { handleError } from '../utils/errorHandler';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Send error to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, {
        extra: {
          componentStack: errorInfo.componentStack
        }
      });
    }

    // Handle error with our error handler
    handleError(error, 'component_error', 'high');

    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-semibold text-red-400 mb-4">Something went wrong</h2>
            <div className="text-slate-300 mb-4">
              An unexpected error occurred. Our team has been notified.
            </div>
            {process.env.NODE_ENV === 'development' && (
              <pre className="bg-slate-900 p-4 rounded text-sm text-slate-400 overflow-auto max-h-48">
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
