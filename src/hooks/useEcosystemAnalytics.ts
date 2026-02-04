/**
 * Analytics hook for Ecosystem Statistics
 * Tracks user interactions, feature usage, and engagement metrics
 */

import { useRef, useCallback } from 'react';
import { performanceMonitor } from '../lib/monitoring/performance-monitor';
import { errorTracker } from '../lib/monitoring/error-tracker';
import { generateSecureId } from '../utils/crypto';

interface AnalyticsEvent {
  event: string;
  category: 'navigation' | 'interaction' | 'engagement' | 'performance' | 'error';
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: number;
}

interface UserSession {
  id: string;
  startTime: number;
  pageViews: number;
  interactions: number;
  timeSpent: number;
  referrer?: string;
  userAgent: string;
  screenResolution: string;
}

interface UseEcosystemAnalyticsOptions {
  enableTracking?: boolean;
  trackPageViews?: boolean;
  trackInteractions?: boolean;
  trackPerformance?: boolean;
  debug?: boolean;
}

interface EngagementMetrics {
  totalTime: number;
  averageSessionTime: number;
  bounceRate: number;
  featureUsage: Record<string, number>;
  mostUsedFeature: string;
}

class EcosystemAnalytics {
  private sessionId: string;
  private sessionStartTime: number;
  private lastActivity: number;
  private events: AnalyticsEvent[] = [];
  private isEnabled: boolean = false;
  private options: UseEcosystemAnalyticsOptions;
  private pageViewCount: number = 0;
  private interactionCount: number = 0;

  constructor(options: UseEcosystemAnalyticsOptions = {}) {
    this.options = {
      enableTracking: true,
      trackPageViews: true,
      trackInteractions: true,
      trackPerformance: true,
      debug: process.env.NODE_ENV === 'development',
      ...options,
    };

    this.isEnabled = this.options.enableTracking === true && typeof window !== 'undefined';
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.lastActivity = this.sessionStartTime;

    if (this.isEnabled) {
      this.initializeTracking();
    }
  }

