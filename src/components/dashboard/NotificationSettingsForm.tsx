"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Badge, Copy, Check } from "lucide-react";

interface SettingsData {
  notifyEmail: string | null;
  isPublicBadgeEnabled: boolean;
}

export function NotificationSettingsForm({ leetcodeUsername }: { leetcodeUsername?: string | null }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setData] = useState<SettingsData>({
    notifyEmail: null,
    isPublicBadgeEnabled: false,
  });
  const [notifyEmail, setNotifyEmail] = useState("");
  const [isPublicBadge, setIsPublicBadge] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const badgeUsername = leetcodeUsername || "yourusername";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const badgeUrl = `${appUrl}/api/badge/${badgeUsername}`;
  const badgeMarkdown = `![LeetPush](${badgeUrl})`;

  useEffect(() => {
    fetch("/api/user/settings")
      .then((r) => r.json())
      .then((d: SettingsData) => {
        setData(d);
        setNotifyEmail(d.notifyEmail || "");
        setIsPublicBadge(d.isPublicBadgeEnabled);
      })
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const body: Record<string, unknown> = {
        notifyEmail: notifyEmail.trim() || null,
        isPublicBadgeEnabled: isPublicBadge,
      };

      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Save failed");

      setSaved(true);
      setData((prev) => ({
        ...prev,
        notifyEmail: notifyEmail.trim() || null,
        isPublicBadgeEnabled: isPublicBadge,
      }));
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyBadge = () => {
    navigator.clipboard.writeText(badgeMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-[var(--color-text-muted)]">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {/* Email Notifications */}
      <div className="space-y-2 flex flex-col items-center">

        <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1 text-center">
          Notification Email
          <span className="ml-2 text-xs font-normal text-[var(--color-text-muted)]">(separate from login email)</span>
        </label>
        <input
          type="email"
          value={notifyEmail}
          onChange={(e) => setNotifyEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all text-center"
        />
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          We&apos;ll send one email when your LeetCode session expires — never marketing.
        </p>
      </div>

      {/* Public Badge */}
      <div className="p-4 rounded-xl border border-[var(--color-accent)]/15 bg-[var(--color-accent)]/5 backdrop-blur-md space-y-3 w-full shadow-[0_4px_20px_-10px_hsla(var(--hue),50%,50%,0.1)]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center text-center">
            <Badge className="w-5 h-5 text-[var(--color-text-muted)] mb-1" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Public SVG Badge</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Show solved count &amp; streak on GitHub</p>
          </div>
          <button
            onClick={() => setIsPublicBadge((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              isPublicBadge ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"
            }`}
            role="switch"
            aria-checked={isPublicBadge}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isPublicBadge ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {isPublicBadge && (
          <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2 flex flex-col items-center text-center">
            <p className="text-xs text-[var(--color-text-muted)]">Add this to your GitHub README:</p>
            <div className="flex items-center gap-2 p-2.5 bg-[var(--color-accent)]/10 rounded-[var(--radius-md)] border border-[var(--color-accent)]/20 w-full justify-center">
              <code className="text-xs text-[var(--color-text-secondary)] break-all font-mono text-center">{badgeMarkdown}</code>
              <button
                onClick={handleCopyBadge}
                className="shrink-0 p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-hover)] transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                title="Copy badge markdown"
              >
                {copied ? <Check className="w-4 h-4 text-[var(--color-success)]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-[var(--color-accent)]/5 backdrop-blur-md rounded-[var(--radius-md)] border border-[var(--color-accent)]/15 text-center w-full shadow-[0_4px_20px_-10px_hsla(var(--hue),50%,50%,0.1)]">
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          <strong className="text-[var(--color-text-secondary)]">How to find LeetCode cookies:</strong> Open LeetCode → Press <kbd className="px-1 py-0.5 bg-[var(--color-surface-hover)] rounded text-[10px] font-mono">F12</kbd> → Application tab → Cookies → <code className="text-[10px] bg-[var(--color-surface-hover)] px-1 rounded">leetcode.com</code> → copy <code className="text-[10px]">LEETCODE_SESSION</code> and <code className="text-[10px]">csrftoken</code>.
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent-hover)] transition-all disabled:opacity-50 active:scale-[0.98]"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saved && <CheckCircle2 className="w-4 h-4" />}
        {saved ? "Saved!" : saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
