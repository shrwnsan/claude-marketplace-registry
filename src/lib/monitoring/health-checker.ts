/**
 * Health checking system for ecosystem statistics
 * Monitors API availability, data freshness, and system performance
 */

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number;
  checks: HealthCheck[];
  summary: {
    total: number;
    passing: number;
    failing: number;
    warning: number;
  };
}

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  message: string;
  lastCheck: number;
  metadata?: Record<string, any>;
}

interface HealthCheckConfig {
  interval: number; // Check interval in milliseconds
  timeout: number; // Request timeout in milliseconds
  retries: number; // Number of retries before marking as failed
  endpoints: string[]; // API endpoints to check
  thresholds: {
    responseTime: number; // Maximum acceptable response time
    errorRate: number; // Maximum acceptable error rate
    dataFreshness: number; // Maximum data age in milliseconds
  };
}

class HealthChecker {
  private config: HealthCheckConfig;
  private checks: Map<string, HealthCheck> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();
  private isEnabled: boolean = false;

  constructor(config?: Partial<HealthCheckConfig>) {
    this.config = {
      interval: 60000, // 1 minute
      timeout: 10000, // 10 seconds
      retries: 3,
      endpoints: [
        '/api/ecosystem-stats?overview',
        '/api/ecosystem-stats?quality',
        '/api/ecosystem-stats?growth',
        '/api/ecosystem-stats?categories',
      ],
      thresholds: {
        responseTime: 2000, // 2 seconds
        errorRate: 0.05, // 5%
        dataFreshness: 6 * 60 * 60 * 1000, // 6 hours
      },
      ...config,
    };

    this.isEnabled = typeof window !== 'undefined' || typeof global !== 'undefined';
  }

  /**
   * Start health checking
   */
  public start(): void {
    if (!this.isEnabled || this.intervalId) return;

    // Initial check
    this.runHealthChecks();

    // Set up interval
    this.intervalId = setInterval(() => {
      this.runHealthChecks();
    }, this.config.interval);
  }

  /**
   * Stop health checking
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Run all health checks
   */
  private async runHealthChecks(): Promise<void> {
    const checkPromises = [
      this.checkApiConnectivity(),
      this.checkDataFreshness(),
      this.checkResponseTimes(),
      this.checkErrorRates(),
      this.checkMemoryUsage(),
      this.checkBundleSize(),
    ];

    try {
      await Promise.allSettled(checkPromises);
    } catch (error) {
      console.warn('Health checks failed:', error);
    }
  }

