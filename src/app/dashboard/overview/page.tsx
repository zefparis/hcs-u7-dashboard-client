import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getOverview } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Overview – HCS-U7 Dashboard",
};

function formatPercent(value: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString();
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString();
}

export default async function OverviewPage() {
  const session = await getServerSession(authOptions);

  const tenantId = (session?.user as any)?.id as string | undefined;

  if (!tenantId) {
    redirect("/login");
  }

  const overview = await getOverview(tenantId);

  const usage7 = overview.usageLast7Days;
  const usage30 = overview.usageLast30Days;

  const maxRequests7 = usage7.reduce((max, day) => Math.max(max, day.requests), 0) || 1;
  const maxRequests30 = usage30.reduce((max, day) => Math.max(max, day.requests), 0) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Quota usage, recent activity, and backend health for your HCS-U7 tenant.
          </p>
        </div>
        <Badge>Tenant scope enforced</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Quota</CardTitle>
            <CardDescription>
              Current period: {overview.quota.period}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-baseline justify-between text-sm">
              <span className="font-medium">
                {overview.quota.used.toLocaleString()} / {overview.quota.total.toLocaleString()} calls
              </span>
              <span className="text-xs text-zinc-500">
                {formatPercent(overview.quota.used, overview.quota.total)} used
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
              <div
                className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                style={{
                  width: formatPercent(overview.quota.used, overview.quota.total),
                }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Renews on {formatDate(overview.quota.resetAt)}.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last 7 days</CardTitle>
            <CardDescription>Daily request volume and cost.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {usage7.map((day) => (
                <div key={day.date} className="flex items-center gap-2 text-xs">
                  <div className="w-16 text-zinc-500">{formatDate(day.date)}</div>
                  <div className="flex-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                      <div
                        className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                        style={{ width: `${Math.max(6, (day.requests / maxRequests7) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right text-zinc-600 dark:text-zinc-400">
                    {day.requests.toLocaleString()} req
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backend health</CardTitle>
            <CardDescription>Fastify HCS-U7 status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-2 w-2 rounded-full ${
                  overview.backendHealth.status === "healthy"
                    ? "bg-emerald-500"
                    : overview.backendHealth.status === "degraded"
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                aria-hidden
              />
              <span className="font-medium capitalize">{overview.backendHealth.status}</span>
              {overview.backendHealth.env && (
                <Badge className="text-[10px]">{overview.backendHealth.env}</Badge>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              Latency: {overview.backendHealth.latencyMs.toFixed(0)} ms
            </p>
            <p className="text-xs text-zinc-500">
              Last check: {formatDateTime(overview.backendHealth.lastCheckedAt)}
            </p>
            {overview.backendHealth.error && (
              <p className="text-xs text-red-500">
                Error: {overview.backendHealth.error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Usage – last 30 days</CardTitle>
            <CardDescription>Relative traffic per day.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-28 items-end gap-0.5">
              {usage30.map((day) => (
                <div
                  key={day.date}
                  className="flex-1 rounded-t-sm bg-zinc-900/70 dark:bg-zinc-100/80"
                  style={{ height: `${Math.max(8, (day.requests / maxRequests30) * 100)}%` }}
                  title={`${formatDate(day.date)} – ${day.requests.toLocaleString()} requests`}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Simple relative bar chart. For production you can plug a full charting library.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent API calls</CardTitle>
            <CardDescription>Latest activity for this tenant only.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.recentCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="whitespace-nowrap text-xs text-zinc-500">
                      {formatDateTime(call.timestamp)}
                    </TableCell>
                    <TableCell className="text-xs">{call.endpoint}</TableCell>
                    <TableCell className="text-xs">
                      <span
                        className={
                          call.status >= 200 && call.status < 400
                            ? "text-emerald-600 dark:text-emerald-400"
                            : call.status >= 500
                              ? "text-red-600 dark:text-red-400"
                              : "text-amber-600 dark:text-amber-400"
                        }
                      >
                        {call.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-zinc-600 dark:text-zinc-400">
                      ${call.cost.toFixed(6)}
                    </TableCell>
                  </TableRow>
                ))}
                {overview.recentCalls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-xs text-zinc-500">
                      No recent calls for this tenant.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
