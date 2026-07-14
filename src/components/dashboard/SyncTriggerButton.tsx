"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function SyncTriggerButton({ disabled }: { disabled?: boolean }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync/trigger", { method: "POST" });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.errorMessage || "Sync failed");
      }
      
      // Refresh the page data (though sync is async, it might have updated stats from before)
      router.refresh();
      
      alert(data.message || "Sync job enqueued successfully. It may take a minute to complete.");
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Sync failed"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={disabled || isSyncing}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-all ${
        disabled
          ? "bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] cursor-not-allowed"
          : "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent-hover)] shadow-[var(--shadow-sm)] active:scale-[0.98]"
      }`}
    >
      <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Syncing..." : "Sync Now"}
    </button>
  );
}
