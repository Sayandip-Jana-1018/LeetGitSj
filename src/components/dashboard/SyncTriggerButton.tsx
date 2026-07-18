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
    try {
      const res = await fetch("/api/sync/trigger", { method: "POST" });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.errorMessage || "Sync failed");
      }
      
      // Refresh the page data (though sync is async, it might have updated stats from before)
      router.refresh();
      
      setModalState({
        isOpen: true,
        type: "success",
        message: data.message || "Sync job enqueued successfully. It may take a minute to complete."
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
