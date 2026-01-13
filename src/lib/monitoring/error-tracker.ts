/**
 * Error tracking and reporting system
 * Captures JavaScript errors, API failures, and component errors
 */

interface ErrorEvent {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  level: 'error' | 'warning' | 'info';
  source: 'javascript' | 'api' | 'component' | 'network';
  metadata?: Record<string, any>;
}

interface ErrorContext {
  component?: string;
  action?: string;
  endpoint?: string;
  statusCode?: number;
  userId?: string;
  sessionId?: string;
  stack?: string;
  [key: string]: any;
}

class ErrorTracker {
  private errors: ErrorEvent[] = [];
  private maxErrors: number = 100;
  private sessionId: string;
  private isEnabled: boolean = true;
  private reportEndpoint?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.reportEndpoint = process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT;

    if (typeof window !== 'undefined') {
      this.initializeErrorHandlers();
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Initialize global error handlers
   */
  private initializeErrorHandlers(): void {
    // Unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError(event.message, 'javascript', 'error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(
        `Unhandled promise rejection: ${event.reason}`,
        'javascript',
        'error',
        {
          reason: event.reason,
          stack: event.reason?.stack,
        }
      );
    });

    // Network errors
    if ('navigator' in window && 'onLine' in navigator) {
      window.addEventListener('online', () => {
        this.trackError('Network connection restored', 'network', 'info', {
          type: 'network_status',
          online: true,
        });
      });

      window.addEventListener('offline', () => {
        this.trackError('Network connection lost', 'network', 'warning', {
          type: 'network_status',
          online: false,
        });
      });
    }
  }

  /**
   * Track an error event
   */
  public trackError(
    message: string,
    source: ErrorEvent['source'] = 'javascript',
    level: ErrorEvent['level'] = 'error',
    context?: Partial<ErrorContext>
  ): void {
    if (!this.isEnabled) return;

    const error: ErrorEvent = {
      id: this.generateErrorId(),
      message,
      stack: context instanceof Error ? context.stack : context?.stack,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      userId: context?.userId,
      sessionId: context?.sessionId || this.sessionId,
      level,
      source,
      metadata: {
        ...context,
        browserInfo: this.getBrowserInfo(),
      },
    };

    this.errors.push(error);

    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      this.logError(error);
    }

    // Report in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error);
    }
  }

  /**
   * Track API errors specifically
   */
  public trackApiError(
    endpoint: string,
    statusCode: number,
    message: string,
    context?: Record<string, any>
  ): void {
    this.trackError(`API Error: ${message}`, 'api', 'error', {
      endpoint,
      statusCode,
      ...context,
    });
  }

  /**
   * Track component errors specifically
   */
  public trackComponentError(
    componentName: string,
    error: Error,
    action?: string
  ): void {
    this.trackError(`Component Error in ${componentName}: ${error.message}`, 'component', 'error', {
      component: componentName,
      action,
      stack: error.stack,
    });
  }

  /**
   * Track user interactions for context
   */
  public trackUserAction(action: string, context?: Record<string, any>): void {
    this.trackError(`User action: ${action}`, 'javascript', 'info', {
      action,
      ...context,
    });
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Get browser information for error context
   */
  private getBrowserInfo(): Record<string, string> {
    if (typeof navigator === 'undefined') return {};

    return {
      browser: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled.toString(),
      onLine: navigator.onLine.toString(),
    };
  }

  /**
   * Log error to console in development
   */
  private logError(error: ErrorEvent): void {
    const logLevel = error.level === 'error' ? 'error' :
                   error.level === 'warning' ? 'warn' : 'info';

    console[logLevel](`[${error.level.toUpperCase()}] ${error.message}`, {
      id: error.id,
      source: error.source,
      timestamp: new Date(error.timestamp).toISOString(),
      ...error.metadata,
    });

    if (error.stack) {
      console.groupCollapsed('Stack Trace');
      console.log(error.stack);
      console.groupEnd();
    }
  }

  /**
   * Report error to monitoring service
   */
  private reportError(error: ErrorEvent): void {
    if (!this.reportEndpoint) return;

    try {
      fetch(this.reportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...error,
          // Add additional context for error reporting services
          environment: process.env.NODE_ENV,
          version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
          buildTime: process.env.NEXT_PUBLIC_BUILD_TIME,
        }),
      }).catch(reportError => {
        console.warn('Failed to report error to monitoring service:', reportError);
      });
    } catch (error) {
      console.warn('Error reporting failed:', error);
    }
  }

  /**
   * Get error summary statistics
   */
  public getErrorSummary(): {
    total: number;
    byLevel: Record<string, number>;
    bySource: Record<string, number>;
    recent: ErrorEvent[];
    critical: ErrorEvent[];
  } {
    const byLevel: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    this.errors.forEach(error => {
      // Count by level
      byLevel[error.level] = (byLevel[error.level] || 0) + 1;

      // Count by source
      bySource[error.source] = (bySource[error.source] || 0) + 1;
    });

    return {
      total: this.errors.length,
      byLevel,
      bySource,
      recent: this.errors.filter(error => error.timestamp > oneHourAgo),
      critical: this.errors.filter(error => error.level === 'error'),
    };
  }

  /**
   * Get all errors
   */
  public getAllErrors(): ErrorEvent[] {
    return [...this.errors];
  }

  /**
   * Clear error history
   */
  public clearErrors(): void {
    this.errors = [];
  }

  /**
   * Enable or disable error tracking
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if error tracking is enabled
   */
  public isTrackingEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

// Utility functions for easy usage
export const trackError = (message: string, source?: ErrorEvent['source'], context?: Partial<ErrorContext>) => {
  errorTracker.trackError(message, source, 'error', context);
};

export const trackWarning = (message: string, source?: ErrorEvent['source'], context?: Partial<ErrorContext>) => {
  errorTracker.trackError(message, source, 'warning', context);
};

export const trackApiError = (endpoint: string, statusCode: number, message: string, context?: Record<string, any>) => {
  errorTracker.trackApiError(endpoint, statusCode, message, context);
};

export const trackComponentError = (componentName: string, error: Error, action?: string) => {
  errorTracker.trackComponentError(componentName, error, action);
};

export default errorTracker;