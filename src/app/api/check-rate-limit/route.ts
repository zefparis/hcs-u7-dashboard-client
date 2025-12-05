/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, type RateLimiterKey } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const { type, identifier } = await req.json();
    
    // Validate type
    const validTypes: RateLimiterKey[] = ['login', 'apiRequest', 'securityChange', 'keyRotation'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid rate limiter type' },
        { status: 400 }
      );
    }
    
    const result = await checkRateLimit(type, identifier);
    
    if (!result.success) {
      return NextResponse.json(result, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.reset).toISOString(),
        }
      });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Rate limit check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
