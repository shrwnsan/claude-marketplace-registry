/**
 * React hooks for analytics tracking
 */

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getAnalytics } from './tracker';

export const useAnalytics = () => {
  const router = useRouter();
  const analytics = getAnalytics();

  // Track page views on route changes
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      analytics.trackPageView(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, analytics]);

  // Return tracking functions
  return {
    trackPluginClick: useCallback((pluginId: string, pluginName: string, source?: string) => {
      analytics.trackPluginClick(pluginId, pluginName, source);
    }, [analytics]),

    trackMarketplaceClick: useCallback((marketplaceId: string, marketplaceName: string, source?: string) => {
      analytics.trackMarketplaceClick(marketplaceId, marketplaceName, source);
    }, [analytics]),

    trackSearch: useCallback((query: string, resultCount: number) => {
      analytics.trackSearch(query, resultCount);
    }, [analytics]),

    trackFilter: useCallback((filterType: string, filterValue: string) => {
      analytics.trackFilter(filterType, filterValue);
    }, [analytics]),

    trackDownload: useCallback((itemId: string, itemType: 'plugin' | 'marketplace', itemName: string) => {
      analytics.trackDownload(itemId, itemType, itemName);
    }, [analytics]),

    trackRating: useCallback((itemId: string, itemType: 'plugin' | 'marketplace', rating: number) => {
      analytics.trackRating(itemId, itemType, rating);
    }, [analytics]),

    trackShare: useCallback((itemId: string, itemType: 'plugin' | 'marketplace', platform?: string) => {
      analytics.trackShare(itemId, itemType, platform);
    }, [analytics]),

    getAnalyticsData: useCallback(() => {
      return analytics.getAnalyticsData();
    }, [analytics]),

    getTopPlugins: useCallback((limit?: number) => {
      return analytics.getTopPlugins(limit);
    }, [analytics]),

    getTopMarketplaces: useCallback((limit?: number) => {
      return analytics.getTopMarketplaces(limit);
    }, [analytics]),

    getPopularSearches: useCallback((limit?: number) => {
      return analytics.getPopularSearches(limit);
    }, [analytics]),

    getPageViewStats: useCallback((timeRange?: number) => {
      return analytics.getPageViewStats(timeRange);
    }, [analytics]),

    getEventCounts: useCallback((timeRange?: number) => {
      return analytics.getEventCounts(timeRange);
    }, [analytics]),

    getSessionStats: useCallback(() => {
      return analytics.getSessionStats();
    }, [analytics]),

    clearData: useCallback(() => {
      analytics.clearData();
    }, [analytics]),

    exportData: useCallback(() => {
      return analytics.exportData();
    }, [analytics]),

    importData: useCallback((jsonData: string) => {
      analytics.importData(jsonData);
    }, [analytics]),
  };
};

export const usePageTracking = (pageName?: string) => {
  const analytics = getAnalytics();

  useEffect(() => {
    if (pageName) {
      analytics.trackPageView(pageName);
    }
  }, [pageName, analytics]);
};

export const useClickTracking = (itemId: string, itemType: 'plugin' | 'marketplace', itemName: string) => {
  const analytics = getAnalytics();

  const handleClick = useCallback((source?: string) => {
    if (itemType === 'plugin') {
      analytics.trackPluginClick(itemId, itemName, source);
    } else {
      analytics.trackMarketplaceClick(itemId, itemName, source);
    }
  }, [analytics, itemId, itemType, itemName]);

  const handleDownload = useCallback(() => {
    analytics.trackDownload(itemId, itemType, itemName);
  }, [analytics, itemId, itemType, itemName]);

  const handleRating = useCallback((rating: number) => {
    analytics.trackRating(itemId, itemType, rating);
  }, [analytics, itemId, itemType, itemName]);

  const handleShare = useCallback((platform?: string) => {
    analytics.trackShare(itemId, itemType, platform);
  }, [analytics, itemId, itemType, itemName]);

  return {
    handleClick,
    handleDownload,
    handleRating,
    handleShare,
  };
};