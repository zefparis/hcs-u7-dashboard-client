/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

interface PasswordFormProps {
  action: (formData: FormData) => Promise<void>;
}

export function PasswordForm({ action }: PasswordFormProps) {
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
        <Label htmlFor="currentPassword">Current Password</Label>
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          placeholder="Enter your current password"
          required
          autoComplete="current-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          placeholder="Enter a strong new password"
          required
          autoComplete="new-password"
          minLength={8}
        />
        <p className="text-xs text-zinc-500">
          Must contain uppercase, lowercase, number, and special character
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Re-enter your new password"
          required
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" size="sm">
        Change Password
      </Button>
    </form>
  );
}
