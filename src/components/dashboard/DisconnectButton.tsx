"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export function DisconnectButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDisconnect = async () => {
    if (!confirm("Are you sure? This will delete all your LeetCode credentials and sync history from our servers. This cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/leetcode/disconnect", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete data");
      
      router.refresh();
    } catch {
      alert("Failed to delete account data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDisconnect}
      disabled={loading}
      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-full bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      Delete Data & Disconnect
    </button>
  );
}
