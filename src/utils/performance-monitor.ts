import { performance } from 'perf_hooks';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: Date;
  tags?: Record<string, string>;
}

interface PerformanceReport {
  timestamp: Date;
  metrics: PerformanceMetric[];
  summary: {
    totalMetrics: number;
    averageResponseTime?: number;
    memoryUsage?: NodeJS.MemoryUsage;
    errorCount: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private startTime: number = Date.now();
  private timers: Map<string, number> = new Map();

  // Start timing an operation
  startTimer(name: string, tags?: Record<string, string>): void {
    this.timers.set(name, performance.now());
    if (tags) {
      console.log(`⏱️ Started timer: ${name}`, tags);
    } else {
      console.log(`⏱️ Started timer: ${name}`);
    }
  }

  // End timing an operation and record the duration
  endTimer(name: string, tags?: Record<string, string>): number {
    const startTime = this.timers.get(name);
    if (startTime === undefined) {
      console.warn(`⚠️ Timer '${name}' was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.recordMetric(name, duration, 'ms', tags);
    this.timers.delete(name);

    console.log(`⏱️ Timer '${name}' completed in ${duration.toFixed(2)}ms`);
    return duration;
  }

  // Record a metric
  recordMetric(
    name: string,
    value: number,
    unit: PerformanceMetric['unit'],
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
    };

    this.metrics.push(metric);

    // Log warning for slow operations
    if (unit === 'ms' && value > 1000) {
      console.warn(`🐌 Slow operation detected: ${name} took ${value.toFixed(2)}ms`);
    }

    // Log warning for high memory usage
    if (unit === 'percentage' && value > 80) {
      console.warn(`🔥 High memory usage: ${name} at ${value}%`);
    }
  }

  // Record API call performance
  recordApiCall(endpoint: string, method: string, responseTime: number, statusCode: number): void {
    this.recordMetric('api_call_duration', responseTime, 'ms', {
      endpoint,
      method,
      status_code: statusCode.toString(),
      success: (statusCode < 400).toString(),
    });

    if (statusCode >= 400) {
      this.recordMetric('api_error_count', 1, 'count', {
        endpoint,
        method,
        status_code: statusCode.toString(),
      });
    }
  }

  // Record memory usage
  recordMemoryUsage(): void {
    const memUsage = process.memoryUsage();

    this.recordMetric('memory_heap_used', memUsage.heapUsed, 'bytes');
    this.recordMetric('memory_heap_total', memUsage.heapTotal, 'bytes');
    this.recordMetric('memory_external', memUsage.external, 'bytes');
    this.recordMetric('memory_rss', memUsage.rss, 'bytes');

    const heapUsedPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    this.recordMetric('memory_heap_used_percentage', heapUsedPercentage, 'percentage');
  }

  // Record database operation performance
  recordDatabaseOperation(operation: string, duration: number, success: boolean): void {
    this.recordMetric('db_operation_duration', duration, 'ms', {
      operation,
      success: success.toString(),
    });

    if (!success) {
      this.recordMetric('db_error_count', 1, 'count', { operation });
    }
  }

  // Record GitHub API usage
  recordGitHubApiCall(endpoint: string, responseTime: number, rateLimitRemaining?: number): void {
    this.recordMetric('github_api_duration', responseTime, 'ms', {
      endpoint,
    });

    if (rateLimitRemaining !== undefined) {
      this.recordMetric('github_rate_limit_remaining', rateLimitRemaining, 'count');
    }
  }

  // Measure a function execution time
  async measureFunction<T>(
    name: string,
    fn: () => Promise<T> | T,
    tags?: Record<string, string>
  ): Promise<T> {
    this.startTimer(name, tags);

    try {
      const result = await fn();
      this.endTimer(name, { ...tags, success: 'true' });
      return result;
    } catch (error) {
      this.endTimer(name, {
        ...tags,
        success: 'false',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.recordMetric('function_error_count', 1, 'count', { name, ...tags });
      throw error;
    }
  }

  // Get performance report
  getReport(): PerformanceReport {
    const now = new Date();
    const memoryUsage = process.memoryUsage();

    // Calculate metrics summary
    const apiCallMetrics = this.metrics.filter((m) => m.name === 'api_call_duration');
    const averageResponseTime =
      apiCallMetrics.length > 0
        ? apiCallMetrics.reduce((sum, m) => sum + m.value, 0) / apiCallMetrics.length
        : undefined;

    const errorMetrics = this.metrics.filter((m) => m.name.includes('error_count'));
    const errorCount = errorMetrics.reduce((sum, m) => sum + m.value, 0);

    return {
      timestamp: now,
      metrics: [...this.metrics],
      summary: {
        totalMetrics: this.metrics.length,
        averageResponseTime,
        memoryUsage,
        errorCount,
      },
    };
  }

  // Get metrics by name
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  // Get metrics by tag
  getMetricsByTag(tagName: string, tagValue: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.tags && m.tags[tagName] === tagValue);
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = [];
    this.startTime = Date.now();
    console.log('🧹 Performance metrics cleared');
  }

  // Get uptime in seconds
  getUptime(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  // Create middleware for Express/Next.js
  createMiddleware() {
    return (req: any, res: any, next: any) => {
      const startTime = performance.now();
      const method = req.method;
      const url = req.url;

      res.on('finish', () => {
        const responseTime = performance.now() - startTime;
        const statusCode = res.statusCode;

        this.recordApiCall(url, method, responseTime, statusCode);

        // Log slow requests
        if (responseTime > 1000) {
          console.warn(
            `🐌 Slow request: ${method} ${url} - ${responseTime.toFixed(2)}ms (${statusCode})`
          );
        }
      });

      next();
    };
  }

  // Export metrics in Prometheus format
  exportPrometheusMetrics(): string {
    const metricsByType = new Map<string, PerformanceMetric[]>();

    // Group metrics by name
    this.metrics.forEach((metric) => {
      if (!metricsByType.has(metric.name)) {
        metricsByType.set(metric.name, []);
      }
      metricsByType.get(metric.name)!.push(metric);
    });

    let prometheusOutput = '';

    // Convert each metric type to Prometheus format
    metricsByType.forEach((metrics, name) => {
      const latestMetric = metrics[metrics.length - 1]; // Use latest value

      // Sanitize metric name for Prometheus
      const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, '_');

      // Add metric with type
      let metricType = 'gauge';
      if (name.includes('duration') || name.includes('time')) {
        metricType = 'histogram';
      } else if (name.includes('count')) {
        metricType = 'counter';
      }

      prometheusOutput += `# TYPE claude_marketplace_${sanitizedName} ${metricType}\n`;

      // Add labels if present
      let labels = '';
      if (latestMetric.tags) {
        const labelPairs = Object.entries(latestMetric.tags)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',');
        labels = `{${labelPairs}}`;
      }

      // Convert units if needed
      let value = latestMetric.value;
      if (latestMetric.unit === 'bytes' && value > 1024 * 1024) {
        value = value / (1024 * 1024); // Convert to MB
      } else if (latestMetric.unit === 'percentage') {
        value = value / 100; // Convert to decimal
      }

      prometheusOutput += `claude_marketplace_${sanitizedName}${labels} ${value}\n\n`;
    });

    // Add system metrics
    const memoryUsage = process.memoryUsage();
    prometheusOutput += `# TYPE nodejs_memory_usage_bytes gauge\n`;
    prometheusOutput += `nodejs_memory_usage_bytes{type="heap_used"} ${memoryUsage.heapUsed}\n`;
    prometheusOutput += `nodejs_memory_usage_bytes{type="heap_total"} ${memoryUsage.heapTotal}\n`;
    prometheusOutput += `nodejs_memory_usage_bytes{type="external"} ${memoryUsage.external}\n`;
    prometheusOutput += `nodejs_memory_usage_bytes{type="rss"} ${memoryUsage.rss}\n\n`;

    prometheusOutput += `# TYPE nodejs_process_uptime_seconds gauge\n`;
    prometheusOutput += `nodejs_process_uptime_seconds ${this.getUptime()}\n`;

    return prometheusOutput;
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export utility functions
export const startTimer = (name: string, tags?: Record<string, string>) =>
  performanceMonitor.startTimer(name, tags);

export const endTimer = (name: string, tags?: Record<string, string>) =>
  performanceMonitor.endTimer(name, tags);

export const recordMetric = (
  name: string,
  value: number,
  unit: PerformanceMetric['unit'],
  tags?: Record<string, string>
) => performanceMonitor.recordMetric(name, value, unit, tags);

export const measureFunction = async <T>(
  name: string,
  fn: () => Promise<T> | T,
  tags?: Record<string, string>
) => performanceMonitor.measureFunction(name, fn, tags);

export default performanceMonitor;
