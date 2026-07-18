"use client";

import { useState, useEffect } from "react";

export function SyncPulseIndicator() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[var(--color-surface)]/80 backdrop-blur-md border border-[var(--color-border)] rounded-full pl-2 pr-3 py-1.5 shadow-lg shadow-black/5 animate-in slide-in-from-bottom-4">
      <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
        <div className="absolute inset-0 rounded-full bg-[var(--color-success)]/40 animate-ping" />
        <div className="relative w-2 h-2 rounded-full bg-[var(--color-success)] shadow-[0_0_8px_var(--color-success)]" />
      </div>
      <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Engine Active</span>
    </div>
  );
}
