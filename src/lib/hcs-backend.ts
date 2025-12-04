import "server-only";

// ─────────────────────────────────────────────────────────────────────────────
// HCS-U7 Backend Client
// ─────────────────────────────────────────────────────────────────────────────

const HCS_BACKEND_URL = process.env.HCS_BACKEND_URL || "http://localhost:4000";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type BackendHealthResponse = {
  status: "ok" | "error";
  env: "development" | "test" | "production";
};

export type BackendHealth = {
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
  lastCheckedAt: string;
  env?: string;
  error?: string;
};

export type VerifyHumanRequest = {
  token: string;
  sessionId?: string;
  userId?: string;
};

export type VerifyHumanResponse = {
  ok: boolean;
  isHuman: boolean;
  score: number;
  riskLevel: "low" | "medium" | "high";
  sessionId?: string;
  userId?: string;
};

export type AdaptiveVerifyRequest = {
  hcsToken?: string;
  rotatingCode?: string;
  hcsCode?: string;
  context?: {
    ip?: string;
    userAgent?: string;
    deviceId?: string;
    location?: string;
    channel?: "login" | "payment" | "api" | "profile_change" | "signup";
    amount?: number;
    trustedDevice?: boolean;
    previousFailures?: number;
  };
};

export type AdaptiveVerifyResponse = {
  ok: boolean;
  decision: "allow" | "step_up" | "deny";
  riskLevel: "low" | "medium" | "high";
  score: number;
  factors: {
    hasQuickAuthToken: boolean;
    hasRotating: boolean;
    context?: Record<string, unknown>;
  };
  recommendedActions: string[];
  hcs?: {
    element: string;
    cognition: {
      fluid: number;
      crystallized: number;
      verbal: number;
      strategic: number;
      creative: number;
    };
  };
};

export type QuickAuthRequest = {
  userId?: string;
  sessionId?: string;
  deviceId?: string;
  reactionTimes: number[];
  errorRate: number;
};

export type QuickAuthResponse = {
  ok: boolean;
  token: string;
  isHuman: boolean;
  score: number;
  riskLevel: "low" | "medium" | "high";
  expiresInSeconds: number;
};

export type SecureLoginRequest = {
  email?: string;
  username?: string;
  hcsToken: string;
};

export type SecureLoginResponse = {
  ok: boolean;
  decision: "allow" | "step_up" | "deny";
  riskLevel: "low" | "medium" | "high";
  score: number;
  recommendedActions: string[];
  hcs?: {
    tenantId?: string;
    subject?: string;
    email?: string;
    username?: string;
  };
};

export type SCAEvaluateRequest = {
  amount: number;
  currency: string;
  psuId: string;
  hcsToken?: string;
  context?: {
    channel?: string;
    merchantId?: string;
    payeeId?: string;
  };
};

export type SCAEvaluateResponse = {
  decision: "EXEMPT" | "SCA_REQUIRED" | "DENY";
  exemptionType?: "LOW_VALUE" | "TRA" | "TRUSTED_BENEFICIARY" | "RECURRING";
  riskLevel: "low" | "medium" | "high";
  score: number;
  reasons?: string[];
};

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
  exemptionType?: string;
  riskLevel: string;
  score: number;
  createdAt: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Backend Client Functions
// ─────────────────────────────────────────────────────────────────────────────

async function fetchBackend<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    apiKey?: string;
  } = {}
): Promise<T> {
  const { method = "GET", body, apiKey } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const response = await fetch(`${HCS_BACKEND_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || `Backend error: ${response.status}`);
  }

  return response.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────────────────────────────────────

export async function checkBackendHealth(): Promise<BackendHealth> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${HCS_BACKEND_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      return {
        status: "degraded",
        latencyMs,
        lastCheckedAt: new Date().toISOString(),
        error: `HTTP ${response.status}`,
      };
    }

    const data: BackendHealthResponse = await response.json();

    return {
      status: data.status === "ok" ? "healthy" : "degraded",
      latencyMs,
      lastCheckedAt: new Date().toISOString(),
      env: data.env,
    };
  } catch (error) {
    return {
      status: "down",
      latencyMs: Date.now() - startTime,
      lastCheckedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HCS-U7 API Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export async function verifyHuman(
  apiKey: string,
  request: VerifyHumanRequest
): Promise<VerifyHumanResponse> {
  return fetchBackend<VerifyHumanResponse>("/api/verify-human", {
    method: "POST",
    body: request,
    apiKey,
  });
}

export async function adaptiveVerify(
  apiKey: string,
  request: AdaptiveVerifyRequest
): Promise<AdaptiveVerifyResponse> {
  return fetchBackend<AdaptiveVerifyResponse>("/api/adaptive-verify", {
    method: "POST",
    body: request,
    apiKey,
  });
}

export async function quickAuth(
  apiKey: string,
  request: QuickAuthRequest
): Promise<QuickAuthResponse> {
  return fetchBackend<QuickAuthResponse>("/api/quick-auth", {
    method: "POST",
    body: request,
    apiKey,
  });
}

export async function secureLogin(
  apiKey: string,
  request: SecureLoginRequest
): Promise<SecureLoginResponse> {
  return fetchBackend<SecureLoginResponse>("/api/secure-login", {
    method: "POST",
    body: request,
    apiKey,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SCA PSD2 Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export async function evaluateSCA(
  apiKey: string,
  request: SCAEvaluateRequest
): Promise<SCAEvaluateResponse> {
  return fetchBackend<SCAEvaluateResponse>("/api/sca/evaluate", {
    method: "POST",
    body: request,
    apiKey,
  });
}

export async function getSCAConfig(apiKey: string): Promise<SCAConfig> {
  return fetchBackend<SCAConfig>("/api/sca/config", {
    method: "GET",
    apiKey,
  });
}

export async function updateSCAConfig(
  apiKey: string,
  config: Partial<SCAConfig>
): Promise<SCAConfig> {
  return fetchBackend<SCAConfig>("/api/sca/config", {
    method: "PATCH",
    body: config,
    apiKey,
  });
}

export async function getSCADecisions(
  apiKey: string,
  params?: { psuId?: string; limit?: number }
): Promise<{ decisions: SCADecision[] }> {
  const searchParams = new URLSearchParams();
  if (params?.psuId) searchParams.set("psuId", params.psuId);
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  const endpoint = `/api/sca/decisions${query ? `?${query}` : ""}`;

  return fetchBackend<{ decisions: SCADecision[] }>(endpoint, {
    method: "GET",
    apiKey,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Export backend URL for reference
// ─────────────────────────────────────────────────────────────────────────────

export function getBackendUrl(): string {
  return HCS_BACKEND_URL;
}
