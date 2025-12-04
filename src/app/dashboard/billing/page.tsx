import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getBillingInfo } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Billing – HCS-U7 Dashboard",
};

function formatPercent(value: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString();
}

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.id as string | undefined;

  if (!tenantId) {
    redirect("/login");
  }

  const billing = await getBillingInfo(tenantId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Your current plan, usage, and invoices.
          </p>
        </div>
        <Badge>Tenant scope enforced</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>{billing.currentPlan.period}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{billing.currentPlan.name}</span>
              <span className="text-sm text-zinc-500">
                {billing.currentPlan.quota.toLocaleString()} calls/month
              </span>
            </div>
            <div>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span>
                  {billing.currentPlan.used.toLocaleString()} / {billing.currentPlan.quota.toLocaleString()} used
                </span>
                <span className="text-xs text-zinc-500">
                  {formatPercent(billing.currentPlan.used, billing.currentPlan.quota)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                <div
                  className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                  style={{
                    width: formatPercent(billing.currentPlan.used, billing.currentPlan.quota),
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Subscription</CardTitle>
            <CardDescription>Upgrade, downgrade, or manage payment methods.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {billing.customerPortalUrl ? (
              <a
                href={billing.customerPortalUrl}
                className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Open Customer Portal
              </a>
            ) : (
              <p className="text-sm text-zinc-500">
                Customer portal not configured. Contact support to manage your subscription.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Recent billing events and invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billing.invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="text-xs text-zinc-500">
                    {formatDate(invoice.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {invoice.amount.toFixed(2)} {invoice.currency}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        invoice.status === "paid"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }
                    >
                      {invoice.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {invoice.invoiceUrl ? (
                      <a
                        href={invoice.invoiceUrl}
                        className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Download
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {billing.invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-xs text-zinc-500">
                    No invoices yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
