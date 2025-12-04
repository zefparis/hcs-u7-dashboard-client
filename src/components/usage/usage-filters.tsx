"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export interface UsageFilters {
  dateFrom?: string;
  dateTo?: string;
  endpoint?: string;
  statusCode?: string;
  method?: string;
}

interface UsageFiltersProps {
  onFiltersChange: (filters: UsageFilters) => void;
  onExport: () => void;
}

export function UsageFiltersComponent({ onFiltersChange, onExport }: UsageFiltersProps) {
  const [filters, setFilters] = React.useState<UsageFilters>({});
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleFilterChange = (key: keyof UsageFilters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    setFilters({});
    onFiltersChange({});
  };

  // Set default date range to last 7 days
  React.useEffect(() => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const defaultFilters = {
      dateFrom: lastWeek.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
    };
    
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter API usage logs by various criteria</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Hide Filters" : "Show Filters"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onExport}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint</Label>
              <Select
                id="endpoint"
                value={filters.endpoint || ""}
                onChange={(e) => handleFilterChange("endpoint", e.target.value)}
              >
                <option value="">All Endpoints</option>
                <option value="/api/verify-human">Verify Human</option>
                <option value="/api/adaptive-verify">Adaptive Verify</option>
                <option value="/api/quick-auth">Quick Auth</option>
                <option value="/api/secure-login">Secure Login</option>
                <option value="/api/sca/evaluate">SCA Evaluate</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="statusCode">Status Code</Label>
              <Select
                id="statusCode"
                value={filters.statusCode || ""}
                onChange={(e) => handleFilterChange("statusCode", e.target.value)}
              >
                <option value="">All Codes</option>
                <option value="200">200 - Success</option>
                <option value="400">400 - Bad Request</option>
                <option value="401">401 - Unauthorized</option>
                <option value="429">429 - Too Many Requests</option>
                <option value="500">500 - Server Error</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <Select
                id="method"
                value={filters.method || ""}
                onChange={(e) => handleFilterChange("method", e.target.value)}
              >
                <option value="">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
