import "server-only";

import { randomBytes } from "crypto";
import bcrypt from "bcrypt";

import { pool } from "@/lib/db";
import { checkBackendHealth, type BackendHealth } from "@/lib/hcs-backend";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type OverviewUsagePoint = {
  date: string;
  requests: number;
  cost: number;
};

export type OverviewRecentCall = {
  id: string;
  timestamp: string;
  endpoint: string;
  status: number;
  latencyMs: number;
  cost: number;
};

export type OverviewHealth = BackendHealth;

export type OverviewResponse = {
  quota: {
    used: number;
    total: number;
    period: string;
    resetAt: string;
  };
  usageLast7Days: OverviewUsagePoint[];
  usageLast30Days: OverviewUsagePoint[];
  recentCalls: OverviewRecentCall[];
  backendHealth: OverviewHealth;
};

export type ApiKey = {
  id: string;
  keyPrefix: string;
  lastFourChars: string;
  environment: string;
  name: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  maskedKey: string;
};

export type ApiKeysResponse = {
  keys: ApiKey[];
  testKey: string | null;
  liveKeyMasked: string;
};

export type UsageLog = {
  id: string;
  timestamp: string;
  endpoint: string;
  status: number;
  cost: number;
  durationMs: number;
  method: string;
};

export type UsageResponse = {
  logs: UsageLog[];
  daily: OverviewUsagePoint[];
};

export type IntegrationExample = {
  curl: string;
  node: string;
  python: string;
};

export type IntegrationExamples = {
  verifyHuman: IntegrationExample;
  adaptiveVerify: IntegrationExample;
  quickAuth: IntegrationExample;
  secureLogin: IntegrationExample;
  scaEvaluate: IntegrationExample;
};

export type BillingInvoice = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  invoiceUrl?: string | null;
};

