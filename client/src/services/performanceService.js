import { db } from '../firebase/firebase';
import { doc, updateDoc, arrayUnion, setDoc, serverTimestamp } from 'firebase/firestore';
import { debounce } from 'lodash';

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoads: {},
      interactions: {},
      errors: [],
      resources: {}
    };
    this.queue = [];
    this.isProcessing = false;
    this.setupPerformanceObservers();
  }

  // Initialize performance observers
  setupPerformanceObservers() {
    // Page Load Performance
    if (window.performance) {
      window.addEventListener('load', () => {
        const pageLoadMetrics = this.getPageLoadMetrics();
        this.trackMetric('pageLoad', pageLoadMetrics);
      });
    }

    // Resource Loading Performance
    if (window.PerformanceObserver) {
      // Resource timing
      const resourceObserver = new PerformanceObserver(this.handleResourceTiming.bind(this));
      resourceObserver.observe({ entryTypes: ['resource'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver(this.handleLCP.bind(this));
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver(this.handleFID.bind(this));
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Layout Shifts
      const clsObserver = new PerformanceObserver(this.handleCLS.bind(this));
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  // Get page load metrics
  getPageLoadMetrics() {
    const timing = performance.timing;
    return {
      dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
      tcpConnection: timing.connectEnd - timing.connectStart,
      serverResponse: timing.responseEnd - timing.requestStart,
      domParsing: timing.domComplete - timing.domLoading,
      resourceLoading: timing.loadEventEnd - timing.responseEnd,
      totalLoadTime: timing.loadEventEnd - timing.navigationStart
    };
  }

  // Handle resource timing entries
  handleResourceTiming(entries) {
    entries.getEntries().forEach(entry => {
      const resourceMetric = {
        name: entry.name,
        type: entry.initiatorType,
        duration: entry.duration,
        size: entry.transferSize,
        timestamp: new Date().toISOString()
      };
      this.trackMetric('resource', resourceMetric);
    });
  }

  // Handle Largest Contentful Paint
  handleLCP(entries) {
    const lastEntry = entries.getEntries().pop();
    if (lastEntry) {
      this.trackMetric('lcp', {
        value: lastEntry.startTime,
        element: lastEntry.element?.tagName || 'unknown',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Handle First Input Delay
  handleFID(entries) {
    entries.getEntries().forEach(entry => {
      this.trackMetric('fid', {
        value: entry.processingStart - entry.startTime,
        type: entry.name,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Handle Cumulative Layout Shift
  handleCLS(entries) {
    entries.getEntries().forEach(entry => {
      if (!entry.hadRecentInput) {
        this.trackMetric('cls', {
          value: entry.value,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  // Track component render time
  trackRender(componentName, startTime) {
    const renderTime = performance.now() - startTime;
    this.trackMetric('componentRender', {
      component: componentName,
      duration: renderTime,
      timestamp: new Date().toISOString()
    });
  }

  // Track user interaction
  trackInteraction(action, duration) {
    this.trackMetric('interaction', {
      action,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  // Track errors
  trackError(error, context = {}) {
    this.trackMetric('error', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // Generic metric tracking
  trackMetric(type, data) {
    this.queue.push({
      type,
      data,
      timestamp: new Date().toISOString()
    });
    this.processQueue();
  }

  // Process metrics queue
  processQueue = debounce(async () => {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    try {
      const batch = this.queue.splice(0, 10);
      const metricsRef = doc(db, 'metrics', 'performance');
      
      await setDoc(metricsRef, {
        metrics: arrayUnion(...batch),
        lastUpdated: serverTimestamp()
      }, { merge: true });

    } catch (error) {
      console.error('Error processing performance metrics:', error);
      // Put failed metrics back in queue
      this.queue.unshift(...batch);
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }, 1000);

  // Get performance summary
  getPerformanceSummary() {
    return {
      pageLoads: this.metrics.pageLoads,
      interactions: this.metrics.interactions,
      errorCount: this.metrics.errors.length,
      resourceCount: Object.keys(this.metrics.resources).length
    };
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = {
      pageLoads: {},
      interactions: {},
      errors: [],
      resources: {}
    };
  }
}

export const performanceMonitor = new PerformanceMonitor(); 