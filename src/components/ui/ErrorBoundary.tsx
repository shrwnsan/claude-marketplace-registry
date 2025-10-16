import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; errorInfo?: React.ErrorInfo; onReset?: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console or error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{
  error?: Error;
  errorInfo?: React.ErrorInfo;
  onReset?: () => void;
}> = ({ error, errorInfo, onReset }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-error-600 dark:text-error-400" />
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Oops! Something went wrong
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We're sorry, but something unexpected happened. Our team has been notified.
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Error Details (Development Only)
            </summary>
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-40">
              <div className="mb-2">
                <strong>Error:</strong> {error.toString()}
              </div>
              {errorInfo && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap mt-1">{errorInfo.componentStack}</pre>
                </div>
              )}
            </div>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onReset}
            className="btn btn-primary inline-flex items-center justify-center"
            aria-label="Try again"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>

          <a
            href="/"
            className="btn btn-secondary inline-flex items-center justify-center"
            aria-label="Go to homepage"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </a>
        </div>

        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          If this problem persists, please{' '}
          <a
            href="https://github.com/claude-marketplace/aggregator/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            report an issue
          </a>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;