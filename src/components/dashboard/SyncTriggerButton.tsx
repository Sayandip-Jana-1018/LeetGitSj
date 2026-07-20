"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function SyncTriggerButton({ disabled }: { disabled?: boolean }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [modalState, setModalState] = useState<{ isOpen: boolean; type: "success" | "error"; message: string }>({
    isOpen: false,
    type: "success",
    message: ""
  });
  const router = useRouter();

  const handleSync = async () => {
    setIsSyncing(true);
    let originalLastSyncTime: string | null = null;
    
    try {
      // 1. Get the current lastSync time so we know when it changes
      const statusRes = await fetch("/api/sync/status");
      if (statusRes.ok) {
        const data = await statusRes.json();
        originalLastSyncTime = data.lastSync?.runAt || null;
      }

      // 2. Trigger the sync job
      const res = await fetch("/api/sync/trigger", { method: "POST" });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.errorMessage || "Sync failed");
      }
      
      // 3. Poll until the sync worker finishes (up to 2 minutes)
      let attempts = 0;
      const maxAttempts = 40; // 40 * 3s = 120s
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // wait 3s
        attempts++;
        
        const checkRes = await fetch("/api/sync/status");
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          const newLastSyncTime = checkData.lastSync?.runAt || null;
          
          if (newLastSyncTime && newLastSyncTime !== originalLastSyncTime) {
            // The background worker finished!
            if (checkData.lastSync.status === "FAILURE") {
              throw new Error(checkData.lastSync.errorMessage || "Sync completed with errors");
            }
            
            router.refresh();
            setModalState({
              isOpen: true,
              type: "success",
              message: `Sync completed! Found ${checkData.lastSync.newSubmissionsCount} new submissions.`
            });
            setIsSyncing(false);
            return;
          }
        }
      }
      
      // If we timeout polling, still refresh but tell them it's taking a while
      router.refresh();
      setModalState({
        isOpen: true,
        type: "success",
        message: "Sync job is taking longer than expected. It will finish in the background."
      });
      
    } catch (err) {
      setModalState({
        isOpen: true,
        type: "error",
        message: err instanceof Error ? err.message : "Sync failed"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
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

      {/* Custom Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center relative">
              <button 
                onClick={() => setModalState({ ...modalState, isOpen: false })}
                className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 ${
                modalState.type === "success" 
                  ? "bg-[var(--color-success)]/10 text-[var(--color-success)]" 
                  : "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
              }`}>
                {modalState.type === "success" ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
                {modalState.type === "success" ? "Sync Queued" : "Sync Failed"}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {modalState.message}
              </p>
              
              <button
                onClick={() => setModalState({ ...modalState, isOpen: false })}
                className="mt-6 w-full py-2.5 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] rounded-xl text-sm font-semibold text-[var(--color-text-primary)] transition-colors"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
