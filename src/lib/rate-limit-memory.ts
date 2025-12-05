/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

/**
 * In-memory rate limiter for development and builds
 * This is NOT suitable for production as it doesn't persist across servers
 */
class MemoryRateLimiter {
  private attempts: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(
    private maxAttempts: number,
    private windowMs: number
  ) {}

  async limit(identifier: string) {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    // Clean expired records
    if (record && now > record.resetAt) {
      this.attempts.delete(identifier);
    }

    const currentRecord = this.attempts.get(identifier);

    if (!currentRecord) {
      // First attempt
      this.attempts.set(identifier, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      
      return {
        success: true,
        limit: this.maxAttempts,
        remaining: this.maxAttempts - 1,
        reset: now + this.windowMs,
      };
    }

    if (currentRecord.count >= this.maxAttempts) {
      // Rate limit exceeded
      return {
        success: false,
        limit: this.maxAttempts,
        remaining: 0,
        reset: currentRecord.resetAt,
      };
    }

    // Increment counter
    currentRecord.count++;
    this.attempts.set(identifier, currentRecord);

    return {
      success: true,
      limit: this.maxAttempts,
      remaining: this.maxAttempts - currentRecord.count,
      reset: currentRecord.resetAt,
    };
  }
}

// Create rate limiters with different configurations
export const memoryRateLimiters = {
  apiRequest: new MemoryRateLimiter(1000, 60 * 60 * 1000), // 1000 req/hour
  login: new MemoryRateLimiter(5, 15 * 60 * 1000), // 5 attempts/15min
  securityChange: new MemoryRateLimiter(3, 60 * 60 * 1000), // 3 changes/hour
  keyRotation: new MemoryRateLimiter(5, 24 * 60 * 60 * 1000), // 5 rotations/day
};

export default memoryRateLimiters;
