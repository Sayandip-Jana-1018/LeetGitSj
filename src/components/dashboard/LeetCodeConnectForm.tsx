"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

export function LeetCodeConnectForm({ 
  isConnected, 
  isExpired 
}: { 
  isConnected: boolean;
  isExpired: boolean;
}) {
  const [session, setSession] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !csrfToken) {
      setError("Both cookies are required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/leetcode/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, csrfToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to connect");
      }

      setSuccess(true);
      setSession("");
      setCsrfToken("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  if (isConnected && !success) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-full bg-[var(--color-success-subtle)] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6 text-[var(--color-success)]" />
        </div>
        <h3 className="text-[var(--color-text-primary)] font-medium">LeetCode is Connected</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2 mb-6">
          Your credentials are active and encrypted. The sync engine is running normally.
        </p>
        <button
          onClick={() => {
            // Allows reconnecting with new cookies if they want to switch accounts
            setSuccess(true);
            setTimeout(() => setSuccess(false), 10);
          }}
          className="text-sm font-medium text-[var(--color-accent)] hover:underline"
        >
          Update credentials
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isExpired && (
        <div className="p-3 mb-6 rounded-[var(--radius-md)] bg-[var(--color-warning-subtle)] border border-[var(--color-warning)]/30 text-sm text-[var(--color-text-primary)]">
          <strong>Session Expired:</strong> LeetCode sessions expire periodically. Please paste fresh cookies to resume syncing.
        </div>
      )}

      {error && (
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-success-subtle)] text-sm text-[var(--color-success)] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Successfully connected to LeetCode!
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            LEETCODE_SESSION
          </label>
          <input
            type="password"
            value={session}
            onChange={(e) => setSession(e.target.value)}
            placeholder="Paste LEETCODE_SESSION cookie..."
            className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            csrftoken
          </label>
          <input
            type="password"
            value={csrfToken}
            onChange={(e) => setCsrfToken(e.target.value)}
            placeholder="Paste csrftoken cookie..."
            className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
            required
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Verifying & Encrypting..." : "Connect LeetCode"}
        </button>
      </div>
      
      <p className="text-xs text-[var(--color-text-muted)] mt-4">
        How to find these? Open LeetCode &rarr; DevTools (F12) &rarr; Application tab &rarr; Cookies &rarr; copy values for `LEETCODE_SESSION` and `csrftoken`.
      </p>
    </form>
  );
}
