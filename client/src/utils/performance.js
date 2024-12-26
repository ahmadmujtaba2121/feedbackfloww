import { useState, useEffect, useRef } from 'react';
import * as Sentry from "@sentry/react";

// Performance thresholds
export const Thresholds = {
  LOAD_TIME: 3000, // 3 seconds
  OPERATION_TIME: 1000, // 1 second
  MEMORY_USAGE: 50 * 1024 * 1024, // 50MB
  FPS_MIN: 30
};

// Cache management
const cache = new Map();
const CACHE_MAX_SIZE = 100;
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Cache implementation
export const cacheData = (key, data, expiry = CACHE_EXPIRY) => {
  if (cache.size >= CACHE_MAX_SIZE) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }

  cache.set(key, {
    data,
    timestamp: Date.now(),
    expiry
  });
};

export const getCachedData = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > cached.expiry) {
    cache.delete(key);
    return null;
  }

  return cached.data;
};

// Performance monitoring hook
export const usePerformanceMonitor = (operationName) => {
  const startTime = useRef(Date.now());

  useEffect(() => {
    return () => {
      const duration = Date.now() - startTime.current;
      if (duration > Thresholds.OPERATION_TIME && process.env.NODE_ENV === 'production') {
        Sentry.captureMessage(`Slow operation detected: ${operationName}`, {
          level: 'warning',
          extra: { duration, operationName }
        });
      }
    };
  }, [operationName]);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Lazy loading hook
export const useLazyLoad = (elementRef, options = {}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [elementRef, options]);

  return isVisible;
};

// FPS monitoring
export const monitorFPS = () => {
  if (process.env.NODE_ENV !== 'production') return () => { };

  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 0;

  const countFrame = () => {
    frameCount++;
    const currentTime = performance.now();

    if (currentTime >= lastTime + 1000) {
      fps = frameCount;
      frameCount = 0;
      lastTime = currentTime;

      if (fps < Thresholds.FPS_MIN) {
        Sentry.captureMessage('Low FPS detected', {
          level: 'warning',
          extra: { fps }
        });
      }
    }

    requestAnimationFrame(countFrame);
  };

  requestAnimationFrame(countFrame);
  return () => fps;
};

// Export performance utilities
export const PerformanceUtils = {
  cacheData,
  getCachedData,
  usePerformanceMonitor,
  debounce,
  throttle,
  useLazyLoad,
  monitorFPS,
  Thresholds
}; 