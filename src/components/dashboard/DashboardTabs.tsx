"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Activity, Settings, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeColorToggle } from "@/components/theme-color-toggle";

const tabs = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Activity", href: "/dashboard/activity", icon: Activity },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardTabs({ user }: { user?: { image?: string | null; name?: string | null } }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full pt-4 pb-4 sm:pt-6 sm:pb-6 transition-all">
      {/* Soft gradient blur overlay for the navbar area */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)] via-[var(--color-bg)]/80 to-transparent pointer-events-none -z-10" />
      <div className="absolute inset-0 backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)] pointer-events-none -z-10" />
      
      <div className="mx-auto max-w-6xl px-4 sm:px-10 relative">
        <div className="flex items-center justify-between h-14 sm:h-[60px]">
          {/* Logo & Logout (Left) */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user?.image || "/profile_photo.jpg"}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover shadow-md ring-2 ring-[var(--color-border-subtle)]"
              />
              <span className="hidden xs:inline-block font-bold tracking-tight text-lg text-[var(--color-text-primary)]">
                LeetGit<span className="text-[var(--color-accent)]">Sj</span>
              </span>
            </Link>
            
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-2 w-[36px] h-[36px] flex items-center justify-center text-[var(--color-accent)] bg-[var(--color-accent)]/10 hover:bg-[var(--color-danger)]/15 hover:text-[var(--color-danger)] transition-all duration-300 rounded-full hover:scale-105"
              title="Sign out"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Tabs — Center (Desktop) */}
          <nav className="hidden sm:flex items-center bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border-subtle)] rounded-full p-1 gap-0.5">
            {tabs.map((tab) => {
              const isActive =
                tab.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`group flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-full transition-all duration-250 ${
                    isActive
                      ? "bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/30"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]"
                  }`}
                >
                  <div className={`p-1.5 rounded-full transition-all duration-300 ${isActive ? "bg-white text-[var(--color-accent)]" : "bg-[var(--color-accent)]/10 text-[var(--color-accent)] group-hover:bg-[var(--color-accent)]/20"}`}>
                    <tab.icon className="w-4 h-4" />
                  </div>
                  {tab.name}
                </Link>
              );
            })}
          </nav>

          {/* Tabs — Center (Mobile) */}
          <nav className="sm:hidden absolute left-1/2 -translate-x-1/2 flex items-center bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border-subtle)] rounded-full p-1 gap-0.5">
            {tabs.map((tab) => {
              const isActive =
                tab.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  title={tab.name}
                  className={`group flex items-center justify-center w-[36px] h-[36px] rounded-full transition-all duration-250 ${
                    isActive
                      ? "bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/30"
                      : "bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 hover:scale-105"
                  }`}
                >
                  <tab.icon className="w-4.5 h-4.5" />
                </Link>
              );
            })}
          </nav>

          {/* Theme Toggles (Right) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <ThemeColorToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
