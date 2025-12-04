import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getTenantProfile, updateTenantProfile } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Account – HCS-U7 Dashboard",
};

async function requireTenantId() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.id as string | undefined;

  if (!tenantId) {
    redirect("/login");
  }

  return tenantId;
}

async function updateProfileAction(formData: FormData) {
  "use server";

  const tenantId = await requireTenantId();
  
  const fullName = formData.get("fullName") as string;
  const company = formData.get("company") as string;
  const website = formData.get("website") as string;

  await updateTenantProfile(tenantId, { fullName, company, website });
  revalidatePath("/dashboard/account");
}

function formatDate(value: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleDateString();
}

function getStatusColor(status: string) {
  switch (status) {
    case "ACTIVE":
      return "text-emerald-600 dark:text-emerald-400";
    case "TRIAL":
      return "text-blue-600 dark:text-blue-400";
    case "SUSPENDED":
    case "CANCELLED":
    case "CHURNED":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-zinc-600 dark:text-zinc-400";
  }
}

export default async function AccountPage() {
  const tenantId = await requireTenantId();
  const profile = await getTenantProfile(tenantId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Account</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Manage your tenant profile and account settings.
          </p>
        </div>
        <Badge>Tenant scope enforced</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your account details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateProfileAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-zinc-100 dark:bg-zinc-900"
                />
                <p className="text-xs text-zinc-500">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  defaultValue={profile.fullName}
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  name="company"
                  type="text"
                  defaultValue={profile.company || ""}
                  placeholder="Your company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  defaultValue={profile.website || ""}
                  placeholder="https://example.com"
                />
              </div>

              <Button type="submit" size="sm">
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>Your current plan and subscription details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs font-medium uppercase text-zinc-500">Plan</div>
                <div className="mt-1 font-semibold">{profile.plan}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-zinc-500">Status</div>
                <div className={`mt-1 font-semibold ${getStatusColor(profile.status)}`}>
                  {profile.status}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-zinc-500">Monthly Quota</div>
                <div className="mt-1">{profile.monthlyQuota.toLocaleString()} calls</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-zinc-500">Current Usage</div>
                <div className="mt-1">{profile.currentUsage.toLocaleString()} calls</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-zinc-500">Member Since</div>
                <div className="mt-1">{formatDate(profile.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-zinc-500">Trial Ends</div>
                <div className="mt-1">{formatDate(profile.trialEndsAt)}</div>
              </div>
            </div>

            <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />

            <div>
              <div className="text-xs font-medium uppercase text-zinc-500">Tenant ID</div>
              <div className="mt-1 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                {profile.id}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-red-900 dark:text-red-200">
                  Delete Account
                </div>
                <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <Button variant="destructive" size="sm" disabled>
                Delete Account
              </Button>
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            Account deletion is currently disabled. Contact support at contact@ia-solution.fr to request account deletion.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
