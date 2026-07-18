import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { SyncPulseIndicator } from "@/components/dashboard/SyncPulseIndicator";
import { ReactNode } from "react";
import { auth } from "@/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  
  return (
    <div className="min-h-screen text-[var(--color-text-primary)] relative">
      <DashboardTabs user={session?.user} />
      <main className="px-6 py-8 sm:px-10 sm:py-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      <SyncPulseIndicator />
    </div>
  );
}
