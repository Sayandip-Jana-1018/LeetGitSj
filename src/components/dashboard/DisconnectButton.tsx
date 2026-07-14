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
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      Delete Data & Disconnect
    </button>
  );
}
