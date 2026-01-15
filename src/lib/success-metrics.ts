/**
 * Success Metrics and Automated Reporting System
 * Tracks key performance indicators and generates automated reports
 */

interface SuccessMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  category: 'performance' | 'engagement' | 'quality' | 'business';
  trend: 'up' | 'down' | 'stable';
  status: 'on-track' | 'at-risk' | 'critical';
  description: string;
}

interface MetricThreshold {
  name: string;
  target: number;
  warning: number;
  critical: number;
  unit: string;
}

interface ReportData {
  timestamp: string;
  metrics: SuccessMetric[];
  summary: {
    totalMetrics: number;
    onTrack: number;
    atRisk: number;
    critical: number;
    overallScore: number;
  };
  recommendations: string[];
}

interface AutomatedReportConfig {
  enabled: boolean;
  schedule: string; // Cron expression
  recipients: string[];
  channels: ('email' | 'slack' | 'webhook')[];
  includeRecommendations: boolean;
  thresholdAlerts: boolean;
}

class SuccessMetricsTracker {
  private metrics: Map<string, SuccessMetric[]> = new Map();
  private thresholds: Map<string, MetricThreshold> = new Map();
  private config: AutomatedReportConfig;
  private reportInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<AutomatedReportConfig>) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      schedule: '0 9 * * 1-5', // 9 AM Monday-Friday
      recipients: process.env.SUCCESS_METRICS_RECIPIENTS?.split(',') || [],
      channels: ['email'],
      includeRecommendations: true,
      thresholdAlerts: true,
      ...config,
    };

    this.initializeThresholds();
    this.startTracking();
  }

  /**
   * Initialize metric thresholds based on PRD goals
   */
  private initializeThresholds(): void {
    const thresholds: MetricThreshold[] = [
      // Performance Metrics
      {
        name: 'page_load_time',
        target: 2000, // 2 seconds
        warning: 3000,
        critical: 5000,
        unit: 'ms',
      },
      {
        name: 'api_response_time',
        target: 200, // 200ms
        warning: 500,
        critical: 1000,
        unit: 'ms',
      },
      {
        name: 'ecosystem_health_score',
        target: 85,
        warning: 70,
        critical: 50,
        unit: 'score',
      },

      // Engagement Metrics
      {
        name: 'session_duration',
        target: 180, // 3 minutes
        warning: 120,
        critical: 60,
        unit: 'seconds',
      },
      {
        name: 'bounce_rate',
        target: 40, // 40%
        warning: 60,
        critical: 80,
        unit: 'percentage',
      },
      {
        name: 'feature_adoption_rate',
        target: 30, // 30%
        warning: 20,
        critical: 10,
        unit: 'percentage',
      },

      // Quality Metrics
      {
        name: 'test_coverage',
        target: 90,
        warning: 80,
        critical: 70,
        unit: 'percentage',
      },
      {
        name: 'error_rate',
        target: 2, // 2%
        warning: 5,
        critical: 10,
        unit: 'percentage',
      },
      {
        name: 'plugin_verification_rate',
        target: 70,
        warning: 50,
        critical: 30,
        unit: 'percentage',
      },

      // Business Metrics
      {
        name: 'ecosystem_growth_rate',
        target: 15, // 15% monthly
        warning: 10,
        critical: 5,
        unit: 'percentage',
      },
      {
        name: 'developer_retention',
        target: 80, // 80%
        warning: 60,
        critical: 40,
        unit: 'percentage',
      },
    ];

    thresholds.forEach((threshold) => {
      this.thresholds.set(threshold.name, threshold);
    });
  }

  /**
   * Start tracking metrics
   */
  private startTracking(): void {
    if (!this.config.enabled) return;

    // Set up automated reporting schedule
    if (this.config.schedule && this.config.recipients.length > 0) {
      this.scheduleReports();
    }

    // Start real-time monitoring
    this.monitorRealTimeMetrics();
  }

  /**
   * Record a metric value
   */
  public recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const threshold = this.thresholds.get(name);
    if (!threshold) return;

    const previousMetric = this.getLastMetric(name);
    const trend = this.calculateTrend(previousMetric, value);

    const metric: SuccessMetric = {
      name,
      value,
      target: threshold.target,
      unit: threshold.unit,
      category: this.getMetricCategory(name),
      trend,
      status: this.calculateStatus(value, threshold),
      description: this.generateMetricDescription(name, value, threshold),
    };

    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);

    // Keep only last 100 values per metric
    const metrics = this.metrics.get(name)!;
    if (metrics.length > 100) {
      this.metrics.set(name, metrics.slice(-100));
    }

    // Check threshold alerts
    if (this.config.thresholdAlerts) {
      this.checkThresholdAlerts(metric);
    }
  }

  /**
   * Get the most recent metric value
   */
  private getLastMetric(name: string): SuccessMetric | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return null;
    return metrics[metrics.length - 1];
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(
    previous: SuccessMetric | null,
    current: number
  ): 'up' | 'down' | 'stable' {
    if (!previous) return 'stable';

    const change = current - previous.value;
    const changePercent = Math.abs(change / previous.value) * 100;

    if (changePercent < 2) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  /**
   * Calculate metric status based on thresholds
   */
  private calculateStatus(
    value: number,
    threshold: MetricThreshold
  ): 'on-track' | 'at-risk' | 'critical' {
    if (value <= threshold.target) return 'on-track';
    if (value <= threshold.warning) return 'at-risk';
    return 'critical';
  }

  /**
   * Get metric category
   */
  private getMetricCategory(name: string): SuccessMetric['category'] {
    if (['page_load_time', 'api_response_time'].includes(name)) return 'performance';
    if (['session_duration', 'bounce_rate', 'feature_adoption_rate'].includes(name))
      return 'engagement';
    if (['test_coverage', 'error_rate', 'plugin_verification_rate'].includes(name))
      return 'quality';
    return 'business';
  }

  /**
   * Generate human-readable metric description
   */
  private generateMetricDescription(
    name: string,
    value: number,
    threshold: MetricThreshold
  ): string {
    const unit = threshold.unit;
    const target = threshold.target;

    switch (name) {
      case 'page_load_time':
        return `Page load time is ${value}${unit} (target: <${target}${unit})`;
      case 'api_response_time':
        return `API response time is ${value}${unit} (target: <${target}${unit})`;
      case 'ecosystem_health_score':
        return `Ecosystem health score is ${value}/${target}`;
      case 'session_duration':
        return `Average session duration is ${Math.round(value / 60)}min (target: ${Math.round(target / 60)}min)`;
      case 'bounce_rate':
        return `Bounce rate is ${value}% (target: <${target}%)`;
      default:
        return `${name} is ${value}${unit} (target: ${target}${unit})`;
    }
  }

  /**
   * Check if threshold alerts should be triggered
   */
  private checkThresholdAlerts(metric: SuccessMetric): void {
    if (metric.status === 'critical') {
      this.sendThresholdAlert(metric);
    }
  }

  /**
   * Send threshold alert to configured channels
   */
  private async sendThresholdAlert(metric: SuccessMetric): Promise<void> {
    const alertMessage = `🚨 CRITICAL ALERT: ${metric.name} is ${metric.status}
${metric.description}`;

    const alertData = {
      metric: metric.name,
      status: metric.status,
      value: metric.value,
      target: metric.target,
      description: metric.description,
      timestamp: new Date().toISOString(),
    };

    // Send to configured channels
    const promises = this.config.channels.map((channel) => {
      switch (channel) {
        case 'email':
          return this.sendEmailAlert(alertMessage, alertData);
        case 'slack':
          return this.sendSlackAlert(alertMessage, alertData);
        case 'webhook':
          return this.sendWebhookAlert(alertData);
        default:
          return Promise.resolve();
      }
    });

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Failed to send threshold alerts:', error);
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(message: string, data: any): Promise<void> {
    if (!process.env.EMAIL_SERVICE_API_KEY) return;

    try {
      await fetch(process.env.EMAIL_SERVICE_API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: this.config.recipients,
          subject: `Critical Alert: ${data.metric}`,
          text: message,
          html: `
            <h2>🚨 Critical Metric Alert</h2>
            <p><strong>Metric:</strong> ${data.metric}</p>
            <p><strong>Status:</strong> ${data.status}</p>
            <p><strong>Value:</strong> ${data.value}</p>
            <p><strong>Target:</strong> ${data.target}</p>
            <p><strong>Description:</strong> ${data.description}</p>
            <p><strong>Timestamp:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
          `,
        }),
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(message: string, data: any): Promise<void> {
    if (!process.env.SLACK_WEBHOOK_URL) return;

    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
          attachments: [
            {
              color: data.status === 'critical' ? 'danger' : 'warning',
              fields: [
                {
                  title: 'Metric',
                  value: data.metric,
                  short: true,
                },
                {
                  title: 'Status',
                  value: data.status,
                  short: true,
                },
                {
                  title: 'Value',
                  value: data.value,
                  short: true,
                },
                {
                  title: 'Target',
                  value: data.target,
                  short: true,
                },
              ],
              timestamp: data.timestamp,
            },
          ],
        }),
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(data: any): Promise<void> {
    if (!process.env.WEBHOOK_ALERT_URL) return;

    try {
      await fetch(process.env.WEBHOOK_ALERT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'threshold_alert',
          data,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  /**
   * Monitor real-time metrics
   */
  private monitorRealTimeMetrics(): void {
    // Monitor page performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart);
          }
        }
      });
      observer.observe({ entryTypes: ['navigation'] });
    }

    // Monitor API response times
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = Date.now();
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - start;
        this.recordMetric('api_response_time', duration);
        return response;
      } catch (error) {
        this.recordMetric('api_response_time', Date.now() - start);
        throw error;
      }
    };
  }

  /**
   * Schedule automated reports
   */
  private scheduleReports(): void {
    // In a real implementation, this would use a cron job scheduler
    // For now, we'll simulate with setInterval (24 hours)
    this.reportInterval = setInterval(
      async () => {
        await this.generateAndSendReport();
      },
      24 * 60 * 60 * 1000
    ); // 24 hours
  }

  /**
   * Generate and send automated report
   */
  private async generateAndSendReport(): Promise<void> {
    try {
      const report = this.generateReport();

      // Send to all configured channels
      const promises = this.config.channels.map((channel) => {
        switch (channel) {
          case 'email':
            return this.sendEmailReport(report);
          case 'slack':
            return this.sendSlackReport(report);
          case 'webhook':
            return this.sendWebhookReport(report);
          default:
            return Promise.resolve();
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Failed to generate/send report:', error);
    }
  }

  /**
   * Generate comprehensive report
   */
  private generateReport(): ReportData {
    const allMetrics: SuccessMetric[] = [];
    const latestMetrics: SuccessMetric[] = [];

    // Collect latest values for each metric
    for (const [name, metrics] of this.metrics.entries()) {
      if (metrics.length > 0) {
        const latest = metrics[metrics.length - 1];
        allMetrics.push(...metrics);
        latestMetrics.push(latest);
      }
    }

    // Calculate summary
    const onTrack = latestMetrics.filter((m) => m.status === 'on-track').length;
    const atRisk = latestMetrics.filter((m) => m.status === 'at-risk').length;
    const critical = latestMetrics.filter((m) => m.status === 'critical').length;

    const overallScore =
      latestMetrics.length > 0 ? Math.round((onTrack / latestMetrics.length) * 100) : 0;

    return {
      timestamp: new Date().toISOString(),
      metrics: latestMetrics,
      summary: {
        totalMetrics: latestMetrics.length,
        onTrack,
        atRisk,
        critical,
        overallScore,
      },
      recommendations: this.generateRecommendations(latestMetrics),
    };
  }

  /**
   * Generate recommendations based on metrics
   */
  private generateRecommendations(metrics: SuccessMetric[]): string[] {
    const recommendations: string[] = [];

    // Analyze critical metrics
    const criticalMetrics = metrics.filter((m) => m.status === 'critical');

    for (const metric of criticalMetrics) {
      switch (metric.name) {
        case 'page_load_time':
          recommendations.push(
            '⚡ Optimize page load time by implementing code splitting and lazy loading'
          );
          break;
        case 'api_response_time':
          recommendations.push(
            '🔧 Improve API response times by optimizing database queries and implementing caching'
          );
          break;
        case 'test_coverage':
          recommendations.push(
            '🧪 Increase test coverage by adding more unit and integration tests'
          );
          break;
        case 'error_rate':
          recommendations.push(
            '🐛 Reduce error rate by improving error handling and adding more comprehensive testing'
          );
          break;
        case 'bounce_rate':
          recommendations.push(
            '📱 Reduce bounce rate by improving page performance and user engagement'
          );
          break;
        case 'ecosystem_health_score':
          recommendations.push(
            '🏥 Improve ecosystem health by addressing quality metrics and developer retention'
          );
          break;
        default:
          recommendations.push(`📊 Address ${metric.name} to improve overall performance`);
      }
    }

    return recommendations;
  }

  /**
   * Send email report
   */
  private async sendEmailReport(report: ReportData): Promise<void> {
    if (!process.env.EMAIL_SERVICE_API_KEY || this.config.recipients.length === 0) return;

    const htmlContent = this.generateHtmlReport(report);

    try {
      await fetch(process.env.EMAIL_SERVICE_API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: this.config.recipients,
          subject: `Ecosystem Statistics Report - ${new Date().toLocaleDateString()}`,
          html: htmlContent,
          text: JSON.stringify(report, null, 2),
        }),
      });
    } catch (error) {
      console.error('Failed to send email report:', error);
    }
  }

  /**
   * Generate HTML report content
   */
  private generateHtmlReport(report: ReportData): string {
    const { metrics, summary, recommendations } = report;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ecosystem Statistics Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
          h2 { color: #555; margin-top: 30px; }
          .metric { margin: 15px 0; padding: 15px; border-left: 4px solid #ddd; }
          .metric.on-track { border-left-color: #28a745; }
          .metric.at-risk { border-left-color: #ffc107; }
          .metric.critical { border-left-color: #dc3545; }
          .summary { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .recommendations { background: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📊 Ecosystem Statistics Report</h1>
          <p><strong>Date:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
          <p><strong>Overall Score:</strong> ${summary.overallScore}/100</p>

          <div class="summary">
            <h2>📈 Summary</h2>
            <p><strong>Total Metrics:</strong> ${summary.totalMetrics}</p>
            <p><strong>On Track:</strong> ${summary.onTrack} ✅</p>
            <p><strong>At Risk:</strong> ${summary.atRisk} ⚠️</p>
            <p><strong>Critical:</strong> ${summary.critical} 🚨</p>
          </div>

          <h2>📊 Detailed Metrics</h2>
          ${metrics
            .map(
              (metric) => `
            <div class="metric ${metric.status}">
              <h3>${metric.name}</h3>
              <p><strong>Value:</strong> ${metric.value} ${metric.unit}</p>
              <p><strong>Target:</strong> ${metric.target} ${metric.unit}</p>
              <p><strong>Status:</strong> ${metric.status}</p>
              <p><strong>Description:</strong> ${metric.description}</p>
            </div>
          `
            )
            .join('')}

          ${
            this.config.includeRecommendations && recommendations.length > 0
              ? `
            <div class="recommendations">
              <h2>💡 Recommendations</h2>
              <ul>
                ${recommendations.map((rec) => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
          `
              : ''
          }
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send Slack report
   */
  private async sendSlackReport(report: ReportData): Promise<void> {
    if (!process.env.SLACK_WEBHOOK_URL) return;

    const { summary, recommendations } = report;

    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `📊 Daily Ecosystem Statistics Report
📈 Overall Score: ${summary.overallScore}/100
✅ On Track: ${summary.onTrack}
⚠️ At Risk: ${summary.atRisk}
🚨 Critical: ${summary.critical}`,
          attachments: [
            {
              color:
                summary.overallScore >= 80
                  ? 'good'
                  : summary.overallScore >= 60
                    ? 'warning'
                    : 'danger',
              fields: [
                {
                  title: 'Date',
                  value: new Date(report.timestamp).toLocaleDateString(),
                  short: true,
                },
                {
                  title: 'Overall Score',
                  value: `${summary.overallScore}/100`,
                  short: true,
                },
              ],
            },
          ],
        }),
      });
    } catch (error) {
      console.error('Failed to send Slack report:', error);
    }
  }

  /**
   * Send webhook report
   */
  private async sendWebhookReport(report: ReportData): Promise<void> {
    if (!process.env.WEBHOOK_REPORT_URL) return;

    try {
      await fetch(process.env.WEBHOOK_REPORT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'daily_report',
          report,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to send webhook report:', error);
    }
  }

  /**
   * Get current metrics summary
   */
  public getCurrentMetrics(): SuccessMetric[] {
    const latestMetrics: SuccessMetric[] = [];

    for (const [name, metrics] of this.metrics.entries()) {
      if (metrics.length > 0) {
        latestMetrics.push(metrics[metrics.length - 1]);
      }
    }

    return latestMetrics;
  }

  /**
   * Get metrics for specific category
   */
  public getMetricsByCategory(category: SuccessMetric['category']): SuccessMetric[] {
    const latestMetrics: SuccessMetric[] = [];

    for (const [name, metrics] of this.metrics.entries()) {
      if (metrics.length > 0) {
        const latest = metrics[metrics.length - 1];
        if (latest.category === category) {
          latestMetrics.push(latest);
        }
      }
    }

    return latestMetrics;
  }

  /**
   * Stop tracking and clean up
   */
  public stop(): void {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
  }
}

// Export singleton instance
export const successMetricsTracker = new SuccessMetricsTracker();

// Utility functions
export const recordPageLoadTime = (loadTime: number) => {
  successMetricsTracker.recordMetric('page_load_time', loadTime);
};

export const recordApiResponseTime = (responseTime: number) => {
  successMetricsTracker.recordMetric('api_response_time', responseTime);
};

export const recordEcosystemHealthScore = (score: number) => {
  successMetricsTracker.recordMetric('ecosystem_health_score', score);
};

export const recordCustomMetric = (name: string, value: number, target: number, unit: string) => {
  successMetricsTracker.recordMetric(name, value, { target, unit });
};

export default successMetricsTracker;
