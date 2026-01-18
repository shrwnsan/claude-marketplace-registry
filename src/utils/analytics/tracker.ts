/**
 * Analytics tracking utility for Claude Marketplace Aggregator
 * Tracks user interactions, page views, and system metrics
 */

interface AnalyticsEvent {
  type:
    | 'page_view'
    | 'plugin_click'
    | 'marketplace_click'
    | 'search'
    | 'filter'
    | 'download'
    | 'rating'
    | 'share';
  data: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

interface AnalyticsData {
  events: AnalyticsEvent[];
  pageViews: Record<string, number>;
  pluginClicks: Record<string, number>;
  marketplaceClicks: Record<string, number>;
  searches: Array<{ query: string; count: number; timestamp: number }>;
  filters: Record<string, number>;
  downloads: Record<string, number>;
  ratings: Record<string, { rating: number; timestamp: number }[]>;
  shares: Record<string, number>;
}

class AnalyticsTracker {
  private sessionId: string;
  private data: AnalyticsData;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.data = this.loadData();
    this.trackPageView(window.location.pathname);
  }

  private generateSessionId(): string {
    const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 9)
      : Array.from(crypto.getRandomValues(new Uint8Array(9)))
          .map(b => b.toString(36))
          .join('');
    return randomPart + Date.now().toString(36);
  }

  private loadData(): AnalyticsData {
    if (typeof window === 'undefined') {
      return {
        events: [],
        pageViews: {},
        pluginClicks: {},
        marketplaceClicks: {},
        searches: [],
        filters: {},
        downloads: {},
        ratings: {},
        shares: {},
      };
    }

    try {
      const stored = localStorage.getItem('claude-marketplace-analytics');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Clean old data (older than 30 days)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        parsed.events =
          parsed.events?.filter((e: AnalyticsEvent) => e.timestamp > thirtyDaysAgo) || [];
        return parsed;
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }

    return {
      events: [],
      pageViews: {},
      pluginClicks: {},
      marketplaceClicks: {},
      searches: [],
      filters: {},
      downloads: {},
      ratings: {},
      shares: {},
    };
  }

  private saveData(): void {
    if (typeof window === 'undefined') return;

    try {
      // Keep only last 1000 events to prevent storage issues
      const limitedData = {
        ...this.data,
        events: this.data.events.slice(-1000),
      };
      localStorage.setItem('claude-marketplace-analytics', JSON.stringify(limitedData));
    } catch (error) {
      console.error('Error saving analytics data:', error);
    }
  }

  private addEvent(event: AnalyticsEvent): void {
    this.data.events.push(event);
    this.saveData();
  }

  trackPageView(path: string): void {
    const event: AnalyticsEvent = {
      type: 'page_view',
      data: { path, referrer: document.referrer },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.addEvent(event);
    this.data.pageViews[path] = (this.data.pageViews[path] || 0) + 1;
  }

  trackPluginClick(pluginId: string, pluginName: string, source?: string): void {
    const event: AnalyticsEvent = {
      type: 'plugin_click',
      data: { pluginId, pluginName, source },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.addEvent(event);
    this.data.pluginClicks[pluginId] = (this.data.pluginClicks[pluginId] || 0) + 1;
  }

  trackMarketplaceClick(marketplaceId: string, marketplaceName: string, source?: string): void {
    const event: AnalyticsEvent = {
      type: 'marketplace_click',
      data: { marketplaceId, marketplaceName, source },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.addEvent(event);
    this.data.marketplaceClicks[marketplaceId] =
      (this.data.marketplaceClicks[marketplaceId] || 0) + 1;
  }

  trackSearch(query: string, resultCount: number): void {
    const event: AnalyticsEvent = {
      type: 'search',
      data: { query, resultCount },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.addEvent(event);

    // Update search counts
    const existingSearch = this.data.searches.find((s) => s.query === query);
    if (existingSearch) {
      existingSearch.count++;
    } else {
      this.data.searches.push({ query, count: 1, timestamp: Date.now() });
    }

    // Keep only last 500 unique searches
    if (this.data.searches.length > 500) {
      this.data.searches = this.data.searches.slice(-500);
    }
  }

  trackFilter(filterType: string, filterValue: string): void {
    const event: AnalyticsEvent = {
      type: 'filter',
      data: { filterType, filterValue },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.addEvent(event);
    const filterKey = `${filterType}:${filterValue}`;
    this.data.filters[filterKey] = (this.data.filters[filterKey] || 0) + 1;
  }

  trackDownload(itemId: string, itemType: 'plugin' | 'marketplace', itemName: string): void {
    const event: AnalyticsEvent = {
      type: 'download',
      data: { itemId, itemType, itemName },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.addEvent(event);
    this.data.downloads[itemId] = (this.data.downloads[itemId] || 0) + 1;
  }

  trackRating(itemId: string, itemType: 'plugin' | 'marketplace', rating: number): void {
    const event: AnalyticsEvent = {
      type: 'rating',
      data: { itemId, itemType, rating },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.addEvent(event);

    if (!this.data.ratings[itemId]) {
      this.data.ratings[itemId] = [];
    }
    this.data.ratings[itemId].push({ rating, timestamp: Date.now() });
  }

  trackShare(itemId: string, itemType: 'plugin' | 'marketplace', platform?: string): void {
    const event: AnalyticsEvent = {
      type: 'share',
      data: { itemId, itemType, platform },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.addEvent(event);
    this.data.shares[itemId] = (this.data.shares[itemId] || 0) + 1;
  }

  // Analytics data retrieval methods
  getAnalyticsData(): AnalyticsData {
    return this.data;
  }

  getTopPlugins(limit: number = 10): Array<{ id: string; clicks: number }> {
    return Object.entries(this.data.pluginClicks)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id, clicks]) => ({ id, clicks }));
  }

  getTopMarketplaces(limit: number = 10): Array<{ id: string; clicks: number }> {
    return Object.entries(this.data.marketplaceClicks)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id, clicks]) => ({ id, clicks }));
  }

  getPopularSearches(limit: number = 10): Array<{ query: string; count: number }> {
    return this.data.searches.sort((a, b) => b.count - a.count).slice(0, limit);
  }

  getPageViewStats(timeRange?: number): Record<string, number> {
    if (!timeRange) return this.data.pageViews;

    const cutoff = Date.now() - timeRange;
    const recentEvents = this.data.events.filter(
      (e) => e.type === 'page_view' && e.timestamp > cutoff
    );
    const stats: Record<string, number> = {};

    recentEvents.forEach((event) => {
      const path = event.data.path;
      stats[path] = (stats[path] || 0) + 1;
    });

    return stats;
  }

  getEventCounts(timeRange?: number): Record<string, number> {
    const events = timeRange
      ? this.data.events.filter((e) => e.timestamp > Date.now() - timeRange)
      : this.data.events;

    const counts: Record<string, number> = {};
    events.forEach((event) => {
      counts[event.type] = (counts[event.type] || 0) + 1;
    });

    return counts;
  }

  getSessionStats(): { totalSessions: number; avgSessionDuration: number; bounceRate: number } {
    // Calculate session-based metrics
    const sessions = new Set<string>();
    let totalDuration = 0;
    let singlePageSessions = 0;

    const sessionEvents = new Map<string, AnalyticsEvent[]>();

    this.data.events.forEach((event) => {
      if (!sessionEvents.has(event.sessionId)) {
        sessionEvents.set(event.sessionId, []);
      }
      sessionEvents.get(event.sessionId)!.push(event);
    });

    sessionEvents.forEach((events, sessionId) => {
      sessions.add(sessionId);
      const pageViews = events.filter((e) => e.type === 'page_view');

      if (pageViews.length === 1) {
        singlePageSessions++;
      }

      if (pageViews.length > 1) {
        const duration = pageViews[pageViews.length - 1].timestamp - pageViews[0].timestamp;
        totalDuration += duration;
      }
    });

    return {
      totalSessions: sessions.size,
      avgSessionDuration: sessions.size > 0 ? totalDuration / sessions.size : 0,
      bounceRate: sessions.size > 0 ? singlePageSessions / sessions.size : 0,
    };
  }

  clearData(): void {
    this.data = {
      events: [],
      pageViews: {},
      pluginClicks: {},
      marketplaceClicks: {},
      searches: [],
      filters: {},
      downloads: {},
      ratings: {},
      shares: {},
    };
    this.saveData();
  }

  exportData(): string {
    return JSON.stringify(this.data, null, 2);
  }

  importData(jsonData: string): void {
    try {
      const imported = JSON.parse(jsonData);
      this.data = { ...this.data, ...imported };
      this.saveData();
    } catch (error) {
      console.error('Error importing analytics data:', error);
      throw new Error('Invalid analytics data format');
    }
  }
}

// Singleton instance
let analyticsInstance: AnalyticsTracker | null = null;

export const getAnalytics = (): AnalyticsTracker => {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsTracker();
  }
  return analyticsInstance;
};

// Export types
export type { AnalyticsEvent, AnalyticsData };
export { AnalyticsTracker };
