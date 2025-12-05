import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcrypt";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema, changeHcsCodeSchema } from "@/lib/validation";
import { auditPasswordChanged, auditHcsCodeChanged } from "@/lib/audit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordForm } from "@/components/settings/password-form";
import { HcsCodeForm } from "@/components/settings/hcs-code-form";

export const metadata: Metadata = {
  title: "Settings – HCS-U7 Dashboard",
  description: "Manage your security settings and preferences",
};

async function requireTenantId() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.id as string | undefined;

  if (!tenantId) {
    redirect("/login");
  }

  return tenantId;
}

async function changePasswordAction(formData: FormData) {
  "use server";

  const tenantId = await requireTenantId();
  
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validate input
  const parsed = changePasswordSchema.safeParse({
    currentPassword,
    newPassword,
    confirmPassword,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  try {
    // Get tenant current password hash
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    }) as any;

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, tenant.passwordHash);
    if (!validPassword) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password and reset mustChangePassword flag
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
        updatedAt: new Date(),
      } as any,
    });

    // Audit log the password change
    await auditPasswordChanged(tenantId);

    revalidatePath("/dashboard/settings");
  } catch (error) {
    console.error("[settings] Change password error:", error);
    throw error;
  }
}

async function changeHcsCodeAction(formData: FormData) {
  "use server";

  const tenantId = await requireTenantId();
  
  const currentHcsCode = formData.get("currentHcsCode") as string;
  const newHcsCode = formData.get("newHcsCode") as string;
  const confirmHcsCode = formData.get("confirmHcsCode") as string;

  // Validate input
  const parsed = changeHcsCodeSchema.safeParse({
    currentHcsCode,
    newHcsCode,
    confirmHcsCode,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  try {
    // Get tenant current HCS code hash
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    }) as any;

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Verify current HCS code
    const validHcsCode = await bcrypt.compare(currentHcsCode, tenant.hcsCodeHash);
    if (!validHcsCode) {
      throw new Error("Current HCS-U7 code is incorrect");
    }

    // Hash new HCS code
    const newHcsCodeHash = await bcrypt.hash(newHcsCode, 10);

    // Update HCS code
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        hcsCodeHash: newHcsCodeHash,
        updatedAt: new Date(),
      } as any,
    });

    // Audit log the HCS code change
    await auditHcsCodeChanged(tenantId);

    revalidatePath("/dashboard/settings");
  } catch (error) {
    console.error("[settings] Change HCS code error:", error);
    throw error;
  }
}

export default async function SettingsPage() {
  const tenantId = await requireTenantId();
  const session = await getServerSession(authOptions);
  
  // Get tenant details
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  }) as any;

  if (!tenant) {
    redirect("/login");
  }

  const mustChangePassword = (session?.user as any)?.mustChangePassword || false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Manage your security settings and account preferences
          </p>
        </div>
        {mustChangePassword && (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            Password change required
          </Badge>
        )}
      </div>

      {mustChangePassword && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-200">
              Password Change Required
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              You must change your temporary password before you can access other features.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your account details and company information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={tenant.email}
                disabled
                className="bg-zinc-100 dark:bg-zinc-900"
              />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={tenant.fullName || "Not set"}
                disabled
                className="bg-zinc-100 dark:bg-zinc-900"
              />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                value={tenant.company || "Not set"}
                disabled
                className="bg-zinc-100 dark:bg-zinc-900"
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={tenant.website || "Not set"}
                disabled
                className="bg-zinc-100 dark:bg-zinc-900"
              />
            </div>
            <p className="text-xs text-zinc-500">
              Contact support to update profile information.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password regularly to maintain account security.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm action={changePasswordAction} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change HCS-U7 Code</CardTitle>
          <CardDescription>
            Your HCS-U7 code acts as a second factor authentication. Keep it secure and change it if compromised.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HcsCodeForm action={changeHcsCodeAction} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            View and manage your active login sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="space-y-1">
                <div className="text-sm font-medium">Current Session</div>
                <div className="text-xs text-zinc-500">
                  Active since {new Date().toLocaleString()}
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                Active
              </Badge>
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            NextAuth manages session security. Sessions expire after 30 days of inactivity.
          </p>
        </CardContent>
      </Card>

      <Card className="border-zinc-300 dark:border-zinc-700">
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>
            Best practices to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-500" />
            <div>Never share your HCS-U7 code with anyone</div>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-500" />
            <div>Use a unique, strong password for your account</div>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-500" />
            <div>Rotate your API keys regularly</div>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-500" />
            <div>Monitor your usage logs for suspicious activity</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
