/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkBackendHealth } from '@/lib/hcs-backend';

export async function GET(req: NextRequest) {
  // Vérifier IP autorisée (localhost uniquement pour le dev)
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const isLocalhost = ip === '127.0.0.1' || ip?.startsWith('192.168.') || ip?.startsWith('10.');
  
  // En production, exiger une authentification
  if (process.env.NODE_ENV === 'production') {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (!isLocalhost) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };
  
  // Check database health
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'healthy',
      latencyMs: Date.now() - startTime,
    };
  } catch (error) {
    checks.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
  
  // Check backend health
  try {
    const backendHealth = await checkBackendHealth();
    checks.backend = backendHealth;
  } catch (error) {
    checks.backend = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
  
  // Check session (if authenticated)
  const session = await getServerSession(authOptions);
  if (session) {
    checks.session = {
      user: session.user?.email,
      expiresAt: session.expires,
    };
  }
  
  // Overall status
  const allHealthy = 
    checks.database?.status === 'healthy' && 
    (checks.backend?.status === 'healthy' || checks.backend?.status === 'ok');
  
  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
    },
    { 
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
