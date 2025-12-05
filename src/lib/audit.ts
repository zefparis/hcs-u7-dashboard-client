/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { prisma } from './prisma';

export enum AuditAction {
  // Authentication
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Security changes
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  HCS_CODE_CHANGED = 'HCS_CODE_CHANGED',
  
  // API Keys
  API_KEY_ROTATED = 'API_KEY_ROTATED',
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_DELETED = 'API_KEY_DELETED',
  API_KEY_VIEWED = 'API_KEY_VIEWED',
  
  // Profile
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  PROFILE_VIEWED = 'PROFILE_VIEWED',
  
  // Usage
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  QUOTA_WARNING_80 = 'QUOTA_WARNING_80',
  USAGE_EXPORT = 'USAGE_EXPORT',
  
  // Billing
  PLAN_UPGRADED = 'PLAN_UPGRADED',
  PLAN_DOWNGRADED = 'PLAN_DOWNGRADED',
  PAYMENT_METHOD_UPDATED = 'PAYMENT_METHOD_UPDATED',
  
  // Configuration
  SCA_CONFIG_UPDATED = 'SCA_CONFIG_UPDATED',
  SECURITY_SETTINGS_UPDATED = 'SECURITY_SETTINGS_UPDATED',
}

export interface AuditLogData {
  tenantId: string;
  tenantEmail?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  result?: 'success' | 'failure';
}

export async function createAuditLog(data: AuditLogData) {
  try {
    // Get tenant email if not provided
    let tenantEmail = data.tenantEmail;
    if (!tenantEmail) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: data.tenantId },
        select: { email: true }
      }) as any;
      tenantEmail = tenant?.email || 'unknown';
    }
    
    return await prisma.auditLog.create({
      data: {
        adminUserId: data.tenantId, // In tenant context, tenant acts as their own admin
        adminEmail: tenantEmail,
        action: data.action,
        entityType: data.entityType || 'Tenant',
        entityId: data.entityId || data.tenantId,
        changes: data.changes || {},
        ipAddress: data.ipAddress || 'unknown',
        userAgent: data.userAgent || 'unknown',
        createdAt: new Date(),
      } as any,
    });
  } catch (error) {
    console.error('[Audit] Failed to create audit log:', error);
    // Don't throw - audit logging should not break the application
    return null;
  }
}

/**
 * Helper to extract IP and User Agent from Request
 */
export function getRequestMetadata(req: Request | Headers): {
  ipAddress: string;
  userAgent: string;
} {
  const headers = req instanceof Headers ? req : new Headers(req.headers);
  
  // Extract IP address (in order of preference)
  const ipAddress = 
    headers.get('cf-connecting-ip') || // Cloudflare
    headers.get('x-forwarded-for')?.split(',')[0].trim() || // Proxy/Load balancer
    headers.get('x-real-ip') || // Nginx
    headers.get('x-client-ip') || // Various proxies
    'unknown';
  
  // Extract User Agent
  const userAgent = headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}

/**
 * Log successful login
 */
export async function auditLoginSuccess(
  tenantId: string,
  email: string,
  metadata?: { ipAddress?: string; userAgent?: string }
) {
  await createAuditLog({
    tenantId,
    tenantEmail: email,
    action: AuditAction.LOGIN_SUCCESS,
    result: 'success',
    ...metadata,
  });
}

/**
 * Log failed login attempt
 */
export async function auditLoginFailed(
  email: string,
  reason: string,
  metadata?: { ipAddress?: string; userAgent?: string }
) {
  await createAuditLog({
    tenantId: 'system', // No tenant ID for failed logins
    tenantEmail: email,
    action: AuditAction.LOGIN_FAILED,
    result: 'failure',
    metadata: { reason },
    ...metadata,
  });
}

/**
 * Log password change
 */
export async function auditPasswordChanged(
  tenantId: string,
  metadata?: { ipAddress?: string; userAgent?: string }
) {
  await createAuditLog({
    tenantId,
    action: AuditAction.PASSWORD_CHANGED,
    result: 'success',
    ...metadata,
  });
}

/**
 * Log HCS code change
 */
export async function auditHcsCodeChanged(
  tenantId: string,
  metadata?: { ipAddress?: string; userAgent?: string }
) {
  await createAuditLog({
    tenantId,
    action: AuditAction.HCS_CODE_CHANGED,
    result: 'success',
    ...metadata,
  });
}

/**
 * Log API key rotation
 */
export async function auditApiKeyRotated(
  tenantId: string,
  keyType: 'test' | 'live',
  newKeyId: string,
  oldKeyId?: string,
  metadata?: { ipAddress?: string; userAgent?: string }
) {
  await createAuditLog({
    tenantId,
    action: AuditAction.API_KEY_ROTATED,
    entityType: 'ApiKey',
    entityId: newKeyId,
    changes: { keyType, oldKeyId },
    result: 'success',
    ...metadata,
  });
}

/**
 * Log profile update
 */
export async function auditProfileUpdated(
  tenantId: string,
  changes: Record<string, any>,
  metadata?: { ipAddress?: string; userAgent?: string }
) {
  await createAuditLog({
    tenantId,
    action: AuditAction.PROFILE_UPDATED,
    changes,
    result: 'success',
    ...metadata,
  });
}

/**
 * Log quota exceeded
 */
export async function auditQuotaExceeded(
  tenantId: string,
  currentUsage: number,
  quota: number,
  metadata?: { ipAddress?: string; userAgent?: string }
) {
  await createAuditLog({
    tenantId,
    action: AuditAction.QUOTA_EXCEEDED,
    metadata: { currentUsage, quota, percentageUsed: (currentUsage / quota) * 100 },
    result: 'failure',
    ...metadata,
  });
}

/**
 * Log usage export
 */
export async function auditUsageExport(
  tenantId: string,
  format: 'csv' | 'json',
  dateRange?: { start: Date; end: Date },
  metadata?: { ipAddress?: string; userAgent?: string }
) {
  await createAuditLog({
    tenantId,
    action: AuditAction.USAGE_EXPORT,
    metadata: { format, dateRange },
    result: 'success',
    ...metadata,
  });
}

/**
 * Get audit logs for a tenant
 */
export async function getTenantAuditLogs(
  tenantId: string,
  options?: {
    limit?: number;
    offset?: number;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const where: any = { adminUserId: tenantId };
  
  if (options?.action) {
    where.action = options.action;
  }
  
  if (options?.startDate && options?.endDate) {
    where.createdAt = {
      gte: options.startDate,
      lte: options.endDate,
    };
  }
  
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });
  
  return logs;
}
