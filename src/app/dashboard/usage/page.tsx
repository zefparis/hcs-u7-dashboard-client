import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getUsageLogs } from "@/lib/api";
import { UsagePageClient } from "./usage-client";

export const metadata: Metadata = {
  title: "Usage – HCS-U7 Dashboard",
};

export default async function UsagePage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.id as string | undefined;

  if (!tenantId) {
    redirect("/login");
  }

  const usage = await getUsageLogs(tenantId);

  return <UsagePageClient initialUsage={usage} tenantId={tenantId} />;
}
