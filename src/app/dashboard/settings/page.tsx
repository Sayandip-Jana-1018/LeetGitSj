import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { KeyRound, ShieldCheck, Bell, ExternalLink, CheckCircle2 } from "lucide-react";
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
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Settings &amp; Connections
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1.5">
          Manage your integrations and notifications.
        </p>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {github?.isActive ? (
          <div className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold rounded-full bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-[var(--color-success)]">
            <CheckCircle2 className="w-5 h-5" />
            GitHub App Connected ({github.repoFullName})
          </div>
        ) : (
          <a
            href={appInstallUrl}
            className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold rounded-full bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] hover:opacity-90 transition-all shadow-lg"
          >
            <Github className="w-5 h-5" />
            Install GitHub App
            <ExternalLink className="w-4 h-4 opacity-60" />
          </a>
        )}

        <DisconnectButton />
      </div>

      {/* Connected repo settings (only if connected) */}
      {github?.isActive && (
        <div className="glass-card border border-white/[0.08] backdrop-blur-xl rounded-3xl overflow-hidden max-w-2xl mx-auto">
          <div className="px-8 py-6 border-b border-white/[0.06] text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
              <Github className="w-6 h-6 text-[var(--color-text-primary)]" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">GitHub Repository Settings</h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Configure where your solutions are pushed.</p>
          </div>
          <div className="px-8 py-8 text-center">
            <GitHubSettingsForm initialData={github} />
          </div>
        </div>
      )}

      {/* Main cards: LeetCode + Notifications side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LeetCode Connection */}
        <section className="glass-card border border-white/[0.08] backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-white/[0.06] text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6 text-[var(--color-accent)]" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">LeetCode Credentials</h2>
            {leetcode?.status === "ACTIVE" ? (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">
                Active ({leetcode.leetcodeUsername})
              </span>
            ) : leetcode?.status === "EXPIRED" ? (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--color-danger)]/15 text-[var(--color-danger)]">
                Session Expired
              </span>
            ) : (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/5 text-[var(--color-text-muted)]">
                Not Connected
              </span>
            )}
          </div>
          <div className="px-8 py-8 flex-1 flex flex-col text-center items-center">
            <div className="p-4 rounded-2xl bg-[var(--color-accent)]/8 border border-[var(--color-accent)]/15 flex flex-col items-center gap-2 text-center mb-6 w-full">
              <ShieldCheck className="w-6 h-6 text-[var(--color-accent)]" />
              <div className="text-sm text-[var(--color-text-secondary)]">
                <span className="font-semibold text-[var(--color-text-primary)] block mb-1">AES-256-GCM Encryption</span>
                Credentials are encrypted before storage and only decrypted in-memory during a sync run.
              </div>
            </div>
            <div className="w-full">
              <LeetCodeConnectForm
                isConnected={leetcode?.status === "ACTIVE"}
                isExpired={leetcode?.status === "EXPIRED"}
              />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="glass-card border border-white/[0.08] backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-white/[0.06] text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-[var(--color-accent)]" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Notifications &amp; Badge</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Expiry alerts and public profile badge</p>
          </div>
          <div className="px-8 py-8 flex-1 text-center flex flex-col items-center w-full">
            <div className="w-full">
              <NotificationSettingsForm leetcodeUsername={leetcode?.leetcodeUsername} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
