import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Github } from "@/components/icons/github";
import { RefreshCw } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ActivityFeedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const submissions = await prisma.syncedSubmission.findMany({
    where: { userId: session.user.id },
    orderBy: { syncedAt: "desc" },
    take: 50,
    select: {
      id: true,
      questionId: true,
      problemTitle: true,
      language: true,
      difficulty: true,
      commitUrl: true,
      syncedAt: true,
      runtime: true,
      memory: true,
    },
  });

  const difficultyColor = (d?: string | null) =>
    d === "Easy"
      ? "text-[hsla(var(--hue),85%,50%,1)] bg-[hsla(var(--hue),85%,50%,0.1)] border border-[hsla(var(--hue),85%,50%,0.2)]"
      : d === "Medium"
      ? "text-[hsla(calc(var(--hue)+15),85%,50%,1)] bg-[hsla(calc(var(--hue)+15),85%,50%,0.1)] border border-[hsla(calc(var(--hue)+15),85%,50%,0.2)]"
      : d === "Hard"
      ? "text-[hsla(calc(var(--hue)-15),85%,50%,1)] bg-[hsla(calc(var(--hue)-15),85%,50%,0.1)] border border-[hsla(calc(var(--hue)-15),85%,50%,0.2)]"
      : "text-[var(--color-text-muted)] bg-white/5 border border-white/10";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Activity Feed
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1.5">
          All your synced submissions in one place.
        </p>
      </div>

      {/* Submissions list */}
      <div className="glass-card border border-white/[0.08] backdrop-blur-xl rounded-2xl overflow-hidden">
        {submissions.length > 0 ? (
          <div className="divide-y divide-white/[0.04]">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between px-7 py-4 group hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0 shadow-[0_0_8px_var(--color-accent)]" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {sub.questionId}. {sub.problemTitle}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {formatDistanceToNow(new Date(sub.syncedAt), { addSuffix: true })}
                      {sub.runtime && ` · ${sub.runtime}`}
                      {sub.memory && ` · ${sub.memory}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 ml-3">
                  {sub.difficulty && (
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${difficultyColor(sub.difficulty)}`}>
                      {sub.difficulty}
                    </span>
                  )}
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-[var(--color-text-secondary)] font-medium">
                    {sub.language}
                  </span>
                  {sub.commitUrl && (
                    <a
                      href={sub.commitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors rounded-lg hover:bg-white/5"
                      title="View commit"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
              <RefreshCw className="w-7 h-7 text-[var(--color-text-muted)]/40" />
            </div>
            <p className="text-base font-medium text-[var(--color-text-secondary)]">No submissions synced yet</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1.5 max-w-sm">
              Once you connect GitHub and LeetCode in Settings, your accepted solutions will appear here automatically.
            </p>
            <Link
              href="/dashboard/settings"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-accent)] hover:underline"
            >
              Go to Settings →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
