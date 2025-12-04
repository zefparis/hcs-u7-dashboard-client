import type { Metadata } from "next";
import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/shared/login-form";

export const metadata: Metadata = {
  title: "Login – HCS-U7 Dashboard",
  description: "Sign in to your HCS-U7 tenant dashboard.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to HCS-U7</CardTitle>
            <CardDescription>
              Enter your credentials and HCS-U7 code to access your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-40 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          By signing in you agree to keep your HCS-U7 credentials and API keys confidential.
        </p>
      </div>
    </div>
  );
}
