import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getSCAData } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = {
  title: "SCA PSD2 – HCS-U7 Dashboard",
};

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString();
}

function getDecisionColor(decision: string) {
  switch (decision) {
    case "EXEMPT":
      return "text-emerald-600 dark:text-emerald-400";
    case "SCA_REQUIRED":
      return "text-amber-600 dark:text-amber-400";
    case "DENY":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-zinc-600 dark:text-zinc-400";
  }
}

function getRiskColor(riskLevel: string) {
  switch (riskLevel) {
    case "low":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "medium":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "high":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400";
  }
}

export default async function SCAPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.id as string | undefined;

  if (!tenantId) {
    redirect("/login");
  }

  const scaData = await getSCAData(tenantId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">SCA PSD2</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Strong Customer Authentication configuration and decision history.
          </p>
        </div>
        <Badge>PSD2 Compliant</Badge>
      </div>

      {/* SCA Configuration */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low-Value Exemption</CardTitle>
            <CardDescription>Article 11 RTS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Threshold</span>
              <span className="font-medium">{scaData.config.lowValueThreshold}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Cumulative Max</span>
              <span className="font-medium">{scaData.config.lowValueCumulativeMax}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Max Operations</span>
              <span className="font-medium">{scaData.config.lowValueMaxOperations}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">TRA (Transaction Risk Analysis)</CardTitle>
            <CardDescription>Article 18 RTS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Status</span>
              <span className={`font-medium ${scaData.config.traEnabled ? "text-emerald-600" : "text-zinc-400"}`}>
                {scaData.config.traEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Low Risk Threshold</span>
              <span className="font-medium">{scaData.config.traThresholds.low}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Medium Risk Threshold</span>
              <span className="font-medium">{scaData.config.traThresholds.medium}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">High Risk Threshold</span>
              <span className="font-medium">{scaData.config.traThresholds.high}€</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hard Blocks</CardTitle>
            <CardDescription>Security limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Max Amount</span>
              <span className="font-medium">{scaData.config.hardBlockAmount.toLocaleString()}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Bot Detection</span>
              <span className="font-medium text-emerald-600">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">HCS Score Check</span>
              <span className="font-medium text-emerald-600">Active</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SCA Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{scaData.stats.totalDecisions}</div>
            <p className="text-xs text-zinc-500">Total Decisions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-600">{scaData.stats.exemptCount}</div>
            <p className="text-xs text-zinc-500">Exempted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{scaData.stats.scaRequiredCount}</div>
            <p className="text-xs text-zinc-500">SCA Required</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{scaData.stats.deniedCount}</div>
            <p className="text-xs text-zinc-500">Denied</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Decisions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent SCA Decisions</CardTitle>
          <CardDescription>Last 50 transaction evaluations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>PSU ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Exemption</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scaData.decisions.map((decision) => (
                <TableRow key={decision.id}>
                  <TableCell className="whitespace-nowrap text-xs text-zinc-500">
                    {formatDateTime(decision.createdAt)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {decision.psuId.slice(0, 12)}...
                  </TableCell>
                  <TableCell className="text-sm">
                    {decision.amount.toFixed(2)} {decision.currency}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium ${getDecisionColor(decision.decision)}`}>
                      {decision.decision}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {decision.exemptionType || "—"}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${getRiskColor(decision.riskLevel)}`}>
                      {decision.riskLevel}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-xs text-zinc-600 dark:text-zinc-400">
                    {(decision.score * 100).toFixed(0)}%
                  </TableCell>
                </TableRow>
              ))}
              {scaData.decisions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-xs text-zinc-500">
                    No SCA decisions recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Exemption Rules Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Exemption Rules Reference</CardTitle>
          <CardDescription>PSD2 RTS exemption types supported by HCS-U7.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="font-medium">LOW_VALUE</div>
              <p className="mt-1 text-xs text-zinc-500">
                Article 11: Transactions below 30€, with cumulative limit of 100€ or 5 consecutive operations.
              </p>
            </div>
            <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="font-medium">TRA (Transaction Risk Analysis)</div>
              <p className="mt-1 text-xs text-zinc-500">
                Article 18: Risk-based exemption with fraud rate thresholds per transaction amount tier.
              </p>
            </div>
            <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="font-medium">TRUSTED_BENEFICIARY</div>
              <p className="mt-1 text-xs text-zinc-500">
                Article 13: Payments to beneficiaries previously whitelisted by the PSU.
              </p>
            </div>
            <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="font-medium">RECURRING</div>
              <p className="mt-1 text-xs text-zinc-500">
                Article 14: Recurring transactions with same amount and beneficiary.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
