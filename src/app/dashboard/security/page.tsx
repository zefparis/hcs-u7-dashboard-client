import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getSecurityData } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Security – HCS-U7 Dashboard",
};

function getRiskColor(score: number) {
  if (score <= 0.3) return "text-emerald-600 dark:text-emerald-400";
  if (score <= 0.6) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getRiskBgColor(score: number) {
  if (score <= 0.3) return "bg-emerald-500";
  if (score <= 0.6) return "bg-amber-500";
  return "bg-red-500";
}

function getActionColor(action: string) {
  switch (action) {
    case "allow":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "challenge":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "step_up":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "deny":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400";
  }
}

export default async function SecurityPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.id as string | undefined;

  if (!tenantId) {
    redirect("/login");
  }

  const securityData = await getSecurityData(tenantId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Cognitive Firewall</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Multi-signal security analysis and risk scoring.
          </p>
        </div>
        <Badge>Defense-in-Depth</Badge>
      </div>

      {/* Firewall Architecture Diagram */}
      <Card>
        <CardHeader>
          <CardTitle>HCS-U7 Cognitive Firewall Architecture</CardTitle>
          <CardDescription>Multi-layer signal analysis for fraud detection.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 font-mono text-xs dark:border-zinc-800 dark:bg-zinc-900/50">
            <pre className="overflow-x-auto text-zinc-600 dark:text-zinc-400">{`
┌─────────────────────────────────────────────────────────────────┐
│  HCS-U7 COGNITIVE FIREWALL                                      │
│                                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │   HCS   │ │ Device  │ │ Network │ │Behavior │ │ Trust   │   │
│  │  Score  │ │  Risk   │ │  Risk   │ │ Anomaly │ │ Graph   │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
│       │          │          │          │          │            │
│       └──────────┴──────────┴──────────┴──────────┘            │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │   COMBINER  │                              │
│                    │  + SCA PSD2 │                              │
│                    └──────┬──────┘                              │
│                           │                                     │
│              ┌────────────┼────────────┐                        │
│              ▼            ▼            ▼                        │
│           ALLOW      CHALLENGE       DENY                       │
└─────────────────────────────────────────────────────────────────┘
            `}</pre>
          </div>
        </CardContent>
      </Card>

      {/* Signal Engines */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-2 w-2 rounded-full bg-blue-500" />
              Device Risk
            </CardTitle>
            <CardDescription>Bot & emulator detection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">WebDriver Detection</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Headless Browser</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Emulator Detection</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">VM Detection</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Fingerprint Anomalies</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-2 w-2 rounded-full bg-purple-500" />
              Network Risk
            </CardTitle>
            <CardDescription>VPN, Tor & proxy detection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">VPN Detection</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Tor Exit Nodes</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Proxy Detection</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Datacenter IPs</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">High-Risk Countries</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
              Behavior Anomaly
            </CardTitle>
            <CardDescription>Keystroke & mouse dynamics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Keystroke Dynamics</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Mouse Velocity</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Instant Form Fill</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Copy-Paste Detection</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Session Timing</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              Trust Graph
            </CardTitle>
            <CardDescription>User & device relationships</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Account Age</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Device History</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Chargeback History</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Fraud Ring Detection</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Successful Transactions</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-2 w-2 rounded-full bg-cyan-500" />
              HCS Score
            </CardTitle>
            <CardDescription>Human Cognitive Signature</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Quick-Auth Token</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Rotating Code</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Vocal Metrics</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Cognitive Profile</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Element Matching</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-2 w-2 rounded-full bg-pink-500" />
              Celestial Entropy
            </CardTitle>
            <CardDescription>Astronomical entropy layer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Planetary Positions</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Lunar Phase</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Celestial Nonce</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Celestial Signature</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Risk Modifier</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Score Combiner Presets</CardTitle>
          <CardDescription>Available configuration presets for the signal combiner.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {securityData.presets.map((preset) => (
              <div
                key={preset.name}
                className={`rounded-lg border p-4 ${
                  preset.active
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{preset.name}</span>
                  {preset.active && (
                    <Badge className="text-[10px]">Active</Badge>
                  )}
                </div>
                <p className={`mt-1 text-xs ${preset.active ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-500"}`}>
                  {preset.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Modules */}
      <Card>
        <CardHeader>
          <CardTitle>Enterprise Security Modules</CardTitle>
          <CardDescription>Additional security layers available in HCS-U7.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-medium">Rate Limiting</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Multi-layer rate limiting: global (100 req/min), auth (10 req/min), sensitive (5 req/min), burst (10 req/sec).
              </p>
            </div>
            <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-medium">WAF (Web Application Firewall)</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Protection against SQLi, XSS, Path Traversal, Command Injection, LDAP/XML Injection, Header Injection.
              </p>
            </div>
            <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-medium">Geo-Velocity</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Impossible travel detection using Haversine formula. Detects Paris → Tokyo in 1 minute scenarios.
              </p>
            </div>
            <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-medium">IP Reputation</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Real-time IP scoring: datacenter detection, Tor nodes, VPN, high-risk countries, threat reporting.
              </p>
            </div>
            <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-medium">Request Integrity</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                HMAC signatures for request integrity. Anti-replay protection with nonce validation.
              </p>
            </div>
            <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-medium">Security Headers</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                CSP, HSTS (2 years), X-Frame-Options, X-Content-Type-Options, Permissions-Policy, Cross-Origin policies.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle>Security Score</CardTitle>
          <CardDescription>Overall security posture based on configuration.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-5xl font-bold text-emerald-600">
              {securityData.securityScore}
            </div>
            <div className="flex-1">
              <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${securityData.securityScore}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Defense-in-Depth score based on enabled security modules and configuration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
