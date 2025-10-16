/**
 * Performance utilities for optimizing the Claude Marketplace application
 */

/**
 * Debounce function to limit how often a function can be called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

/**
 * Throttle function to limit function calls to once per time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoize expensive function calls
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Lazy load images using Intersection Observer
 */
export class LazyImageLoader {
  private observer: IntersectionObserver;
  private loadedImages = new WeakSet<HTMLImageElement>();

  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target as HTMLImageElement);
          }
        });
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before image enters viewport
        threshold: 0.1,
      }
    );
  }

  private loadImage(img: HTMLImageElement) {
    if (this.loadedImages.has(img)) return;

    const src = img.dataset.src;
    const srcset = img.dataset.srcset;
    const sizes = img.dataset.sizes;

    if (src || srcset) {
      // Add fade-in effect
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease-in-out';

      img.onload = () => {
        img.style.opacity = '1';
        this.loadedImages.add(img);
      };

      if (src) img.src = src;
      if (srcset) img.srcset = srcset;
      if (sizes) img.sizes = sizes;

      this.observer.unobserve(img);
    }
  }

  observe(img: HTMLImageElement) {
    if (img.dataset.src || img.dataset.srcset) {
      this.observer.observe(img);
    }
  }

  disconnect() {
    this.observer.disconnect();
  }
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string, type?: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  document.head.appendChild(link);
}

/**
 * Measure and report performance metrics
 */
export class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();

  mark(name: string) {
    performance.mark(name);
  }

  measure(name: string, startMark: string, endMark?: string) {
    try {
      performance.measure(name, startMark, endMark);
      const entry = performance.getEntriesByName(name, 'measure')[0];
      this.metrics.set(name, entry.duration);
      return entry.duration;
    } catch (error) {
      console.warn(`Performance measurement failed for ${name}:`, error);
      return 0;
    }
  }

  getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  reportToConsole() {
    console.table(this.getAllMetrics());
  }

  // Send metrics to analytics service
  async reportToAnalytics(endpoint: string) {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.getAllMetrics()),
      });
    } catch (error) {
      console.warn('Failed to report performance metrics:', error);
    }
  }
}

/**
 * Optimize images for different screen sizes
 */
export function getResponsiveImageSrc(
  baseUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
  } = {}
): string {
  const {
    width = 800,
    height = 600,
    quality = 80,
    format = 'webp',
  } = options;

  // This is a placeholder - in a real app, you'd use an image optimization service
  // like Cloudinary, Imgix, or your own image processing API
  const params = new URLSearchParams({
    w: width.toString(),
    h: height.toString(),
    q: quality.toString(),
    fm: format,
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Virtual scrolling for large lists
 */
export class VirtualScrollManager<T> {
  private items: T[];
  private itemHeight: number;
  private containerHeight: number;
  private scrollTop: number = 0;

  constructor(
    items: T[],
    itemHeight: number,
    containerHeight: number
  ) {
    this.items = items;
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
  }

  getVisibleItems(): { items: T[]; startIndex: number; endIndex: number } {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(this.containerHeight / this.itemHeight) + 1,
      this.items.length - 1
    );

    return {
      items: this.items.slice(startIndex, endIndex + 1),
      startIndex,
      endIndex,
    };
  }

  setScrollTop(scrollTop: number) {
    this.scrollTop = scrollTop;
  }

  getTotalHeight(): number {
    return this.items.length * this.itemHeight;
  }

  updateItems(items: T[]) {
    this.items = items;
  }
}

/**
 * Progressive loading for large datasets
 */
export class ProgressiveLoader<T> {
  private items: T[];
  private batchSize: number;
  private currentIndex: number = 0;

  constructor(items: T[], batchSize: number = 20) {
    this.items = items;
    this.batchSize = batchSize;
  }

  loadNextBatch(): T[] {
    const endIndex = Math.min(
      this.currentIndex + this.batchSize,
      this.items.length
    );
    const batch = this.items.slice(this.currentIndex, endIndex);
    this.currentIndex = endIndex;
    return batch;
  }

  hasMore(): boolean {
    return this.currentIndex < this.items.length;
  }

  reset() {
    this.currentIndex = 0;
  }
}

// Create global instances
export const imageLoader = new LazyImageLoader();
export const performanceMonitor = new PerformanceMonitor();

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Mark application start
  performanceMonitor.mark('app-start');

  // Measure time to interactive
  window.addEventListener('load', () => {
    performanceMonitor.mark('app-loaded');
    performanceMonitor.measure('load-time', 'app-start', 'app-loaded');

    // Report metrics in development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        performanceMonitor.reportToConsole();
      }, 1000);
    }
  });
}