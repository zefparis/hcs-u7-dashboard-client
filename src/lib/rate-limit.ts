/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import memoryRateLimiters from './rate-limit-memory';

// Initialize Redis client - will use Upstash Redis in production
const getRedisClient = () => {
  // Check if we have Upstash credentials
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return Redis.fromEnv();
  }
  
  return null;
};

const redis = getRedisClient();

// Rate limiters par type d'opération
// Use Redis if available, otherwise use in-memory rate limiter
export const rateLimiters = redis ? {
  // API calls via dashboard (par tenant)
  apiRequest: new Ratelimit({
    redis: redis as Redis,
    limiter: Ratelimit.slidingWindow(1000, '1 h'), // 1000 req/heure par tenant
    analytics: true,
    prefix: 'ratelimit:api',
  }),
  
  // Login attempts (par IP)
  login: new Ratelimit({
    redis: redis as Redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 tentatives/15min par IP
    analytics: true,
    prefix: 'ratelimit:login',
  }),
  
  // Password/HCS code change (par tenant)
  securityChange: new Ratelimit({
    redis: redis as Redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 changes/heure
    analytics: true,
    prefix: 'ratelimit:security',
  }),
  
  // API key rotation (par tenant)
  keyRotation: new Ratelimit({
    redis: redis as Redis,
    limiter: Ratelimit.slidingWindow(5, '1 d'), // 5 rotations/jour
    analytics: true,
    prefix: 'ratelimit:rotation',
  }),
} : memoryRateLimiters;

// Type for rate limiter keys
export type RateLimiterKey = 'apiRequest' | 'login' | 'securityChange' | 'keyRotation';

// Helper function
export async function checkRateLimit(
  limiterKey: RateLimiterKey,
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  if (!rateLimiters) {
    return {
      success: true,
      limit: 999999,
      remaining: 999999,
      reset: Date.now() + 3600000,
    };
  }
  
  const limiter = rateLimiters[limiterKey];
  if (!limiter) {
    return {
      success: true,
      limit: 999999,
      remaining: 999999,
      reset: Date.now() + 3600000,
    };
  }
  
  // Handle both Upstash and memory rate limiters
  const result = await limiter.limit(identifier);
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Extract client IP from request
 */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const cfConnectingIp = headers.get('cf-connecting-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  return 'unknown';
}

/**
 * Rate limit middleware for API routes
 */
export async function rateLimitMiddleware(
  request: Request,
  limiterKey: RateLimiterKey,
  identifier?: string
) {
  const id = identifier || getClientIp(request);
  const result = await checkRateLimit(limiterKey, id);
  
  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.reset).toISOString(),
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }
  
  return null; // Allow request to proceed
}
