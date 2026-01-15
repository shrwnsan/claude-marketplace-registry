import React from 'react';
import { AlertTriangle, RefreshCw, Info, AlertCircle, CheckCircle } from 'lucide-react';

export type ErrorType = 'error' | 'warning' | 'info' | 'success';

interface ErrorDisplayProps {
  type?: ErrorType;
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  type = 'error',
  title,
  message,
  onRetry,
  onDismiss,
  className = '',
  showIcon = true,
  size = 'md',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertTriangle className='w-5 h-5' />;
      case 'warning':
        return <AlertCircle className='w-5 h-5' />;
      case 'info':
        return <Info className='w-5 h-5' />;
      case 'success':
        return <CheckCircle className='w-5 h-5' />;
      default:
        return <AlertTriangle className='w-5 h-5' />;
    }
  };

  const getStyles = () => {
    const baseStyles = 'rounded-lg border p-4 transition-all duration-200';

    switch (type) {
      case 'error':
        return `${baseStyles} bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800 text-error-800 dark:text-error-200`;
      case 'warning':
        return `${baseStyles} bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800 text-warning-800 dark:text-warning-200`;
      case 'info':
        return `${baseStyles} bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200`;
      case 'success':
        return `${baseStyles} bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800 text-success-800 dark:text-success-200`;
      default:
        return `${baseStyles} bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800 text-error-800 dark:text-error-200`;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'p-3 text-sm';
      case 'lg':
        return 'p-6 text-lg';
      default:
        return 'p-4 text-base';
    }
  };

  return (
    <div className={`${getStyles()} ${getSizeStyles()} ${className}`} role='alert'>
      <div className='flex items-start'>
        {showIcon && (
          <div className='flex-shrink-0 mr-3'>
            <div
              className={`${
                type === 'error'
                  ? 'text-error-600 dark:text-error-400'
                  : type === 'warning'
                    ? 'text-warning-600 dark:text-warning-400'
                    : type === 'info'
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-success-600 dark:text-success-400'
              }`}
            >
              {getIcon()}
            </div>
          </div>
        )}

        <div className='flex-1 min-w-0'>
          {title && <h3 className='font-semibold mb-1'>{title}</h3>}
          <p className='text-sm leading-relaxed'>{message}</p>

          {(onRetry || onDismiss) && (
            <div className='flex items-center gap-3 mt-3'>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className='inline-flex items-center px-3 py-1 text-sm font-medium rounded-md bg-current/10 hover:bg-current/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current'
                  aria-label='Retry action'
                >
                  <RefreshCw className='w-3 h-3 mr-1' />
                  Retry
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className='text-sm underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current'
                  aria-label='Dismiss message'
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className='flex-shrink-0 ml-3 p-1 rounded-md hover:bg-current/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current'
            aria-label='Close alert'
          >
            <span className='sr-only'>Close</span>
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                clipRule='evenodd'
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