export type BillingInfo = {
  currentPlan: {
    name: string;
    quota: number;
    used: number;
    period: string;
  };
  checkoutUrl?: string | null;
  customerPortalUrl?: string | null;
  invoices: BillingInvoice[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: format usage data with missing days filled
// ─────────────────────────────────────────────────────────────────────────────

function formatUsageData(rows: any[], days: number): OverviewUsagePoint[] {
  const result: OverviewUsagePoint[] = [];
  const dataMap = new Map(
    rows.map((r) => [new Date(r.date).toISOString().split("T")[0], r])
  );

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const data = dataMap.get(dateStr);
    result.push({
      date: dateStr,
      requests: data ? Number(data.requests) : 0,
      cost: data ? Number(data.cost) : 0,
    });
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions (direct DB queries)
// ─────────────────────────────────────────────────────────────────────────────

export async function getOverview(tenantId: string): Promise<OverviewResponse> {
  const client = await pool.connect();

  try {
    // Get tenant quota info
    const tenantResult = await client.query(
      `SELECT "monthlyQuota", "currentUsage" FROM tenants WHERE id = $1`,
      [tenantId]
    );
    const tenant = tenantResult.rows[0];

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Calculate period dates
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get usage for last 7 days
    const usage7Result = await client.query(
      `SELECT DATE("createdAt") as date, COUNT(*) as requests, COALESCE(SUM(cost), 0) as cost
       FROM usage_logs 
       WHERE "tenantId" = $1 AND "createdAt" >= NOW() - INTERVAL '7 days'
       GROUP BY DATE("createdAt")
       ORDER BY date DESC`,
      [tenantId]
    );

    // Get usage for last 30 days
    const usage30Result = await client.query(
      `SELECT DATE("createdAt") as date, COUNT(*) as requests, COALESCE(SUM(cost), 0) as cost
       FROM usage_logs 
       WHERE "tenantId" = $1 AND "createdAt" >= NOW() - INTERVAL '30 days'
       GROUP BY DATE("createdAt")
       ORDER BY date ASC`,
      [tenantId]
    );

    // Get recent API calls
    const recentCallsResult = await client.query(
      `SELECT id, "createdAt" as timestamp, endpoint, "statusCode" as status, 
              COALESCE(cost, 0) as cost, COALESCE("responseTime", 0) as "latencyMs"
       FROM usage_logs 
       WHERE "tenantId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 10`,
      [tenantId]
    );

    return {
      quota: {
        used: tenant.currentUsage || 0,
        total: tenant.monthlyQuota || 10000,
        period: `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`,
        resetAt: periodEnd.toISOString(),
      },
      usageLast7Days: formatUsageData(usage7Result.rows, 7),
      usageLast30Days: formatUsageData(usage30Result.rows, 30),
      recentCalls: recentCallsResult.rows.map((row) => ({
        id: row.id,
        timestamp: row.timestamp.toISOString(),
        endpoint: row.endpoint || "/api/unknown",
        status: row.status || 200,
        latencyMs: row.latencyMs || 0,
        cost: Number(row.cost) || 0,
      })),
      backendHealth: await checkBackendHealth(),
    };
  } finally {
    client.release();
  }
}

export async function getApiKeys(tenantId: string): Promise<ApiKeysResponse> {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT id, "keyPrefix", "lastFourChars", environment, name, "createdAt", "lastUsedAt"
       FROM api_keys 
       WHERE "tenantId" = $1 AND "isActive" = true
       ORDER BY "createdAt" DESC`,
      [tenantId]
    );

    const keys: ApiKey[] = result.rows.map((row) => ({
      id: row.id,
      keyPrefix: row.keyPrefix,
      lastFourChars: row.lastFourChars,
      environment: row.environment,
      name: row.name,
      createdAt: row.createdAt.toISOString(),
      lastUsedAt: row.lastUsedAt?.toISOString() || null,
      maskedKey: `${row.keyPrefix}_****${row.lastFourChars}`,
    }));

    // Find test and live keys
    const testKey = keys.find((k) => k.environment === "DEVELOPMENT" || k.keyPrefix.includes("test"));
    const liveKey = keys.find((k) => k.environment === "PRODUCTION" || k.keyPrefix.includes("live"));

    return {
      keys,
      testKey: testKey?.maskedKey || null,
      liveKeyMasked: liveKey?.maskedKey || "hcs_sk_live_****xxxx",
    };
  } finally {
    client.release();
  }
}

// Generate a new API key with the HCS format
function generateApiKey(type: "test" | "live"): { fullKey: string; prefix: string; lastFour: string } {
  const env = type === "test" ? "test" : "live";
  const randomPart = randomBytes(24).toString("base64url"); // ~32 chars
  const prefix = `hcs_sk_${env}`;
  const fullKey = `${prefix}_${randomPart}`;
  const lastFour = randomPart.slice(-4);
  
  return { fullKey, prefix, lastFour };
}

export type RotateApiKeyResult = {
  newKey: string; // Full key shown only once
  keys: ApiKeysResponse;
};

export async function rotateApiKey(
  tenantId: string,
  params: { type: "test" | "live" }
): Promise<RotateApiKeyResult> {
  const client = await pool.connect();

  try {
    // Generate new key
    const { fullKey, prefix, lastFour } = generateApiKey(params.type);
    const keyHash = await bcrypt.hash(fullKey, 10);
    const environment = params.type === "test" ? "DEVELOPMENT" : "PRODUCTION";

    // Deactivate old keys of the same type
    await client.query(
      `UPDATE api_keys 
       SET "isActive" = false, "updatedAt" = NOW()
       WHERE "tenantId" = $1 
         AND environment = $2 
         AND "isActive" = true`,
      [tenantId, environment]
    );

    // Create new key
    const newKeyId = randomBytes(16).toString("hex");
    await client.query(
      `INSERT INTO api_keys (id, "keyHash", "keyPrefix", "lastFourChars", environment, "tenantId", "isActive", "createdAt", scopes)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), ARRAY['read', 'write'])`,
      [newKeyId, keyHash, prefix, lastFour, environment, tenantId]
    );

    // Get updated keys
    const keys = await getApiKeys(tenantId);

    return {
      newKey: fullKey,
      keys,
    };
  } finally {
    client.release();
  }
}

export interface UsageLogsOptions {
  limit?: number;
  cursor?: string; // ID of the last log from previous page
  startDate?: Date;
  endDate?: Date;
  endpoint?: string;
  statusCode?: number;
  method?: string;
}

export interface PaginatedUsageResponse extends UsageResponse {
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    currentCount: number;
  };
  aggregates?: {
    statusDistribution: any[];
    endpointDistribution: any[];
    avgResponseTime: number;
  };
}

export async function getUsageLogs(
  tenantId: string,
  options: UsageLogsOptions = {}
): Promise<PaginatedUsageResponse> {
  const client = await pool.connect();
  const limit = options.limit || 50;

  try {
    // Build WHERE clause for filters
    let whereConditions = [`"tenantId" = $1`];
    let params: any[] = [tenantId];
    let paramIndex = 2;

    if (options.cursor) {
      whereConditions.push(`id < $${paramIndex}`);
      params.push(options.cursor);
      paramIndex++;
    }

    if (options.startDate && options.endDate) {
      whereConditions.push(`"createdAt" BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      params.push(options.startDate, options.endDate);
      paramIndex += 2;
    }

    if (options.endpoint) {
      whereConditions.push(`endpoint ILIKE $${paramIndex}`);
      params.push(`%${options.endpoint}%`);
      paramIndex++;
    }

    if (options.statusCode) {
      whereConditions.push(`"statusCode" = $${paramIndex}`);
      params.push(options.statusCode);
      paramIndex++;
    }

    if (options.method) {
      whereConditions.push(`method = $${paramIndex}`);
      params.push(options.method);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get recent logs (fetch limit + 1 to check if there's more)
    const logsResult = await client.query(
      `SELECT id, "createdAt" as timestamp, endpoint, "statusCode" as status, 
              COALESCE(cost, 0) as cost, COALESCE("responseTime", 0) as "durationMs", method,
              "ipAddress", "userAgent"
       FROM usage_logs 
       WHERE ${whereClause}
       ORDER BY "createdAt" DESC, id DESC
       LIMIT $${paramIndex}`,
      [...params, limit + 1]
    );

    const hasMore = logsResult.rows.length > limit;
    const logs = hasMore ? logsResult.rows.slice(0, -1) : logsResult.rows;
    const nextCursor = hasMore ? logs[logs.length - 1]?.id : null;

    // Get aggregated data in parallel
    const [dailyResult, statusDistribution, endpointDistribution, avgResponseTime] = await Promise.all([
      // Daily aggregates
      client.query(
        `SELECT DATE("createdAt") as date, COUNT(*) as requests, COALESCE(SUM(cost), 0) as cost
         FROM usage_logs 
         WHERE "tenantId" = $1 AND "createdAt" >= NOW() - INTERVAL '30 days'
         GROUP BY DATE("createdAt")
         ORDER BY date ASC`,
        [tenantId]
      ),
      // Status code distribution
      client.query(
        `SELECT "statusCode", COUNT(*) as count
         FROM usage_logs
         WHERE "tenantId" = $1 AND "createdAt" >= NOW() - INTERVAL '7 days'
         GROUP BY "statusCode"
         ORDER BY count DESC`,
        [tenantId]
      ),
      // Top endpoints
      client.query(
        `SELECT endpoint, COUNT(*) as count, AVG("responseTime") as avg_response_time
         FROM usage_logs
         WHERE "tenantId" = $1 AND "createdAt" >= NOW() - INTERVAL '7 days'
         GROUP BY endpoint
         ORDER BY count DESC
         LIMIT 10`,
        [tenantId]
      ),
      // Average response time
      client.query(
        `SELECT AVG("responseTime") as avg_response_time
         FROM usage_logs
         WHERE "tenantId" = $1 AND "createdAt" >= NOW() - INTERVAL '7 days' AND "responseTime" > 0`,
        [tenantId]
      ),
    ]);

    return {
      logs: logs.map((row) => ({
        id: row.id,
        timestamp: row.timestamp.toISOString(),
        endpoint: row.endpoint || "/api/unknown",
        status: row.status || 200,
        cost: Number(row.cost) || 0,
        durationMs: row.durationMs || 0,
        method: row.method || "POST",
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
      })),
      daily: formatUsageData(dailyResult.rows, 30),
      pagination: {
        hasMore,
        nextCursor,
        currentCount: logs.length,
      },
      aggregates: {
        statusDistribution: statusDistribution.rows,
        endpointDistribution: endpointDistribution.rows,
        avgResponseTime: avgResponseTime.rows[0]?.avg_response_time || 0,
      },
    };
  } finally {
    client.release();
  }
}

export async function getIntegrationExamples(
  tenantId: string
): Promise<IntegrationExamples> {
  // Get an API key for examples
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT "keyPrefix", "lastFourChars" FROM api_keys 
       WHERE "tenantId" = $1 AND "isActive" = true
       LIMIT 1`,
      [tenantId]
    );

    const keyPlaceholder =
      result.rows[0]
        ? `${result.rows[0].keyPrefix}_****${result.rows[0].lastFourChars}`
        : "hcs_sk_test_****xxxx";

    const baseUrl = "https://hcs-u7-backend-production.up.railway.app";

    return {
      verifyHuman: {
        curl: `curl -X POST ${baseUrl}/api/verify-human \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${keyPlaceholder}" \\
  -d '{"token": "user-token-here", "sessionId": "optional-session-id"}'`,
        node: `const response = await fetch('${baseUrl}/api/verify-human', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${keyPlaceholder}',
  },
  body: JSON.stringify({ token: 'user-token-here' }),
});
const data = await response.json();
// { ok: true, isHuman: true, score: 0.82, riskLevel: "low" }`,
        python: `import requests

response = requests.post(
    '${baseUrl}/api/verify-human',
    headers={'x-api-key': '${keyPlaceholder}'},
    json={'token': 'user-token-here'}
)
data = response.json()
print(data['isHuman'], data['score'])`,
      },
      adaptiveVerify: {
        curl: `curl -X POST ${baseUrl}/api/adaptive-verify \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${keyPlaceholder}" \\
  -d '{
    "hcsToken": "quick-auth-token",
    "context": {
      "channel": "payment",
      "amount": 149.99,
      "trustedDevice": true
    }
  }'`,
        node: `const response = await fetch('${baseUrl}/api/adaptive-verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${keyPlaceholder}',
  },
  body: JSON.stringify({
    hcsToken: 'quick-auth-token',
    context: { channel: 'payment', amount: 149.99 }
  }),
});
const data = await response.json();
// { decision: "allow" | "step_up" | "deny", riskLevel, score, recommendedActions }`,
        python: `import requests

response = requests.post(
    '${baseUrl}/api/adaptive-verify',
    headers={'x-api-key': '${keyPlaceholder}'},
    json={
        'hcsToken': 'quick-auth-token',
        'context': {'channel': 'payment', 'amount': 149.99}
    }
)
data = response.json()
print(data['decision'], data['recommendedActions'])`,
      },
      quickAuth: {
        curl: `curl -X POST ${baseUrl}/api/quick-auth \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${keyPlaceholder}" \\
  -d '{
    "userId": "user-123",
    "reactionTimes": [350, 420, 380],
    "errorRate": 0.05
  }'`,
        node: `const response = await fetch('${baseUrl}/api/quick-auth', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${keyPlaceholder}',
  },
  body: JSON.stringify({
    userId: 'user-123',
    reactionTimes: [350, 420, 380],
    errorRate: 0.05
  }),
});
const data = await response.json();
// { token: "jwt-token", isHuman: true, score: 0.78, expiresInSeconds: 900 }`,
        python: `import requests

response = requests.post(
    '${baseUrl}/api/quick-auth',
    headers={'x-api-key': '${keyPlaceholder}'},
    json={
        'userId': 'user-123',
        'reactionTimes': [350, 420, 380],
        'errorRate': 0.05
    }
)
data = response.json()
# Use data['token'] for subsequent adaptive-verify or secure-login calls`,
      },
      secureLogin: {
        curl: `curl -X POST ${baseUrl}/api/secure-login \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${keyPlaceholder}" \\
  -d '{
    "email": "user@example.com",
    "hcsToken": "quick-auth-token-from-previous-step"
  }'`,
        node: `const response = await fetch('${baseUrl}/api/secure-login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${keyPlaceholder}',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    hcsToken: quickAuthToken
  }),
});
const data = await response.json();
// { decision: "allow" | "step_up" | "deny", recommendedActions: ["require_2fa"] }`,
        python: `import requests

response = requests.post(
    '${baseUrl}/api/secure-login',
    headers={'x-api-key': '${keyPlaceholder}'},
    json={
        'email': 'user@example.com',
        'hcsToken': quick_auth_token
    }
)
data = response.json()
if data['decision'] == 'allow':
    # Proceed with login
    pass`,
      },
      scaEvaluate: {
        curl: `curl -X POST ${baseUrl}/api/sca/evaluate \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${keyPlaceholder}" \\
  -d '{
    "amount": 50,
    "currency": "EUR",
    "psuId": "user_123",
    "hcsToken": "optional-hcs-token",
    "context": { "channel": "payment" }
  }'`,
        node: `const response = await fetch('${baseUrl}/api/sca/evaluate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${keyPlaceholder}',
  },
  body: JSON.stringify({
    amount: 50,
    currency: 'EUR',
    psuId: 'user_123',
    context: { channel: 'payment' }
  }),
});
const data = await response.json();
// { decision: "EXEMPT" | "SCA_REQUIRED" | "DENY", exemptionType: "LOW_VALUE" }`,
        python: `import requests

response = requests.post(
    '${baseUrl}/api/sca/evaluate',
    headers={'x-api-key': '${keyPlaceholder}'},
    json={
        'amount': 50,
        'currency': 'EUR',
        'psuId': 'user_123',
        'context': {'channel': 'payment'}
    }
)
data = response.json()
if data['decision'] == 'EXEMPT':
    print(f"Exemption: {data['exemptionType']}")`,
      },
    };
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tenant Profile
// ─────────────────────────────────────────────────────────────────────────────

