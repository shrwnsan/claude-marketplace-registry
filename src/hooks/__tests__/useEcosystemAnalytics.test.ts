/**
 * useEcosystemAnalytics Hook Tests
 *
 * Tests for the useEcosystemAnalytics hook, focusing on:
 * - Analytics initialization
 * - Event tracking
 * - Session management
 * - Error tracking
 * - Performance tracking
 */

import { renderHook } from '@testing-library/react';
import { useEcosystemAnalytics } from '../useEcosystemAnalytics';

// Mock the monitoring modules
jest.mock('@/lib/monitoring/performance-monitor', () => ({
  performanceMonitor: {
    recordMetric: jest.fn(),
  },
}));

jest.mock('@/lib/monitoring/error-tracker', () => ({
  errorTracker: {
    trackComponentError: jest.fn(),
  },
}));

describe('useEcosystemAnalytics Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should return analytics object and tracking functions', () => {
      const { result } = renderHook(() => useEcosystemAnalytics({ enableTracking: false }));

      expect(result.current).toBeDefined();
      expect(result.current.analytics).toBeDefined();
      expect(result.current.trackPageView).toBeDefined();
      expect(result.current.trackEcosystemInteraction).toBeDefined();
      expect(result.current.trackChartInteraction).toBeDefined();
      expect(result.current.trackFilterUsage).toBeDefined();
      expect(result.current.trackExport).toBeDefined();
      expect(result.current.trackFeatureUsage).toBeDefined();
      expect(result.current.trackPerformance).toBeDefined();
      expect(result.current.trackError).toBeDefined();
      expect(result.current.getSessionInfo).toBeDefined();
      expect(result.current.getEngagementMetrics).toBeDefined();
      expect(result.current.getEvents).toBeDefined();
      expect(result.current.clearEvents).toBeDefined();
      expect(result.current.setEnabled).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const { result } = renderHook(() =>
        useEcosystemAnalytics({
          enableTracking: false,
          debug: false,
        })
      );

      expect(result.current.analytics).toBeDefined();
    });
  });

  describe('Session Management', () => {
    it('should provide session information', () => {
      const { result } = renderHook(() => useEcosystemAnalytics({ enableTracking: false }));

      const sessionInfo = result.current.getSessionInfo();

      expect(sessionInfo).toBeDefined();
      expect(sessionInfo).toMatchObject({
        id: expect.any(String),
        startTime: expect.any(Number),
        pageViews: expect.any(Number),
        interactions: expect.any(Number),
        timeSpent: expect.any(Number),
        userAgent: expect.any(String),
        screenResolution: expect.any(String),
      });
    });

    it('should track interactions in session', () => {
      const { result } = renderHook(() => useEcosystemAnalytics({ enableTracking: true }));

      result.current.trackEcosystemInteraction('click', 'button1');
      result.current.trackEcosystemInteraction('click', 'button2');

      const sessionInfo = result.current.getSessionInfo();
      expect(sessionInfo.interactions).toBeGreaterThanOrEqual(2);
    });

    it('should provide engagement metrics', () => {
      const { result } = renderHook(() => useEcosystemAnalytics({ enableTracking: true }));

      result.current.trackEcosystemInteraction('click', 'button1');
      result.current.trackEcosystemInteraction('click', 'button2');
      result.current.trackFilterUsage('category', 'plugins');

      const metrics = result.current.getEngagementMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalTime).toBeGreaterThanOrEqual(0);
      expect(metrics.featureUsage).toBeDefined();
      expect(typeof metrics.bounceRate).toBe('number');
    });
  });

  describe('Event Management', () => {
    it('should retrieve all recorded events', () => {
      const { result } = renderHook(() => useEcosystemAnalytics({ enableTracking: true }));

      result.current.trackEcosystemInteraction('click', 'button1');
      result.current.trackEcosystemInteraction('click', 'button2');

      const events = result.current.getEvents();

      expect(events.length).toBeGreaterThanOrEqual(2);
    });

    it('should clear all events', () => {
      const { result } = renderHook(() => useEcosystemAnalytics({ enableTracking: true }));

      result.current.trackEcosystemInteraction('click', 'button1');
      result.current.trackEcosystemInteraction('click', 'button2');

      let events = result.current.getEvents();
      expect(events.length).toBeGreaterThan(0);

      result.current.clearEvents();

      events = result.current.getEvents();
      expect(events.length).toBe(0);
    });

    it('should enable and disable tracking', () => {
      const { result } = renderHook(() => useEcosystemAnalytics({ enableTracking: true }));

      result.current.setEnabled(false);
      result.current.trackEcosystemInteraction('click', 'button');

      let events = result.current.getEvents();
      const eventsCountWhileDisabled = events.length;

      result.current.setEnabled(true);
      result.current.trackEcosystemInteraction('click', 'button2');

      events = result.current.getEvents();
      expect(events.length).toBe(eventsCountWhileDisabled + 1);
    });
  });

  describe('Interaction Tracking', () => {
    it('should track ecosystem interaction', () => {
      const { result } = renderHook(() => useEcosystemAnalytics({ enableTracking: true }));

      result.current.trackEcosystemInteraction('button_click', 'submit_button');

      const events = result.current.getEvents();
      const interactionEvent = events.find(e => e.event === 'ecosystem_interaction');

      expect(interactionEvent).toBeDefined();
      expect(interactionEvent?.category).toBe('interaction');
      expect(interactionEvent?.action).toBe('button_click');
      expect(interactionEvent?.label).toBe('submit_button');
    });

    it('should track chart interaction', () => {
      const { result } = renderHook(() => useEcosystemAnalytics({ enableTracking: true }));

      result.current.trackChartInteraction('line_chart', 'hover', { data: 'test' });

      const events = result.current.getEvents();
      const chartEvent = events.find(e => e.action === 'chart_hover');

      expect(chartEvent).toBeDefined();
      expect(chartEvent?.label).toBe('line_chart');
    });

    it('should track filter usage', () => {
      const { result } = renderHook(() => useEcosystemAnalytics({ enableTracking: true }));

      result.current.trackFilterUsage('category', 'plugins');

      const events = result.current.getEvents();
      const filterEvent = events.find(e => e.action === 'filter_use');

      expect(filterEvent).toBeDefined();
      expect(filterEvent?.label).toBe('category:plugins');
    });

    it('should track export', () => {
      const { result } = renderHook(() => useEcosystemAnalytics({ enableTracking: true }));

      result.current.trackExport('csv', { data: 'test' });

      const events = result.current.getEvents();
      const exportEvent = events.find(e => e.action === 'export');

      expect(exportEvent).toBeDefined();
      expect(exportEvent?.label).toBe('csv');
    });

    it('should track feature usage with duration', () => {
      const { result } = renderHook(() => useEcosystemAnalytics({ enableTracking: true }));

      const startTime = Date.now() - 1000; // 1 second ago
      result.current.trackFeatureUsage('search', startTime);

      const events = result.current.getEvents();
      const featureEvent = events.find(e => e.action === 'feature_time');

      expect(featureEvent).toBeDefined();
      expect(featureEvent?.label).toBe('search');
      expect(featureEvent?.value).toBeGreaterThan(0);
    });
  });

  describe('Error Tracking', () => {
    it('should track errors', () => {
      const { result } = renderHook(() => useEcosystemAnalytics({ enableTracking: true }));

      const error = new Error('Test error');
      const context = { component: 'TestComponent' };

      result.current.trackError(error, context);

      const events = result.current.getEvents();
      const errorEvent = events.find(e => e.category === 'error');

      expect(errorEvent).toBeDefined();
      expect(errorEvent?.action).toBe('Error'); // Error.name defaults to "Error"
      expect(errorEvent?.metadata?.context).toEqual(context);
    });

    it('should track ecosystem errors', () => {
      const { result } = renderHook(() => useEcosystemAnalytics({ enableTracking: true }));

      const error = new Error('Ecosystem error');
      result.current.analytics.trackEcosystemError(error, { feature: 'analytics' });

      const events = result.current.getEvents();
      const ecosystemErrorEvent = events.find(e => e.event === 'ecosystem_error');

      expect(ecosystemErrorEvent).toBeDefined();
      expect(ecosystemErrorEvent?.category).toBe('error');
    });
  });

  describe('Performance Tracking', () => {
    it('should track performance metrics', () => {
      const { result } = renderHook(() => useEcosystemAnalytics({ enableTracking: true, trackPerformance: true }));

      result.current.trackPerformance('page_load', 1500, 'ms');

      const events = result.current.getEvents();
      const perfEvent = events.find(e => e.category === 'performance');

      expect(perfEvent).toBeDefined();
      expect(perfEvent?.action).toBe('page_load');
      expect(perfEvent?.value).toBe(1500);
      expect(perfEvent?.metadata?.unit).toBe('ms');
    });
  });

  describe('Custom Options', () => {
    it('should respect enableTracking option', () => {
      const { result } = renderHook(() =>
        useEcosystemAnalytics({ enableTracking: false })
      );

      result.current.trackEcosystemInteraction('click', 'button');

      const events = result.current.getEvents();
      // With tracking disabled, events should not be recorded
      expect(events.length).toBe(0);
    });

    it('should respect trackInteractions option', () => {
      const { result } = renderHook(() =>
        useEcosystemAnalytics({ enableTracking: true, trackInteractions: false })
      );

      result.current.trackEcosystemInteraction('click', 'button');

      const events = result.current.getEvents();
      const interactionEvents = events.filter(e => e.category === 'interaction');
      expect(interactionEvents.length).toBe(0);
    });

    it('should respect trackPerformance option', () => {
      const { result } = renderHook(() =>
        useEcosystemAnalytics({ enableTracking: true, trackPerformance: false })
      );

      result.current.trackPerformance('load', 1000);

      const events = result.current.getEvents();
      const perfEvents = events.filter(e => e.category === 'performance');
      expect(perfEvents.length).toBe(0);
    });
  });
});
