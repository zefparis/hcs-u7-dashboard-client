"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UsageFiltersComponent, type UsageFilters } from "@/components/usage/usage-filters";
import { Button } from "@/components/ui/button";
import type { UsageResponse } from "@/lib/api";

interface UsagePageClientProps {
  initialUsage: UsageResponse;
  tenantId: string;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString();
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString();
}

export function UsagePageClient({ initialUsage, tenantId }: UsagePageClientProps) {
  const [usage, setUsage] = React.useState(initialUsage);
  const [isLoading, setIsLoading] = React.useState(false);
  const [filters, setFilters] = React.useState<UsageFilters>({});
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 50;

  const maxRequests = usage.daily.reduce((max, day) => Math.max(max, day.requests), 0) || 1;

  // Apply client-side filtering
  const filteredLogs = React.useMemo(() => {
    let logs = [...usage.logs];

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      logs = logs.filter(log => new Date(log.timestamp) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      logs = logs.filter(log => new Date(log.timestamp) <= toDate);
    }

    if (filters.endpoint) {
      logs = logs.filter(log => log.endpoint === filters.endpoint);
    }

    if (filters.statusCode) {
      logs = logs.filter(log => log.status.toString() === filters.statusCode);
    }

    if (filters.method) {
      logs = logs.filter(log => log.method === filters.method);
    }

    return logs;
  }, [usage.logs, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFiltersChange = async (newFilters: UsageFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleExport = async () => {
    try {
      // Create CSV content
      const headers = ["Timestamp", "Method", "Endpoint", "Status", "Duration (ms)", "Cost (€)"];
      const rows = filteredLogs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.method,
        log.endpoint,
        log.status.toString(),
        log.durationMs.toString(),
        log.cost.toFixed(6)
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      // Download CSV file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hcs-u7-usage-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Usage</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Detailed API usage logs and daily statistics.
          </p>
        </div>
        <Badge>Tenant scope enforced</Badge>
      </div>

      <UsageFiltersComponent
        onFiltersChange={handleFiltersChange}
        onExport={handleExport}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredLogs.length.toLocaleString()}
            </div>
            <p className="text-xs text-zinc-500">
              {usage.logs.length !== filteredLogs.length && `of ${usage.logs.length.toLocaleString()} total`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredLogs.length > 0
                ? `${Math.round(
                    (filteredLogs.filter(l => l.status >= 200 && l.status < 300).length / filteredLogs.length) * 100
                  )}%`
                : "—"}
            </div>
            <p className="text-xs text-zinc-500">2xx responses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredLogs.length > 0
                ? `${Math.round(
                    filteredLogs.reduce((sum, l) => sum + l.durationMs, 0) / filteredLogs.length
                  )}ms`
                : "—"}
            </div>
            <p className="text-xs text-zinc-500">Average latency</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{filteredLogs.reduce((sum, l) => sum + l.cost, 0).toFixed(4)}
            </div>
            <p className="text-xs text-zinc-500">For filtered period</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Usage – Last 30 Days</CardTitle>
          <CardDescription>Request volume per day.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-end gap-0.5">
            {usage.daily.map((day) => (
              <div
                key={day.date}
                className="flex-1 rounded-t-sm bg-zinc-900/70 dark:bg-zinc-100/80 transition-all hover:bg-zinc-900 dark:hover:bg-zinc-100"
                style={{ height: `${Math.max(8, (day.requests / maxRequests) * 100)}%` }}
                title={`${formatDate(day.date)} – ${day.requests.toLocaleString()} requests`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Hover over bars to see daily totals.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Calls</CardTitle>
              <CardDescription>
                {filteredLogs.length === 0 
                  ? "No matching requests found"
                  : `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, filteredLogs.length)} of ${filteredLogs.length} filtered requests`}
              </CardDescription>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-zinc-500">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs text-zinc-500">
                    {formatDateTime(log.timestamp)}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{log.method}</TableCell>
                  <TableCell className="text-xs">{log.endpoint}</TableCell>
                  <TableCell className="text-xs">
                    <span
                      className={
                        log.status >= 200 && log.status < 400
                          ? "text-emerald-600 dark:text-emerald-400"
                          : log.status >= 500
                            ? "text-red-600 dark:text-red-400"
                            : "text-amber-600 dark:text-amber-400"
                      }
                    >
                      {log.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-xs text-zinc-600 dark:text-zinc-400">
                    {log.durationMs}ms
                  </TableCell>
                  <TableCell className="text-right text-xs text-zinc-600 dark:text-zinc-400">
                    €{log.cost.toFixed(6)}
                  </TableCell>
                </TableRow>
              ))}
              {paginatedLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-xs text-zinc-500">
                    {filteredLogs.length === 0 && usage.logs.length > 0
                      ? "No requests match the selected filters."
                      : "No API calls recorded yet."}
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
