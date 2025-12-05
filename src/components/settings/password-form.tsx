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
