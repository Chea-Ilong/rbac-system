import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  requestCount: number;
  totalTime: number;
  averageTime: number;
  slowQueries: Array<{
    endpoint: string;
    duration: number;
    timestamp: number;
  }>;
}

interface RequestTiming {
  endpoint: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    requestCount: 0,
    totalTime: 0,
    averageTime: 0,
    slowQueries: []
  });

  const [activeRequests, setActiveRequests] = useState<Map<string, RequestTiming>>(new Map());

  const startTiming = useCallback((endpoint: string, requestId?: string): string => {
    const id = requestId || `${endpoint}-${Date.now()}-${Math.random()}`;
    const timing: RequestTiming = {
      endpoint,
      startTime: performance.now()
    };
    
    setActiveRequests(prev => new Map(prev).set(id, timing));
    return id;
  }, []);

  const endTiming = useCallback((requestId: string) => {
    setActiveRequests(prev => {
      const newMap = new Map(prev);
      const timing = newMap.get(requestId);
      
      if (timing) {
        const endTime = performance.now();
        const duration = endTime - timing.startTime;
        
        timing.endTime = endTime;
        timing.duration = duration;
        
        // Update metrics
        setMetrics(currentMetrics => {
          const newRequestCount = currentMetrics.requestCount + 1;
          const newTotalTime = currentMetrics.totalTime + duration;
          const newAverageTime = newTotalTime / newRequestCount;
          
          const newSlowQueries = [...currentMetrics.slowQueries];
          
          // Consider queries over 1000ms as slow
          if (duration > 1000) {
            newSlowQueries.push({
              endpoint: timing.endpoint,
              duration,
              timestamp: Date.now()
            });
            
            // Keep only last 10 slow queries
            if (newSlowQueries.length > 10) {
              newSlowQueries.shift();
            }
          }
          
          return {
            requestCount: newRequestCount,
            totalTime: newTotalTime,
            averageTime: newAverageTime,
            slowQueries: newSlowQueries
          };
        });
        
        newMap.delete(requestId);
      }
      
      return newMap;
    });
  }, []);

  const enhancedFetch = useCallback(async (endpoint: string, options?: RequestInit) => {
    const requestId = startTiming(endpoint);
    
    try {
      const response = await fetch(endpoint, options);
      endTiming(requestId);
      return response;
    } catch (error) {
      endTiming(requestId);
      throw error;
    }
  }, [startTiming, endTiming]);

  const resetMetrics = useCallback(() => {
    setMetrics({
      requestCount: 0,
      totalTime: 0,
      averageTime: 0,
      slowQueries: []
    });
  }, []);

  return {
    metrics,
    enhancedFetch,
    resetMetrics,
    activeRequestCount: activeRequests.size
  };
}

// Enhanced database operations with performance monitoring
export function useOptimizedDb() {
  const { enhancedFetch, metrics } = usePerformanceMonitoring();

  const batchFetch = useCallback(async (endpoints: string[]) => {
    const startTime = performance.now();
    
    try {
      // Execute requests in parallel
      const promises = endpoints.map(endpoint => enhancedFetch(endpoint));
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      console.log(`Batch fetch of ${endpoints.length} endpoints completed in ${endTime - startTime}ms`);
      
      return results;
    } catch (error) {
      console.error('Batch fetch failed:', error);
      throw error;
    }
  }, [enhancedFetch]);

  const cachedFetch = useCallback(async (endpoint: string, ttl = 60000) => {
    const cacheKey = `cached_${endpoint}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < ttl) {
        console.log(`Cache hit for ${endpoint}`);
        return { json: () => Promise.resolve(data) };
      }
    }
    
    const response = await enhancedFetch(endpoint);
    const data = await response.json();
    
    sessionStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    
    return { json: () => Promise.resolve(data) };
  }, [enhancedFetch]);

  return {
    enhancedFetch,
    batchFetch,
    cachedFetch,
    metrics
  };
}
