/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HcsCodeFormProps {
  action: (formData: FormData) => Promise<void>;
}

export function HcsCodeForm({ action }: HcsCodeFormProps) {
  const [showCurrentCode, setShowCurrentCode] = React.useState(false);
  const [showNewCode, setShowNewCode] = React.useState(false);
  const [showConfirmCode, setShowConfirmCode] = React.useState(false);

  return (
    <form action={action} className="space-y-4">
      {/* Security indicator legend */}
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <span className="font-medium text-zinc-600 dark:text-zinc-400">Security Status:</span>
          <div className="flex gap-4">
            <span className="text-green-600 dark:text-green-400 font-medium">🔒 HIDDEN = Secure</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">👁️ VISIBLE = Check surroundings</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="currentHcsCode">Current HCS-U7 Code</Label>
        <div className="relative">
          <Input
            id="currentHcsCode"
            name="currentHcsCode"
            type={showCurrentCode ? "text" : "password"}
            placeholder={showCurrentCode ? "HCS-U7|V:8.0|ALG:QS|..." : "••••••••••••••••••••"}
            required
            className="font-mono text-xs pr-24"
          />
          <div className="absolute right-0 top-0 flex h-full items-center gap-1 pr-3">
            <span className={`text-xs font-medium ${
              showCurrentCode ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"
            }`}>
              {showCurrentCode ? "VISIBLE" : "HIDDEN"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setShowCurrentCode(!showCurrentCode)}
              aria-label={showCurrentCode ? "Hide code" : "Show code"}
            >
              {showCurrentCode ? (
                <EyeOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <Eye className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="newHcsCode">New HCS-U7 Code</Label>
        <div className="relative">
          <Input
            id="newHcsCode"
            name="newHcsCode"
            type={showNewCode ? "text" : "password"}
            placeholder={showNewCode ? "HCS-U7|V:8.0|ALG:QS|..." : "••••••••••••••••••••"}
            required
            className="font-mono text-xs pr-24"
          />
          <div className="absolute right-0 top-0 flex h-full items-center gap-1 pr-3">
            <span className={`text-xs font-medium ${
              showNewCode ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"
            }`}>
              {showNewCode ? "VISIBLE" : "HIDDEN"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setShowNewCode(!showNewCode)}
              aria-label={showNewCode ? "Hide code" : "Show code"}
            >
              {showNewCode ? (
                <EyeOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <Eye className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-zinc-500">
          Generate a new code from the HCS-U7 website
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmHcsCode">Confirm New HCS-U7 Code</Label>
        <div className="relative">
          <Input
            id="confirmHcsCode"
            name="confirmHcsCode"
            type={showConfirmCode ? "text" : "password"}
            placeholder={showConfirmCode ? "HCS-U7|V:8.0|ALG:QS|..." : "••••••••••••••••••••"}
            required
            className="font-mono text-xs pr-24"
          />
          <div className="absolute right-0 top-0 flex h-full items-center gap-1 pr-3">
            <span className={`text-xs font-medium ${
              showConfirmCode ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"
            }`}>
              {showConfirmCode ? "VISIBLE" : "HIDDEN"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setShowConfirmCode(!showConfirmCode)}
              aria-label={showConfirmCode ? "Hide code" : "Show code"}
            >
              {showConfirmCode ? (
                <EyeOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <Eye className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
        <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
          Important Security Notice
        </p>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
          After changing your HCS-U7 code, you will need to use the new code for all future logins.
          Make sure to save it in a secure location.
        </p>
      </div>
      
      <Button type="submit" size="sm" variant="outline">
        Change HCS-U7 Code
      </Button>
    </form>
  );
}
