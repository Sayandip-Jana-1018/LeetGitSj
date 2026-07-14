"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Zap, KeyRound, Sparkles, AlertCircle } from "lucide-react";

type Mode = "manual" | "auto";
type AutoStatus = "idle" | "queued" | "error";

export function LeetCodeConnectForm({
  isConnected,
  isExpired,
}: {
  isConnected: boolean;
  isExpired: boolean;
}) {
  const [mode, setMode] = useState<Mode>("manual");
  const [session, setSession] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [autoUser, setAutoUser] = useState("");
  const [autoPass, setAutoPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [autoStatus, setAutoStatus] = useState<AutoStatus>("idle");
  const [autoMessage, setAutoMessage] = useState("");
  const [showForm, setShowForm] = useState(isExpired);
  const router = useRouter();

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !csrfToken) { setError("Both cookies are required."); return; }
    setLoading(true); setError(""); setSuccess(false);
    try {
      const res = await fetch("/api/leetcode/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, csrfToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to connect");
      setSuccess(true); setSession(""); setCsrfToken("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoUser || !autoPass) { setError("Both fields are required."); return; }
    setLoading(true); setError(""); setAutoStatus("idle");
    try {
      const res = await fetch("/api/leetcode/auto-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: autoUser, password: autoPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enqueue auto-connect");
      setAutoStatus("queued");
      setAutoMessage(data.message || "Auto-connect queued! Credentials will be saved in ~30 seconds.");
      setAutoUser(""); setAutoPass("");
      // Refresh after 35s to pick up the new connection status
      setTimeout(() => router.refresh(), 35000);
    } catch (err) {
      setAutoStatus("error");
      setError(err instanceof Error ? err.message : "Auto-connect failed");
    } finally {
      setLoading(false);
    }
  };

  if (isConnected && !showForm) {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-full bg-[var(--color-success-subtle)] flex items-center justify-center mx-auto mb-4 ring-4 ring-[var(--color-success)]/20">
          <CheckCircle2 className="w-7 h-7 text-[var(--color-success)]" />
        </div>
        <h3 className="text-[var(--color-text-primary)] font-semibold text-lg">LeetCode is Connected</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2 mb-6 max-w-sm mx-auto">
          Your credentials are active and encrypted at rest. The sync engine is running.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-medium text-[var(--color-accent)] hover:underline"
        >
          Update credentials →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {isExpired && (
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-warning-subtle)] border border-[var(--color-warning)]/30 text-sm text-[var(--color-text-primary)] flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-[var(--color-warning)] shrink-0 mt-0.5" />
          <span><strong>Session Expired:</strong> LeetCode sessions expire periodically. Reconnect to resume syncing.</span>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex gap-1 p-1 rounded-[var(--radius-md)] bg-[var(--color-surface-hover)] w-fit">
        <button
          onClick={() => { setMode("manual"); setError(""); }}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all ${
            mode === "manual"
              ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Manual (Cookie)
        </button>
        <button
          onClick={() => { setMode("auto"); setError(""); }}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all ${
            mode === "auto"
              ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-sm"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Auto-Connect
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-semibold">BETA</span>
        </button>
      </div>

      {/* Error / Success banners */}
      {error && (
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] text-sm text-[var(--color-danger)] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-success-subtle)] text-sm text-[var(--color-success)] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Successfully connected to LeetCode! First sync is in progress.
        </div>
      )}
      {autoStatus === "queued" && (
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/20 text-sm text-[var(--color-text-primary)] flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5 animate-pulse" />
          <div>
            <p className="font-medium">Auto-connect queued!</p>
            <p className="text-[var(--color-text-secondary)] mt-0.5">{autoMessage}</p>
          </div>
        </div>
      )}

      {/* MANUAL TAB */}
      {mode === "manual" && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">LEETCODE_SESSION</label>
            <input
              type="password"
              value={session}
              onChange={(e) => setSession(e.target.value)}
              placeholder="Paste LEETCODE_SESSION cookie..."
              className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all font-mono text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">csrftoken</label>
            <input
              type="password"
              value={csrfToken}
              onChange={(e) => setCsrfToken(e.target.value)}
              placeholder="Paste csrftoken cookie..."
              className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all font-mono text-sm"
              required
            />
          </div>
          <div className="p-3 bg-[var(--color-surface-elevated)] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]">
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              <strong className="text-[var(--color-text-secondary)]">How to find these:</strong> Open LeetCode → Press <kbd className="px-1 py-0.5 bg-[var(--color-surface-hover)] rounded text-[10px] font-mono">F12</kbd> → Application tab → Cookies → <code className="text-[10px] bg-[var(--color-surface-hover)] px-1 rounded">leetcode.com</code> → copy <code className="text-[10px]">LEETCODE_SESSION</code> and <code className="text-[10px]">csrftoken</code>.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Verifying & Encrypting..." : "Connect LeetCode"}
          </button>
        </form>
      )}

      {/* AUTO-CONNECT TAB */}
      {mode === "auto" && (
        <form onSubmit={handleAutoSubmit} className="space-y-4">
          <div className="p-3.5 bg-[var(--color-surface-elevated)] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)] leading-relaxed">
            <strong className="text-[var(--color-text-primary)]">How it works:</strong> We launch a secure background browser session that logs into LeetCode and extracts your session cookies automatically. Credentials are encrypted immediately and never logged. If LeetCode shows a CAPTCHA, please use Manual Connect.
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">LeetCode Username or Email</label>
            <input
              type="text"
              value={autoUser}
              onChange={(e) => setAutoUser(e.target.value)}
              placeholder="your_leetcode_username"
              className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">LeetCode Password</label>
            <input
              type="password"
              value={autoPass}
              onChange={(e) => setAutoPass(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading || autoStatus === "queued"}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {loading ? "Submitting..." : autoStatus === "queued" ? "Queued — checking soon..." : "Auto-Connect LeetCode"}
          </button>
          <p className="text-xs text-[var(--color-text-muted)]">Limited to 3 attempts per 10 minutes.</p>
        </form>
      )}
    </div>
  );
}
