"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LogoutButton } from "@/components/shared/logout-button";

const NAV_ITEMS = [
  { href: "/dashboard/overview", label: "Dashboard" },
  { href: "/dashboard/api-keys", label: "API Keys" },
  { href: "/dashboard/usage", label: "Usage" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/docs", label: "Documentation" },
  { href: "/dashboard/account", label: "Account" },
];

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <aside className="hidden w-60 border-r border-zinc-200 bg-white px-4 py-6 dark:border-zinc-800 dark:bg-zinc-950 md:flex md:flex-col">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase text-zinc-500">HCS-U7</div>
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Client Dashboard
          </div>
        </div>
        <nav className="flex-1 space-y-1 text-sm">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
                  isActive && "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-zinc-500">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
          <div className="font-medium">HCS-U7 Dashboard</div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
