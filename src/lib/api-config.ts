/**
 * API Configuration for YouTube Video Storyline Generator
 * 
 * This file manages API keys and rate limiting configuration.
 * In production, users can provide their own API keys to avoid shared rate limits.
 */

export interface ApiConfig {
  // User-provided API keys (optional - for production use)
  userApiKey?: string;
  
  // Rate limiting settings
  rateLimit: {
    maxRequestsPerMinute: number;
    maxRequestsPerDay: number;
  };
  
  // Feature flags
  features: {
    enableCaching: boolean;
    enableQueue: boolean;
    enableDemoMode: boolean;
  };
}

// Default configuration using shared API keys
export const defaultApiConfig: ApiConfig = {
  rateLimit: {
    maxRequestsPerMinute: 10,
    maxRequestsPerDay: 100,
  },
  features: {
    enableCaching: true,
    enableQueue: true,
    enableDemoMode: true, // Fallback to demo when rate limited
  },
};

// In-memory cache for API responses
const apiCache = new Map<string, { data: unknown; timestamp: number }>();

// Cache TTL in milliseconds (1 hour)
const CACHE_TTL = 60 * 60 * 1000;

/**
 * Generate a cache key from request parameters
 */
export function getCacheKey(prefix: string, params: Record<string, unknown>): string {
  return `${prefix}:${JSON.stringify(params)}`;
}

/**
 * Get cached response if available and not expired
 */
export function getCachedResponse<T>(key: string): T | null {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

/**
 * Store response in cache
 */
export function setCachedResponse(key: string, data: unknown): void {
  apiCache.set(key, { data, timestamp: Date.now() });
  
  // Clean up old cache entries
  if (apiCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of apiCache.entries()) {
      if (now - v.timestamp > CACHE_TTL) {
        apiCache.delete(k);
      }
    }
  }
}

/**
 * Clear all cached responses
 */
export function clearCache(): void {
  apiCache.clear();
}

/**
 * Request queue for rate limiting
 */
interface QueueItem {
  id: string;
  execute: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

const requestQueue: QueueItem[] = [];
let isProcessingQueue = false;
let requestTimestamps: number[] = [];

/**
 * Check if we're within rate limits
 */
function isWithinRateLimit(): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  
  // Remove timestamps older than 1 minute
  requestTimestamps = requestTimestamps.filter(t => t > oneMinuteAgo);
  
  // Check if we're under the per-minute limit
  return requestTimestamps.length < defaultApiConfig.rateLimit.maxRequestsPerMinute;
}

/**
 * Add a request to the queue and return a promise
 */
export function queueRequest<T>(
  id: string,
  execute: () => Promise<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    requestQueue.push({
      id,
      execute: execute as () => Promise<unknown>,
      resolve: resolve as (value: unknown) => void,
      reject,
    });
    
    processQueue();
  });
}

/**
 * Process the request queue with rate limiting
 */
async function processQueue(): Promise<void> {
  if (isProcessingQueue || requestQueue.length === 0) {
    return;
  }
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    if (!isWithinRateLimit()) {
      // Wait before processing more requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }
    
    const item = requestQueue.shift();
    if (!item) break;
    
    requestTimestamps.push(Date.now());
    
    try {
      const result = await item.execute();
      item.resolve(result);
    } catch (error) {
      item.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  isProcessingQueue = false;
}

/**
 * Get queue statistics
 */
export function getQueueStats(): { pending: number; recentRequests: number } {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const recentRequests = requestTimestamps.filter(t => t > oneMinuteAgo).length;
  
  return {
    pending: requestQueue.length,
    recentRequests,
  };
}
