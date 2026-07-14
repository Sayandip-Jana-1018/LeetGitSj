import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { KeyRound, AlertTriangle, ShieldCheck, Bell } from "lucide-react";
import { Github } from "@/components/icons/github";
import { LeetCodeConnectForm } from "@/components/dashboard/LeetCodeConnectForm";
import { GitHubSettingsForm } from "@/components/dashboard/GitHubSettingsForm";
import { DisconnectButton } from "@/components/dashboard/DisconnectButton";
import { NotificationSettingsForm } from "@/components/dashboard/NotificationSettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [leetcode, github] = await Promise.all([
    prisma.leetCodeCredential.findUnique({ where: { userId } }),
    prisma.gitHubInstallation.findUnique({ where: { userId } }),
  ]);

  const appInstallUrl = `https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || "leetpush"}/installations/new`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Settings &amp; Connections
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Manage your GitHub integration, LeetCode credentials, and notifications.
        </p>
      </div>

      {/* GitHub Integration */}
      <section className="glass-card overflow-hidden">
        <div className="p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-text-primary)] flex items-center justify-center">
              <Github className="w-5 h-5 text-[var(--color-text-inverse)]" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--color-text-primary)]">GitHub App</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Target repository and commit format</p>
            </div>
          </div>
          {github?.isActive ? (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-[var(--color-success-subtle)] text-[var(--color-success)]">
              Connected
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">
              Not Connected
            </span>
          )}
        </div>
        <div className="p-6 space-y-6">
          {!github?.isActive ? (
            <div className="text-center py-6">
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                Install the LeetPush GitHub App on the repository where you want your solutions committed.
              </p>
              <a
                href={appInstallUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-text-secondary)] transition-colors"
              >
                <Github className="w-4 h-4" />
                Install GitHub App
              </a>
            </div>
          ) : (
            <GitHubSettingsForm initialData={github} />
          )}
        </div>
      </section>

      {/* LeetCode Connection */}
      <section className="glass-card overflow-hidden">
        <div className="p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[hsl(38,92%,50%)] flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--color-text-primary)]">LeetCode Credentials</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Manual cookie paste or auto-connect</p>
            </div>
          </div>
          {leetcode?.status === "ACTIVE" ? (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-[var(--color-success-subtle)] text-[var(--color-success)]">
              Active ({leetcode.leetcodeUsername})
            </span>
          ) : leetcode?.status === "EXPIRED" ? (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-[var(--color-danger-subtle)] text-[var(--color-danger)]">
              Expired — Reconnect Required
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">
              Not Connected
            </span>
          )}
        </div>
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)]/50 border border-[var(--color-accent)]/20 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[var(--color-accent)] shrink-0 mt-0.5" />
            <div className="text-sm text-[var(--color-text-secondary)]">
              <span className="font-semibold text-[var(--color-text-primary)] block mb-1">AES-256-GCM Encryption</span>
              Credentials are encrypted before database storage and only decrypted in-memory during a sync run on our secure worker.
            </div>
          </div>
          <LeetCodeConnectForm
            isConnected={leetcode?.status === "ACTIVE"}
            isExpired={leetcode?.status === "EXPIRED"}
          />
        </div>
      </section>

      {/* Notifications & Badge */}
      <section className="glass-card overflow-hidden">
        <div className="p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[hsl(262,80%,60%)] flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--color-text-primary)]">Notifications &amp; Badge</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Expiry alerts and public profile badge</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <NotificationSettingsForm leetcodeUsername={leetcode?.leetcodeUsername} />
        </div>
      </section>

      {/* Danger Zone */}
      <section className="glass-card overflow-hidden border-[var(--color-danger)]/20">
        <div className="p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-danger-subtle)]/50">
          <div className="flex items-center gap-2 text-[var(--color-danger)]">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="font-semibold">Danger Zone</h2>
          </div>
        </div>
        <div className="p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Delete Account Data</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-md">
              Permanently delete your LeetCode credentials and all sync history.
              This does not delete the commits from your GitHub repository.
            </p>
          </div>
          <DisconnectButton />
        </div>
      </section>
    </div>
  );
}
