import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { cookies } from "next/headers";

import { authOptions } from "@/lib/auth";
import { getApiKeys, rotateApiKey } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";

export const metadata: Metadata = {
  title: "API Keys – HCS-U7 Dashboard",
};

async function requireTenantId() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.id as string | undefined;

  if (!tenantId) {
    redirect("/login");
  }

  return tenantId;
}

async function rotateTestKeyAction() {
  "use server";

  const tenantId = await requireTenantId();
  const result = await rotateApiKey(tenantId, { type: "test" });
  
  // Store the new key in a cookie to display it once
  const cookieStore = await cookies();
  cookieStore.set("hcs_new_test_key", result.newKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60, // 1 minute
    path: "/dashboard/api-keys",
  });
  
  revalidatePath("/dashboard/api-keys");
}

async function rotateLiveKeyAction() {
  "use server";

  const tenantId = await requireTenantId();
  const result = await rotateApiKey(tenantId, { type: "live" });
  
  // Store the new key in a cookie to display it once
  const cookieStore = await cookies();
  cookieStore.set("hcs_new_live_key", result.newKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60, // 1 minute
    path: "/dashboard/api-keys",
  });
  
  revalidatePath("/dashboard/api-keys");
}

async function clearNewKeyAction() {
  "use server";
  
  const cookieStore = await cookies();
  cookieStore.delete("hcs_new_test_key");
  cookieStore.delete("hcs_new_live_key");
  revalidatePath("/dashboard/api-keys");
}

export default async function ApiKeysPage() {
  const tenantId = await requireTenantId();
  const apiKeys = await getApiKeys(tenantId);
  
  // Check for newly rotated keys
  const cookieStore = await cookies();
  const newTestKey = cookieStore.get("hcs_new_test_key")?.value;
  const newLiveKey = cookieStore.get("hcs_new_live_key")?.value;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">API keys</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Manage your HCS-U7 TEST and LIVE keys. Live keys are never fully displayed.
          </p>
        </div>
        <Badge className="text-[11px]">Sensitive data – tenant scoped</Badge>
      </div>

      {/* New Key Alert */}
      {(newTestKey || newLiveKey) && (
        <Card className="border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40">
          <CardHeader>
            <CardTitle className="text-emerald-900 dark:text-emerald-200">
              New API Key Generated
            </CardTitle>
            <CardDescription className="text-emerald-700 dark:text-emerald-300">
              Copy this key now. It will not be shown again after you leave this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border border-emerald-300 bg-white px-3 py-2 font-mono text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
                {newTestKey || newLiveKey}
              </div>
              <CopyButton value={(newTestKey || newLiveKey)!} label="Copy" />
            </div>
            <form action={clearNewKeyAction}>
              <Button type="submit" size="sm" variant="outline">
                I&apos;ve copied the key
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Keys</CardTitle>
          <CardDescription>
            TEST key is shown masked. LIVE key is always masked (for example: ****1234).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-medium uppercase text-zinc-500">TEST key</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Safe for non-production usage only.
                </div>
              </div>
              {apiKeys.testKey && <CopyButton value={apiKeys.testKey} label="Copy masked" />}
            </div>
            <div className="mt-1 rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
              {apiKeys.testKey || "No TEST key configured"}
            </div>
            <form action={rotateTestKeyAction} className="mt-2">
              <Button type="submit" size="sm" variant="outline">
                {apiKeys.testKey ? "Rotate TEST key" : "Generate TEST key"}
              </Button>
            </form>
          </div>

          <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-medium uppercase text-zinc-500">LIVE key</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Only the masked key is ever shown here. Store the full value in your own vault.
                </div>
              </div>
              <CopyButton value={apiKeys.liveKeyMasked} label="Copy masked" />
            </div>
            <div className="mt-1 rounded-md border border-dashed border-red-300 bg-red-50 px-3 py-2 font-mono text-xs text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {apiKeys.liveKeyMasked}
            </div>
            <form action={rotateLiveKeyAction} className="mt-2">
              <Button type="submit" size="sm" variant="destructive">
                Rotate LIVE key
              </Button>
            </form>
          </div>

          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
            <p className="font-semibold">Security notice</p>
            <p className="mt-1">
              Ne partagez jamais vos clés HCS-U7. Ne collez jamais vos clés LIVE dans des tickets, des
              emails ou des channels publics. Stockez-les uniquement dans un secret manager dédié.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* All Keys Table */}
      {apiKeys.keys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Active Keys</CardTitle>
            <CardDescription>All active API keys for your tenant.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {apiKeys.keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="space-y-1">
                    <div className="font-mono text-xs">{key.maskedKey}</div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <span>{key.environment}</span>
                      <span>•</span>
                      <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                      {key.lastUsedAt && (
                        <>
                          <span>•</span>
                          <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge
                    className={`text-[10px] ${
                      key.environment === "PRODUCTION"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {key.environment}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
