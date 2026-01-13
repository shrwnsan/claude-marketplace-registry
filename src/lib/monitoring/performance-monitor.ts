/**
 * Performance monitoring system for Ecosystem Statistics
 * Tracks component performance, API response times, and user interactions
 */

interface PerformanceMetrics {
  componentLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  interactionTime: number;
  errorRate: number;
  memoryUsage: number;
  bundleSize: number;
}

interface PerformanceEvent {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceEvent[]> = new Map();
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean = false;

  constructor() {
    this.isEnabled = typeof window !== 'undefined' &&
                   'performance' in window &&
                   'PerformanceObserver' in window;

    if (this.isEnabled) {
      this.initializeObservers();
    }
  }

  /**
   * Initialize performance observers for various metrics
   */
  private initializeObservers(): void {
    // Observer for navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric('navigation', navEntry.loadEventEnd - navEntry.fetchStart, {
                type: 'page_load',
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              });
            }
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (error) {
        console.warn('Navigation observer not supported:', error);
      }

      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              this.recordMetric('resource', entry.duration, {
                name: entry.name,
                type: this.getResourceType(entry.name),
                size: (entry as any).transferSize || 0,
              });
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported:', error);
      }

      try {
        const measureObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure') {
              this.recordMetric('custom', entry.duration, {
                name: entry.name,
                startTime: entry.startTime,
              });
            }
          }
        });
        measureObserver.observe({ entryTypes: ['measure'] });
        this.observers.push(measureObserver);
      } catch (error) {
        console.warn('Measure observer not supported:', error);
      }
    }
  }

  /**
   * Record a custom performance metric
   */
  public recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const event: PerformanceEvent = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const events = this.metrics.get(name)!;
    events.push(event);

    // Keep only last 100 events per metric to prevent memory leaks
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendMetric(event);
    }
  }

  /**
   * Measure component load time
   */
  public measureComponentLoad(componentName: string, renderStart: number): void {
    const renderTime = performance.now() - renderStart;
    this.recordMetric(`component_load_${componentName}`, renderTime, {
      component: componentName,
      timestamp: Date.now(),
    });
  }

  /**
   * Measure API response time
   */
  public measureApiCall(endpoint: string, startTime: number, status: number): void {
    const responseTime = performance.now() - startTime;
    this.recordMetric('api_response', responseTime, {
      endpoint,
      status,
      success: status >= 200 && status < 300,
    });

    // Track error rates
    if (status >= 400) {
      this.recordMetric('api_error', 1, {
        endpoint,
        status,
      });
    }
  }

  /**
   * Measure user interaction
   */
  public measureInteraction(interactionType: string, startTime: number): void {
    const interactionTime = performance.now() - startTime;
    this.recordMetric('user_interaction', interactionTime, {
      interactionType,
      timestamp: Date.now(),
    });
  }

  /**
   * Get current memory usage
   */
  public getMemoryUsage(): number | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / memory.totalJSHeapSize;
    }
    return null;
  }

  /**
   * Record bundle size metrics
   */
  public recordBundleSize(bundleName: string, size: number): void {
    this.recordMetric('bundle_size', size, {
      bundle: bundleName,
      type: 'bytes',
    });
  }

  /**
   * Get performance summary for a specific metric
   */
  public getMetricSummary(metricName: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    median: number;
  } | null {
    const events = this.metrics.get(metricName);
    if (!events || events.length === 0) {
      return null;
    }

    const values = events.map(event => event.value).sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / count;
    const min = values[0];
    const max = values[count - 1];
    const median = count % 2 === 0
      ? (values[count / 2 - 1] + values[count / 2]) / 2
      : values[Math.floor(count / 2)];

    return {
      count,
      average,
      min,
      max,
      median,
    };
  }

  /**
   * Get all metrics for sending to monitoring service
   */
  public getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [metricName, events] of this.metrics.entries()) {
      result[metricName] = {
        events,
        summary: this.getMetricSummary(metricName),
      };
    }

    return result;
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('api/')) return 'api';
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'image';
    return 'other';
  }

  /**
   * Send metric to monitoring service
   */
  private sendMetric(event: PerformanceEvent): void {
    try {
      // Send to analytics service (e.g., Google Analytics, DataDog, etc.)
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'performance_metric', {
          custom_parameter: {
            metric_name: event.name,
            metric_value: event.value,
            metadata: JSON.stringify(event.metadata || {}),
          },
        });
      }

      // Send to custom monitoring endpoint
      if (process.env.NEXT_PUBLIC_MONITORING_ENDPOINT) {
        fetch(process.env.NEXT_PUBLIC_MONITORING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: Date.now(),
          }),
        }).catch(error => {
          console.warn('Failed to send performance data:', error);
        });
      }
    } catch (error) {
      console.warn('Error sending performance metric:', error);
    }
  }

  /**
   * Create performance mark for later measurement
   */
  public mark(name: string): void {
    if (this.isEnabled && 'mark' in performance) {
      performance.mark(name);
    }
  }

  /**
   * Measure time between two marks
   */
  public measure(name: string, startMark: string, endMark?: string): void {
    if (this.isEnabled && 'measure' in performance) {
      try {
        if (endMark) {
          performance.measure(name, startMark, endMark);
        } else {
          performance.measure(name, startMark);
        }
      } catch (error) {
        console.warn(`Failed to measure ${name}:`, error);
      }
    }
  }

  /**
   * Cleanup observers
   */
  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for easy usage
export const startComponentMeasure = (componentName: string) => {
  const markName = `component_${componentName}_start`;
  performanceMonitor.mark(markName);
  return performance.now();
};

export const endComponentMeasure = (componentName: string, startTime: number) => {
  const markName = `component_${componentName}_end`;
  performanceMonitor.mark(markName);
  performanceMonitor.measure(`component_${componentName}`, `component_${componentName}_start`, markName);
  performanceMonitor.measureComponentLoad(componentName, startTime);
};

export const measureApiCall = (endpoint: string, apiCall: () => Promise<any>) => {
  const startTime = performance.now();

  return apiCall().then(response => {
    performanceMonitor.measureApiCall(endpoint, startTime, 200); // Assume success
    return response;
  }).catch(error => {
    performanceMonitor.measureApiCall(endpoint, startTime, error.status || 500);
    throw error;
  });
};

export default performanceMonitor;