  /**
   * Initialize tracking system
   */
  private initializeTracking(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackPageLeave();
      } else {
        this.trackPageEnter();
      }
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd();
    });

    // Track initial page view
    this.trackPageView(window.location.pathname);
  }

  /**
   * Generate unique session ID using cryptographically secure random values
   */
  private generateSessionId(): string {
    const randomPart = generateSecureId(9);
    return `session_${Date.now()}_${randomPart}`;
  }

  /**
   * Track an analytics event
   */
  public track(
    event: string,
    category: AnalyticsEvent['category'],
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      category,
      action,
      label,
      value,
      metadata,
      timestamp: Date.now(),
    };

    this.events.push(analyticsEvent);
    this.lastActivity = Date.now();

    // Log in debug mode
    if (this.options.debug) {
      console.log('[Analytics]', analyticsEvent);
    }

    // Send to analytics service
    this.sendEvent(analyticsEvent);
  }

  /**
   * Track page view
   */
  public trackPageView(path: string, title?: string): void {
    if (!this.isEnabled || !this.options.trackPageViews) return;

    this.pageViewCount++;
    this.track('page_view', 'navigation', 'view', path, undefined, {
      path,
      title: title || document.title,
      referrer: document.referrer,
      timestamp: Date.now(),
    });
  }

  /**
   * Track user interaction with ecosystem statistics
   */
  public trackEcosystemInteraction(action: string, label?: string, value?: number): void {
    if (!this.isEnabled || !this.options.trackInteractions) return;

    this.interactionCount++;
    this.track('ecosystem_interaction', 'interaction', action, label, value, {
      sessionId: this.sessionId,
      interactionNumber: this.interactionCount,
    });
  }

  /**
   * Track chart interactions
   */
  public trackChartInteraction(chartType: string, action: string, _data?: any): void {
    this.trackEcosystemInteraction(`chart_${action}`, chartType);
  }

  /**
   * Track filter usage
   */
  public trackFilterUsage(filterType: string, filterValue: string): void {
    this.trackEcosystemInteraction('filter_use', `${filterType}:${filterValue}`);
  }

  /**
   * Track export functionality
   */
  public trackExport(format: string, _data?: any): void {
    this.trackEcosystemInteraction('export', format);
  }

  /**
   * Track time spent on specific features
   */
  public trackFeatureUsage(feature: string, startTime: number): void {
    const duration = Date.now() - startTime;
    this.trackEcosystemInteraction('feature_time', feature, duration);

    performanceMonitor.recordMetric(`feature_${feature}_time`, duration);
  }

  /**
   * Track errors specific to ecosystem statistics
   */
  public trackEcosystemError(error: Error, context?: Record<string, any>): void {
    errorTracker.trackComponentError('EcosystemStats', error, 'analytics_tracking');

    this.track('ecosystem_error', 'error', error.name, error.message, undefined, {
      errorMessage: error.message,
      stack: error.stack,
      context,
    });
  }

  /**
   * Track general errors
   */
  public trackError(error: Error, context?: Record<string, any>): void {
    this.trackEcosystemError(error, context);
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(name: string, value: number, unit?: string): void {
    if (!this.isEnabled || !this.options.trackPerformance) return;

    this.track('performance', 'performance', name, undefined, value, {
      unit,
    });

    performanceMonitor.recordMetric(`ecosystem_${name}`, value);
  }

  /**
   * Track page enter (when user becomes active)
   */
  private trackPageEnter(): void {
    const inactiveTime = Date.now() - this.lastActivity;
    if (inactiveTime > 30 * 60 * 1000) {
      // 30 minutes
      // Start new session
      this.sessionId = this.generateSessionId();
      this.sessionStartTime = Date.now();
      this.pageViewCount = 0;
      this.interactionCount = 0;
    }

    this.track('page_enter', 'navigation', 'enter', undefined, undefined, {
      inactiveTime,
      sessionId: this.sessionId,
    });
  }

  /**
   * Track page leave
   */
  private trackPageLeave(): void {
    this.track('page_leave', 'navigation', 'leave', undefined, undefined, {
      timeOnPage: Date.now() - this.lastActivity,
      sessionId: this.sessionId,
    });
  }

  /**
   * Track session end
   */
  private trackSessionEnd(): void {
    const sessionDuration = Date.now() - this.sessionStartTime;
    this.track('session_end', 'engagement', 'end', undefined, sessionDuration, {
      sessionId: this.sessionId,
      sessionDuration,
      pageViews: this.pageViewCount,
      interactions: this.interactionCount,
    });
  }

  /**
   * Send event to analytics service
   */
  private sendEvent(event: AnalyticsEvent): void {
    // Send to Google Analytics if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_parameter: event.metadata,
      });
    }

    // Send to custom analytics endpoint
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      try {
        fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...event,
            sessionId: this.sessionId,
            userId: this.getUserId(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          }),
        }).catch((error) => {
          if (this.options.debug) {
            console.warn('[Analytics] Failed to send event:', error);
          }
        });
      } catch {
        // Silently fail to not break user experience
      }
    }
  }

  /**
   * Get or create user ID
   */
  private getUserId(): string | undefined {
    try {
      // Try to get from localStorage
      let userId = localStorage.getItem('ecosystem_user_id');

      if (!userId) {
        // Generate new user ID using cryptographically secure random values
        const randomPart = generateSecureId(9);
        userId = `user_${Date.now()}_${randomPart}`;
        localStorage.setItem('ecosystem_user_id', userId);
      }

      return userId;
    } catch {
      // If localStorage is not available
      return undefined;
    }
  }

  /**
   * Get current session information
   */
  public getSessionInfo(): UserSession {
    return {
      id: this.sessionId,
      startTime: this.sessionStartTime,
      pageViews: this.pageViewCount,
      interactions: this.interactionCount,
      timeSpent: Date.now() - this.sessionStartTime,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
    };
  }

  /**
   * Get engagement metrics
   */
  public getEngagementMetrics(): EngagementMetrics {
    const totalTime = Date.now() - this.sessionStartTime;
    const featureUsage: Record<string, number> = {};

    // Count feature usage from events
    this.events
      .filter((event) => event.category === 'interaction')
      .forEach((event) => {
        const feature = event.label || event.action;
        featureUsage[feature] = (featureUsage[feature] || 0) + 1;
      });

    const mostUsedFeature =
      Object.entries(featureUsage).sort(([, a], [, b]) => b - a)[0]?.[0] || '';

    return {
      totalTime,
      averageSessionTime: totalTime,
      bounceRate: this.pageViewCount <= 1 ? 1 : 0,
      featureUsage,
      mostUsedFeature,
    };
  }

  /**
   * Get all recorded events
   */
  public getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Clear all events
   */
  public clearEvents(): void {
    this.events = [];
  }

  /**
   * Enable or disable tracking
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

// Custom hook for using ecosystem analytics
export const useEcosystemAnalytics = (options: UseEcosystemAnalyticsOptions = {}) => {
  const analyticsRef = useRef<EcosystemAnalytics | null>(null);

  // Initialize analytics on first render
  if (!analyticsRef.current) {
    analyticsRef.current = new EcosystemAnalytics(options);
  }

  const analytics = analyticsRef.current;

  // Memoized callback functions
  const trackPageView = useCallback(
    (path: string, title?: string) => {
      analytics.trackPageView(path, title);
    },
    [analytics]
  );

  const trackEcosystemInteraction = useCallback(
    (action: string, label?: string, value?: number) => {
      analytics.trackEcosystemInteraction(action, label, value);
    },
    [analytics]
  );

  const trackChartInteraction = useCallback(
    (chartType: string, action: string, data?: any) => {
      analytics.trackChartInteraction(chartType, action, data);
    },
    [analytics]
  );

  const trackFilterUsage = useCallback(
    (filterType: string, filterValue: string) => {
      analytics.trackFilterUsage(filterType, filterValue);
    },
    [analytics]
  );

  const trackExport = useCallback(
    (format: string, data?: any) => {
      analytics.trackExport(format, data);
    },
    [analytics]
  );

  const trackFeatureUsage = useCallback(
    (feature: string, startTime: number) => {
      analytics.trackFeatureUsage(feature, startTime);
    },
    [analytics]
  );

  const trackPerformance = useCallback(
    (name: string, value: number, unit?: string) => {
      analytics.trackPerformance(name, value, unit);
    },
    [analytics]
  );

  const trackError = useCallback(
    (error: Error, context?: Record<string, any>) => {
      analytics.trackError(error, context);
    },
    [analytics]
  );

  return {
    analytics,
    trackPageView,
    trackEcosystemInteraction,
    trackChartInteraction,
    trackFilterUsage,
    trackExport,
    trackFeatureUsage,
    trackPerformance,
    trackError,
    getSessionInfo: useCallback(() => analytics.getSessionInfo(), [analytics]),
    getEngagementMetrics: useCallback(() => analytics.getEngagementMetrics(), [analytics]),
    getEvents: useCallback(() => analytics.getEvents(), [analytics]),
    clearEvents: useCallback(() => analytics.clearEvents(), [analytics]),
    setEnabled: useCallback((enabled: boolean) => analytics.setEnabled(enabled), [analytics]),
  };
};

export default useEcosystemAnalytics;
