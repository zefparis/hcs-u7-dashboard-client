/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  showToggle?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-24", className)}
          ref={ref}
          {...props}
        />
        {showToggle && (
          <div className="absolute right-0 top-0 flex h-full items-center gap-1 pr-3">
            {/* Status indicator */}
            <span className={cn(
              "text-xs font-medium",
              showPassword ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"
            )}>
              {showPassword ? "VISIBLE" : "HIDDEN"}
            </span>
            
            {/* Toggle button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <Eye className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
