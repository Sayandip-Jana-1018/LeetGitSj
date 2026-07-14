"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Bell, Webhook, Badge, Copy, Check } from "lucide-react";

interface SettingsData {
  notifyEmail: string | null;
  isPublicBadgeEnabled: boolean;
  hasDiscordWebhook: boolean;
}

export function NotificationSettingsForm({ leetcodeUsername }: { leetcodeUsername?: string | null }) {
  const [data, setData] = useState<SettingsData>({
    notifyEmail: null,
    isPublicBadgeEnabled: false,
    hasDiscordWebhook: false,
  });
  const [notifyEmail, setNotifyEmail] = useState("");
  const [discordWebhook, setDiscordWebhook] = useState("");
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
      if (discordWebhook.trim()) {
        body.discordWebhookUrl = discordWebhook.trim();
      }

      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Save failed");

      setSaved(true);
      setDiscordWebhook(""); // clear for security
      setData((prev) => ({
        ...prev,
        notifyEmail: notifyEmail.trim() || null,
        isPublicBadgeEnabled: isPublicBadge,
        hasDiscordWebhook: !!discordWebhook.trim() || prev.hasDiscordWebhook,
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
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-[var(--color-text-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Expiry Notifications</h3>
        </div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
          Notification Email
          <span className="ml-2 text-xs font-normal text-[var(--color-text-muted)]">(separate from login email)</span>
        </label>
        <input
          type="email"
          value={notifyEmail}
          onChange={(e) => setNotifyEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          We'll send one email when your LeetCode session expires — never marketing.
        </p>
      </div>

      {/* Discord Webhook */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Webhook className="w-4 h-4 text-[var(--color-text-muted)]" />
          <label className="block text-sm font-semibold text-[var(--color-text-primary)]">
            Discord Webhook
            {data.hasDiscordWebhook && (
              <span className="ml-2 text-xs font-normal text-[var(--color-success)]">✓ Configured</span>
            )}
          </label>
        </div>
        <input
          type="url"
          value={discordWebhook}
          onChange={(e) => setDiscordWebhook(e.target.value)}
          placeholder="https://discord.com/api/webhooks/..."
          className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all font-mono text-sm"
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Stored encrypted at rest (AES-256-GCM). Enter a new URL to update.
        </p>
      </div>

      {/* Public Badge */}
      <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="w-4 h-4 text-[var(--color-text-muted)]" />
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Public SVG Badge</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Show your solved count &amp; streak on your GitHub profile</p>
            </div>
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
          <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-2">
            <p className="text-xs text-[var(--color-text-muted)]">Add this to your GitHub README:</p>
            <div className="flex items-center gap-2 p-2.5 bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <code className="text-xs flex-1 text-[var(--color-text-secondary)] break-all font-mono">{badgeMarkdown}</code>
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
