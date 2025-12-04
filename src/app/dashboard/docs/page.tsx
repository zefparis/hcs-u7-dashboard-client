import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getApiKeys } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";

export const metadata: Metadata = {
  title: "Documentation – HCS-U7 Dashboard",
  description: "API documentation and integration guides",
};

export default async function DocsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.id as string | undefined;

  if (!tenantId) {
    redirect("/login");
  }

  // Get API keys for examples
  const apiKeys = await getApiKeys(tenantId);
  const apiKey = apiKeys.testKey || apiKeys.liveKeyMasked || "hcs_sk_test_****xxxx";
  const baseUrl = "https://hcs-u7-backend-production.up.railway.app";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Documentation</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            API documentation and integration examples for HCS-U7.
          </p>
        </div>
        <Badge>Your API key is included in examples</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>
            Get started with the HCS-U7 API in minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">1. Get your API key</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Generate an API key from the{" "}
              <a href="/dashboard/api-keys" className="text-blue-600 hover:underline dark:text-blue-400">
                API Keys page
              </a>
              . Use test keys for development and live keys for production.
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium">2. Make your first request</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              All API requests require an <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">x-api-key</code> header.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">3. Handle responses</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              All endpoints return JSON with an <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">ok</code> boolean and relevant data.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verify Human</CardTitle>
          <CardDescription>
            Verify if a user is human based on their cognitive signature.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Endpoint</div>
            <code className="block rounded-md bg-zinc-100 p-2 text-xs dark:bg-zinc-900">
              POST {baseUrl}/api/verify-human
            </code>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">cURL Example</div>
              <CopyButton
                value={`curl -X POST ${baseUrl}/api/verify-human \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{"token": "user-cognitive-token", "sessionId": "optional-session-id"}'`}
                label="Copy"
              />
            </div>
            <pre className="overflow-x-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
              <code>{`curl -X POST ${baseUrl}/api/verify-human \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{"token": "user-cognitive-token", "sessionId": "optional-session-id"}'`}</code>
            </pre>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">JavaScript Example</div>
              <CopyButton
                value={`const response = await fetch('${baseUrl}/api/verify-human', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${apiKey}',
  },
  body: JSON.stringify({ 
    token: 'user-cognitive-token',
    sessionId: 'optional-session-id'
  }),
});

const data = await response.json();
console.log(data);
// { ok: true, isHuman: true, score: 0.82, riskLevel: "low" }`}
                label="Copy"
              />
            </div>
            <pre className="overflow-x-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
              <code>{`const response = await fetch('${baseUrl}/api/verify-human', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${apiKey}',
  },
  body: JSON.stringify({ 
    token: 'user-cognitive-token',
    sessionId: 'optional-session-id'
  }),
});

const data = await response.json();
console.log(data);
// { ok: true, isHuman: true, score: 0.82, riskLevel: "low" }`}</code>
            </pre>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Response Format</div>
            <pre className="overflow-x-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
              <code>{`{
  "ok": true,
  "isHuman": true,
  "score": 0.82,
  "riskLevel": "low",
  "details": {
    "reactionTimeMs": 450,
    "errorRate": 0.05,
    "cognitiveScore": 0.78
  }
}`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adaptive Verify</CardTitle>
          <CardDescription>
            Make context-aware authentication decisions based on transaction details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Endpoint</div>
            <code className="block rounded-md bg-zinc-100 p-2 text-xs dark:bg-zinc-900">
              POST {baseUrl}/api/adaptive-verify
            </code>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">JavaScript Example</div>
              <CopyButton
                value={`const response = await fetch('${baseUrl}/api/adaptive-verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${apiKey}',
  },
  body: JSON.stringify({
    hcsToken: 'quick-auth-token',
    context: {
      channel: 'payment',
      amount: 149.99,
      trustedDevice: true,
      ipAddress: '192.168.1.1',
      userAgent: navigator.userAgent
    }
  }),
});

const data = await response.json();
// { decision: "allow", riskLevel: "low", score: 0.92, recommendedActions: [] }`}
                label="Copy"
              />
            </div>
            <pre className="overflow-x-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
              <code>{`const response = await fetch('${baseUrl}/api/adaptive-verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${apiKey}',
  },
  body: JSON.stringify({
    hcsToken: 'quick-auth-token',
    context: {
      channel: 'payment',
      amount: 149.99,
      trustedDevice: true,
      ipAddress: '192.168.1.1',
      userAgent: navigator.userAgent
    }
  }),
});

const data = await response.json();
// { decision: "allow", riskLevel: "low", score: 0.92, recommendedActions: [] }`}</code>
            </pre>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Decision Values</div>
            <div className="grid gap-2 text-sm">
              <div className="flex gap-2">
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                  allow
                </Badge>
                <span className="text-zinc-600 dark:text-zinc-400">Proceed without additional verification</span>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  step_up
                </Badge>
                <span className="text-zinc-600 dark:text-zinc-400">Require additional authentication</span>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  deny
                </Badge>
                <span className="text-zinc-600 dark:text-zinc-400">Block the transaction</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SCA PSD2 Evaluate</CardTitle>
          <CardDescription>
            Evaluate Strong Customer Authentication requirements for PSD2 compliance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Endpoint</div>
            <code className="block rounded-md bg-zinc-100 p-2 text-xs dark:bg-zinc-900">
              POST {baseUrl}/api/sca/evaluate
            </code>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">JavaScript Example</div>
              <CopyButton
                value={`const response = await fetch('${baseUrl}/api/sca/evaluate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${apiKey}',
  },
  body: JSON.stringify({
    psuId: 'user-123',
    amount: 29.99,
    currency: 'EUR',
    payeeId: 'merchant-456',
    hcsToken: 'quick-auth-token'
  }),
});

const data = await response.json();
// { decision: "exempt", exemptionType: "low_value", score: 0.85, riskLevel: "low" }`}
                label="Copy"
              />
            </div>
            <pre className="overflow-x-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
              <code>{`const response = await fetch('${baseUrl}/api/sca/evaluate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${apiKey}',
  },
  body: JSON.stringify({
    psuId: 'user-123',
    amount: 29.99,
    currency: 'EUR',
    payeeId: 'merchant-456',
    hcsToken: 'quick-auth-token'
  }),
});

const data = await response.json();
// { decision: "exempt", exemptionType: "low_value", score: 0.85, riskLevel: "low" }`}</code>
            </pre>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Exemption Types</div>
            <div className="grid gap-2 text-sm">
              <div className="flex gap-2">
                <code className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-900">low_value</code>
                <span className="text-zinc-600 dark:text-zinc-400">Transaction under €30</span>
              </div>
              <div className="flex gap-2">
                <code className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-900">tra</code>
                <span className="text-zinc-600 dark:text-zinc-400">Transaction Risk Analysis exemption</span>
              </div>
              <div className="flex gap-2">
                <code className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-900">recurring</code>
                <span className="text-zinc-600 dark:text-zinc-400">Recurring transaction</span>
              </div>
              <div className="flex gap-2">
                <code className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-900">trusted</code>
                <span className="text-zinc-600 dark:text-zinc-400">Trusted beneficiary</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rate Limits</CardTitle>
          <CardDescription>
            Understand API rate limits and quotas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 text-sm">
            <div>
              <div className="font-medium">Monthly Quota</div>
              <p className="text-zinc-600 dark:text-zinc-400">
                Your plan includes a monthly quota of API calls. Check your current usage on the{" "}
                <a href="/dashboard/overview" className="text-blue-600 hover:underline dark:text-blue-400">
                  Dashboard
                </a>.
              </p>
            </div>
            <div>
              <div className="font-medium">Rate Limiting</div>
              <p className="text-zinc-600 dark:text-zinc-400">
                API requests are limited to 100 requests per minute per API key. Exceeding this limit will return a 429 status code.
              </p>
            </div>
            <div>
              <div className="font-medium">Response Headers</div>
              <pre className="overflow-x-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
                <code>{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200`}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Error Handling</CardTitle>
          <CardDescription>
            How to handle API errors gracefully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 text-sm">
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                  200
                </Badge>
                <span className="font-medium">Success</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">Request processed successfully</p>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  400
                </Badge>
                <span className="font-medium">Bad Request</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">Invalid request parameters</p>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  401
                </Badge>
                <span className="font-medium">Unauthorized</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">Invalid or missing API key</p>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  429
                </Badge>
                <span className="font-medium">Too Many Requests</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">Rate limit exceeded</p>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  500
                </Badge>
                <span className="font-medium">Internal Server Error</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">Server error, please retry</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support</CardTitle>
          <CardDescription>
            Need help? We're here for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <div className="font-medium">Email Support</div>
            <a href="mailto:contact@ia-solution.fr" className="text-blue-600 hover:underline dark:text-blue-400">
              contact@ia-solution.fr
            </a>
          </div>
          <div>
            <div className="font-medium">Documentation Site</div>
            <a href="https://www.hcs-u7.com" className="text-blue-600 hover:underline dark:text-blue-400">
              www.hcs-u7.com
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