export type TenantProfile = {
  id: string;
  email: string;
  fullName: string;
  company: string | null;
  website: string | null;
  plan: string;
  status: string;
  monthlyQuota: number;
  currentUsage: number;
  createdAt: string;
  trialEndsAt: string | null;
  subscriptionStartedAt: string | null;
};

export async function getTenantProfile(tenantId: string): Promise<TenantProfile> {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT id, email, "fullName", company, website, plan, status, 
              "monthlyQuota", "currentUsage", "createdAt", "trialEndsAt", "subscriptionStartedAt"
       FROM tenants WHERE id = $1`,
      [tenantId]
    );
    const tenant = result.rows[0];

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    return {
      id: tenant.id,
      email: tenant.email,
      fullName: tenant.fullName || "",
      company: tenant.company,
      website: tenant.website,
      plan: tenant.plan,
      status: tenant.status,
      monthlyQuota: tenant.monthlyQuota || 10000,
      currentUsage: tenant.currentUsage || 0,
      createdAt: tenant.createdAt?.toISOString() || new Date().toISOString(),
      trialEndsAt: tenant.trialEndsAt?.toISOString() || null,
      subscriptionStartedAt: tenant.subscriptionStartedAt?.toISOString() || null,
    };
  } finally {
    client.release();
  }
}

export async function updateTenantProfile(
  tenantId: string,
  data: { fullName?: string; company?: string; website?: string }
): Promise<TenantProfile> {
  const client = await pool.connect();

  try {
    await client.query(
      `UPDATE tenants 
       SET "fullName" = COALESCE($2, "fullName"),
           company = COALESCE($3, company),
           website = COALESCE($4, website),
           "updatedAt" = NOW()
       WHERE id = $1`,
      [tenantId, data.fullName || null, data.company || null, data.website || null]
    );

    return getTenantProfile(tenantId);
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Security / Cognitive Firewall Data
// ─────────────────────────────────────────────────────────────────────────────

export type SecurityPreset = {
  name: string;
  description: string;
  active: boolean;
};

export type SecurityData = {
  securityScore: number;
  presets: SecurityPreset[];
};

export async function getSecurityData(tenantId: string): Promise<SecurityData> {
  // Security configuration - in production, this would be stored per-tenant
  const presets: SecurityPreset[] = [
    {
      name: "strict",
      description: "Low thresholds, more restrictive. Best for high-value transactions.",
      active: false,
    },
    {
      name: "lenient",
      description: "High thresholds, more permissive. Best for low-risk operations.",
      active: false,
    },
    {
      name: "hcsFocused",
      description: "HCS score weighted at 50%. Prioritizes cognitive signature.",
      active: true,
    },
    {
      name: "behaviorFocused",
      description: "Behavior analysis weighted at 40%. Prioritizes user patterns.",
      active: false,
    },
    {
      name: "noHardRules",
      description: "Pure weighted average. No automatic blocks or allows.",
      active: false,
    },
  ];

  return {
    securityScore: 99.5,
    presets,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCA PSD2 Data
// ─────────────────────────────────────────────────────────────────────────────

export type SCAConfig = {
  lowValueThreshold: number;
  lowValueCumulativeMax: number;
  lowValueMaxOperations: number;
  traEnabled: boolean;
  traThresholds: {
    low: number;
    medium: number;
    high: number;
  };
  hardBlockAmount: number;
};

export type SCADecision = {
  id: string;
  psuId: string;
  amount: number;
  currency: string;
  decision: string;
  exemptionType: string | null;
  riskLevel: string;
  score: number;
  createdAt: string;
};

export type SCAStats = {
  totalDecisions: number;
  exemptCount: number;
  scaRequiredCount: number;
  deniedCount: number;
};

export type SCAData = {
  config: SCAConfig;
  stats: SCAStats;
  decisions: SCADecision[];
};

export async function getSCAData(tenantId: string): Promise<SCAData> {
  // For now, return mock data since SCA decisions are stored in the backend
  // In production, this would query the backend API or a local sca_decisions table
  
  // Default PSD2 compliant configuration
  const config: SCAConfig = {
    lowValueThreshold: 30,
    lowValueCumulativeMax: 100,
    lowValueMaxOperations: 5,
    traEnabled: true,
    traThresholds: {
      low: 500,
      medium: 250,
      high: 100,
    },
    hardBlockAmount: 10000,
  };

  // Mock stats - in production, aggregate from sca_decisions table
  const stats: SCAStats = {
    totalDecisions: 0,
    exemptCount: 0,
    scaRequiredCount: 0,
    deniedCount: 0,
  };

  // Mock decisions - in production, query sca_decisions table
  const decisions: SCADecision[] = [];

  return {
    config,
    stats,
    decisions,
  };
}

export async function getBillingInfo(tenantId: string): Promise<BillingInfo> {
  const client = await pool.connect();

  try {
    // Get tenant info
    const tenantResult = await client.query(
      `SELECT plan, "monthlyQuota", "currentUsage" FROM tenants WHERE id = $1`,
      [tenantId]
    );
    const tenant = tenantResult.rows[0];

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Get billing events / invoices
    const invoicesResult = await client.query(
      `SELECT id, amount, currency, type, "createdAt", "stripePaid"
       FROM billing_events 
       WHERE "tenantId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 10`,
      [tenantId]
    );

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      currentPlan: {
        name: tenant.plan || "FREE",
        quota: tenant.monthlyQuota || 10000,
        used: tenant.currentUsage || 0,
        period: `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`,
      },
      checkoutUrl: null,
      customerPortalUrl: null,
      invoices: invoicesResult.rows.map((row) => ({
        id: row.id,
        amount: Number(row.amount) || 0,
        currency: row.currency || "EUR",
        status: row.stripePaid ? "paid" : "pending",
        createdAt: row.createdAt.toISOString(),
        invoiceUrl: null,
      })),
    };
  } finally {
    client.release();
  }
}
