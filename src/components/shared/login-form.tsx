"use client";

import * as React from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import { loginSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [hcsCode, setHcsCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const authError = searchParams.get("error");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("[LoginForm] Form submitted");

    const parsed = loginSchema.safeParse({ email, password, hcsCode });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      console.log("[LoginForm] Validation failed:", firstError.message);
      setError(firstError.message);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    console.log("[LoginForm] Calling signIn...");
    
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        hcsCode,
        callbackUrl: "/dashboard/overview",
      });

      console.log("[LoginForm] signIn result:", result);
      setIsSubmitting(false);

      if (!result) {
        console.log("[LoginForm] No result from signIn");
        setError("Authentication failed - no response");
        return;
      }

      if (result.error) {
        console.log("[LoginForm] signIn error:", result.error);
        setError(result.error === "CredentialsSignin" 
          ? "Invalid email, password, or HCS-U7 code" 
          : result.error);
        return;
      }

      if (result.ok) {
        console.log("[LoginForm] Login successful, redirecting to:", result.url ?? "/dashboard/overview");
        // Use window.location for a full page reload to ensure session is picked up
        window.location.href = result.url ?? "/dashboard/overview";
      }
    } catch (err) {
      console.error("[LoginForm] Exception during signIn:", err);
      setIsSubmitting(false);
      setError("An unexpected error occurred");
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="hcsCode">HCS-U7 Code</Label>
        <Input
          id="hcsCode"
          type="text"
          placeholder="HCS-U7|V:8.0|ALG:QS|..."
          required
          value={hcsCode}
          onChange={(event) => setHcsCode(event.target.value)}
          className="font-mono text-xs"
        />
        <p className="text-xs text-zinc-500">
          Enter the HCS-U7 code you generated during registration
        </p>
      </div>

      {(error || authError) && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error || "Authentication failed. Please check your credentials."}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
