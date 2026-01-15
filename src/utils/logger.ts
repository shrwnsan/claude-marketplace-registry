/**
 * Logger Configuration
 */
interface LoggerConfig {
  level: LogLevel;
  enableTimestamps: boolean;
  enableColors: boolean;
  prefix?: string;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

/**
 * Logger utility for consistent, environment-aware logging
 *
 * Features:
 * - Environment-aware logging (debug logs off in production)
 * - Configurable log levels
 * - Consistent formatting with prefixes and timestamps
 * - Color-coded output for better readability
 *
 * @example
 * ```ts
 * import { logger } from '@/utils/logger';
 *
 * logger.debug('Detailed debug info', { someData });
 * logger.info('General information');
 * logger.warn('Warning message');
 * logger.error('Error occurred', error);
 * ```
 */

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      enableTimestamps: process.env.NODE_ENV !== 'test',
      enableColors: process.env.NODE_ENV !== 'test',
      ...config,
    };
  }

  /**
   * Check if a log level should be printed based on current configuration
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'none'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex && this.config.level !== 'none';
  }

  /**
   * Format log message with timestamp and prefix
   */
  private formatMessage(level: LogLevel, message: string): string {
    const parts: string[] = [];

    if (this.config.enableTimestamps) {
      const timestamp = new Date().toISOString();
      parts.push(timestamp);
    }

    parts.push(`[${level.toUpperCase()}]`);

    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
    }

    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Colorize log message based on level (terminal only)
   */
  private colorize(level: LogLevel, message: string): string {
    if (!this.config.enableColors || typeof window !== 'undefined') {
      return message;
    }

    const colors: Record<Exclude<LogLevel, 'none'>, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';

    if (level === 'none') return message;

    return `${colors[level]}${message}${reset}`;
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('debug')) return;

    const formatted = this.formatMessage('debug', message);
    const colored = this.colorize('debug', formatted);

    if (typeof window !== 'undefined') {
      // Browser environment
      console.log(colored, ...args);
    } else {
      // Node.js environment
      console.log(colored, ...args);
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('info')) return;

    const formatted = this.formatMessage('info', message);
    const colored = this.colorize('info', formatted);

    console.log(colored, ...args);
  }

  /**
   * Log warning messages
   */
  warn(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('warn')) return;

    const formatted = this.formatMessage('warn', message);
    const colored = this.colorize('warn', formatted);

    console.warn(colored, ...args);
  }

  /**
   * Log error messages
   */
  error(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('error')) return;

    const formatted = this.formatMessage('error', message);
    const colored = this.colorize('error', formatted);

    console.error(colored, ...args);
  }

  /**
   * Create a child logger with a specific prefix
   */
  withPrefix(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix,
    });
  }

  /**
   * Update logger configuration
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a named logger with a prefix
 *
 * @example
 * ```ts
 * const serviceLogger = createLogger('MyService');
 * serviceLogger.info('Service initialized');
 * // Output: [2024-01-15T10:30:00.000Z] [INFO] [MyService] Service initialized
 * ```
 */
export function createLogger(prefix: string): Logger {
  return logger.withPrefix(prefix);
}

/**
 * Set the global log level
 *
 * @example
 * ```ts
 * setLogLevel('warn'); // Only warn and error will be logged
 * ```
 */
export function setLogLevel(level: LogLevel): void {
  logger.setConfig({ level });
}

/**
 * Enable or disable timestamps in logs
 */
export function setLogTimestamps(enabled: boolean): void {
  logger.setConfig({ enableTimestamps: enabled });
}