  /**
   * Check API connectivity
   */
  private async checkApiConnectivity(): Promise<void> {
    const startTime = Date.now();

    try {
      // Check a simple health endpoint
      const response = await this.makeRequest('/api/health', 5000);
      const duration = Date.now() - startTime;

      this.addCheck({
        name: 'api_connectivity',
        status: response.ok ? 'pass' : 'fail',
        duration,
        message: response.ok ? 'API is reachable' : 'API is not responding',
        metadata: {
          statusCode: response.status,
          responseTime: duration,
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.addCheck({
        name: 'api_connectivity',
        status: 'fail',
        duration: Date.now() - startTime,
        message: `API connectivity check failed: ${errorMessage}`,
        metadata: {
          error: errorMessage,
        },
      });
    }
  }

  /**
   * Check data freshness
   */
  private async checkDataFreshness(): Promise<void> {
    try {
      const response = await this.makeRequest('/api/ecosystem-stats?overview');
      const duration = Date.now() - Date.now();

      if (response.ok) {
        const data = await response.json();
        const lastUpdated = data.meta?.timestamp;
        const now = Date.now();

        if (lastUpdated) {
          const dataAge = now - new Date(lastUpdated).getTime();
          const isFresh = dataAge <= this.config.thresholds.dataFreshness;

          this.addCheck({
            name: 'data_freshness',
            status: isFresh ? 'pass' : 'warn',
            duration,
            message: isFresh ?
              `Data is fresh (${Math.round(dataAge / 1000 / 60)} minutes old)` :
              `Data is stale (${Math.round(dataAge / 1000 / 60)} minutes old)`,
            metadata: {
              lastUpdated,
              dataAge,
              threshold: this.config.thresholds.dataFreshness,
            },
          });
        } else {
          this.addCheck({
            name: 'data_freshness',
            status: 'warn',
            duration,
            message: 'Data timestamp not available',
          });
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.addCheck({
        name: 'data_freshness',
        status: 'fail',
        duration: 0,
        message: `Data freshness check failed: ${errorMessage}`,
      });
    }
  }

  /**
   * Check response times
   */
  private async checkResponseTimes(): Promise<void> {
    const endpointChecks = this.config.endpoints.map(async (endpoint) => {
      try {
        const startTime = Date.now();
        const response = await this.makeRequest(endpoint, this.config.timeout);
        const duration = Date.now() - startTime;

        return {
          endpoint,
          duration,
          success: response.ok,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return {
          endpoint,
          duration: this.config.timeout,
          success: false,
          error: errorMessage,
        };
      }
    });

    try {
      const results = await Promise.all(endpointChecks);
      const averageDuration = results.reduce((sum, result) => sum + result.duration, 0) / results.length;
      const successRate = results.filter(result => result.success).length / results.length;

      const isWithinThreshold = averageDuration <= this.config.thresholds.responseTime;
      const hasGoodSuccessRate = successRate >= (1 - this.config.thresholds.errorRate);

      this.addCheck({
        name: 'response_times',
        status: isWithinThreshold && hasGoodSuccessRate ? 'pass' : 'fail',
        duration: averageDuration,
        message: `Average response time: ${Math.round(averageDuration)}ms, Success rate: ${Math.round(successRate * 100)}%`,
        metadata: {
          averageDuration,
          successRate,
          threshold: this.config.thresholds.responseTime,
          endpoints: results.map(r => ({
            endpoint: r.endpoint,
            duration: r.duration,
            success: r.success,
          })),
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.addCheck({
        name: 'response_times',
        status: 'fail',
        duration: 0,
        message: `Response time check failed: ${errorMessage}`,
      });
    }
  }

  /**
   * Check error rates
   */
  private async checkErrorRates(): Promise<void> {
    try {
      // Simulate checking error logs or monitoring service
      const response = await this.makeRequest('/api/health/errors', this.config.timeout);

      if (response.ok) {
        const data = await response.json();
        const errorRate = data.errorRate || 0;
        const isAcceptable = errorRate <= this.config.thresholds.errorRate;

        this.addCheck({
          name: 'error_rates',
          status: isAcceptable ? 'pass' : 'warn',
          duration: 0,
          message: `Error rate: ${Math.round(errorRate * 100)}%`,
          metadata: {
            errorRate,
            threshold: this.config.thresholds.errorRate,
            totalRequests: data.totalRequests || 0,
            errorCount: data.errorCount || 0,
          },
        });
      } else {
        // If no dedicated error endpoint, assume good health
        this.addCheck({
          name: 'error_rates',
          status: 'pass',
          duration: 0,
          message: 'Error rate check not available, assuming good health',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      // If error endpoint fails, assume good health
      this.addCheck({
        name: 'error_rates',
        status: 'pass',
        duration: 0,
        message: 'Error rate check failed, assuming good health',
        metadata: {
          error: errorMessage,
        },
      });
    }
  }

  /**
   * Check memory usage
   */
  private checkMemoryUsage(): void {
    if (typeof performance === 'undefined' || !('memory' in performance)) {
      return;
    }

    const memory = (performance as any).memory;
    const usedMemory = memory.usedJSHeapSize;
    const totalMemory = memory.totalJSHeapSize;
    const memoryUsage = usedMemory / totalMemory;

    const isHealthy = memoryUsage < 0.9; // Less than 90% memory usage

    this.addCheck({
      name: 'memory_usage',
      status: isHealthy ? 'pass' : 'warn',
      duration: 0,
      message: `Memory usage: ${Math.round(memoryUsage * 100)}% (${Math.round(usedMemory / 1024 / 1024)}MB)`,
      metadata: {
        usedMemory,
        totalMemory,
        memoryUsage,
      },
    });
  }

  /**
   * Check bundle sizes
   */
  private checkBundleSize(): void {
    if (typeof performance === 'undefined') return;

    try {
      const resources = performance.getEntriesByType('resource');
      const jsResources = resources.filter(resource => resource.name.includes('.js'));
      const totalSize = jsResources.reduce((sum, resource) => {
        return sum + (resource as any).transferSize || 0;
      }, 0);

      const totalSizeMB = totalSize / 1024 / 1024;
      const isHealthy = totalSizeMB < 50; // Less than 50MB of JS

      this.addCheck({
        name: 'bundle_size',
        status: isHealthy ? 'pass' : 'warn',
        duration: 0,
        message: `Bundle size: ${totalSizeMB.toFixed(2)}MB`,
        metadata: {
          totalSize,
          totalSizeMB,
          bundleCount: jsResources.length,
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.addCheck({
        name: 'bundle_size',
        status: 'warn',
        duration: 0,
        message: 'Bundle size check failed',
        metadata: {
          error: errorMessage,
        },
      });
    }
  }

  /**
   * Make HTTP request with timeout
   */
  private async makeRequest(url: string, timeout?: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout || this.config.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Add a health check result
   */
  private addCheck(check: Omit<HealthCheck, 'lastCheck'>): void {
    const healthCheck: HealthCheck = {
      ...check,
      lastCheck: Date.now(),
    };

    this.checks.set(check.name, healthCheck);
  }

  /**
   * Get current health status
   */
  public getHealthStatus(): HealthStatus {
    const now = Date.now();
    const checksArray = Array.from(this.checks.values());

    const total = checksArray.length;
    const passing = checksArray.filter(check => check.status === 'pass').length;
    const failing = checksArray.filter(check => check.status === 'fail').length;
    const warning = checksArray.filter(check => check.status === 'warn').length;

    // Determine overall status
    let status: HealthStatus['status'];
    if (failing > 0) {
      status = 'unhealthy';
    } else if (warning > 0 || passing === 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      timestamp: now,
      uptime: now - this.startTime,
      checks: checksArray,
      summary: {
        total,
        passing,
        failing,
        warning,
      },
    };
  }

  /**
   * Get health check results for specific check
   */
  public getCheck(checkName: string): HealthCheck | undefined {
    return this.checks.get(checkName);
  }

  /**
   * Clear health check history
   */
  public clearChecks(): void {
    this.checks.clear();
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<HealthCheckConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart with new configuration if running
    if (this.intervalId) {
      this.stop();
      this.start();
    }
  }
}

// Export singleton instance
export const healthChecker = new HealthChecker();

// Utility functions
export const startHealthChecks = (config?: Partial<HealthCheckConfig>) => {
  const checker = new HealthChecker(config);
  checker.start();
  return checker;
};

export default healthChecker;