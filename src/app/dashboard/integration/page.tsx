import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getIntegrationExamples, type IntegrationExample } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";

export const metadata: Metadata = {
  title: "Integration – HCS-U7 Dashboard",
};

function EndpointSection({
  title,
  description,
  example,
}: {
  title: string;
  description: string;
  example: IntegrationExample;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 text-xs font-medium text-zinc-500">cURL</div>
          <div className="relative">
            <pre className="overflow-x-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
              <code>{example.curl}</code>
            </pre>
            <div className="absolute right-2 top-2">
              <CopyButton value={example.curl} />
            </div>
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-zinc-500">Node.js / TypeScript</div>
          <div className="relative">
            <pre className="overflow-x-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
              <code>{example.node}</code>
            </pre>
            <div className="absolute right-2 top-2">
              <CopyButton value={example.node} />
            </div>
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-zinc-500">Python</div>
          <div className="relative">
            <pre className="overflow-x-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
              <code>{example.python}</code>
            </pre>
            <div className="absolute right-2 top-2">
              <CopyButton value={example.python} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function IntegrationPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.id as string | undefined;

  if (!tenantId) {
    redirect("/login");
  }

  const examples = await getIntegrationExamples(tenantId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Integration</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Code examples to integrate HCS-U7 into your application.
          </p>
        </div>
        <Badge>All Endpoints</Badge>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Flow</CardTitle>
          <CardDescription>Recommended integration sequence for maximum security.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <div className="rounded-md bg-blue-100 px-3 py-1 font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              1. quick-auth
            </div>
            <span className="text-zinc-400">→</span>
            <div className="rounded-md bg-purple-100 px-3 py-1 font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
              2. adaptive-verify
            </div>
            <span className="text-zinc-400">→</span>
            <div className="rounded-md bg-emerald-100 px-3 py-1 font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
              3. secure-login / sca-evaluate
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Generate a quick-auth token from user behavior metrics, then use it for adaptive verification
            before proceeding with login or payment flows.
          </p>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <div className="space-y-6">
        <EndpointSection
          title="POST /api/verify-human"
          description="Simple human verification based on an opaque token."
          example={examples.verifyHuman}
        />

        <EndpointSection
          title="POST /api/quick-auth"
          description="Generate a quick-auth JWT token from reaction times and error rate."
          example={examples.quickAuth}
        />

        <EndpointSection
          title="POST /api/adaptive-verify"
          description="Advanced adaptive decision combining HCS signals and context."
          example={examples.adaptiveVerify}
        />

        <EndpointSection
          title="POST /api/secure-login"
          description="Login decision based on HCS quick-auth token."
          example={examples.secureLogin}
        />

        <EndpointSection
          title="POST /api/sca/evaluate"
          description="PSD2 SCA evaluation with exemption detection."
          example={examples.scaEvaluate}
        />
      </div>

      {/* API Reference */}
      <Card>
        <CardHeader>
          <CardTitle>API Reference</CardTitle>
          <CardDescription>Additional endpoints available in HCS-U7.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <div>
                <span className="font-mono text-xs font-medium text-emerald-600">GET</span>
                <span className="ml-2 font-mono text-xs">/health</span>
              </div>
              <span className="text-xs text-zinc-500">Health check (no auth)</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <div>
                <span className="font-mono text-xs font-medium text-emerald-600">GET</span>
                <span className="ml-2 font-mono text-xs">/api/sca/config</span>
              </div>
              <span className="text-xs text-zinc-500">Get SCA configuration</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <div>
                <span className="font-mono text-xs font-medium text-amber-600">PATCH</span>
                <span className="ml-2 font-mono text-xs">/api/sca/config</span>
              </div>
              <span className="text-xs text-zinc-500">Update SCA configuration</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <div>
                <span className="font-mono text-xs font-medium text-emerald-600">GET</span>
                <span className="ml-2 font-mono text-xs">/api/sca/decisions</span>
              </div>
              <span className="text-xs text-zinc-500">Get SCA decision history</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
