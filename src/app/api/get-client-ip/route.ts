/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClientIp } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req as unknown as Request);
  
  return NextResponse.json({ ip });
}
