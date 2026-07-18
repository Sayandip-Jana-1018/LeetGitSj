"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, FolderTree, ChevronDown, ChevronRight } from "lucide-react";

interface Repo {
  id: number;
  full_name: string;
}

interface GitHubSettingsFormProps {
  initialData: {
    repoFullName: string;
    folderPattern: string;
    commitMessageTemplate: string;
  };
}

export function GitHubSettingsForm({ initialData }: GitHubSettingsFormProps) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  
  const [repo, setRepo] = useState(initialData.repoFullName);
  const [folderPattern, setFolderPattern] = useState(initialData.folderPattern);
  const [commitMessage, setCommitMessage] = useState(initialData.commitMessageTemplate);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    fetch("/api/github/repos")
      .then((r) => r.json())
      .then((data) => {
        if (data.repos) setRepos(data.repos);
      })
      .finally(() => setLoadingRepos(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    
    try {
      const res = await fetch("/api/github/installation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoFullName: repo,
          folderPattern,
          commitMessageTemplate: commitMessage,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to save");
      
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2 text-center">
          Target Repository
        </label>
        {loadingRepos ? (
          <div className="h-[42px] px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-hover)] flex items-center animate-pulse">
            <div className="h-4 w-32 bg-[var(--color-border-subtle)] rounded" />
          </div>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              className="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all flex items-center justify-between"
            >
              <span className="truncate mx-auto pl-6">{repo || "Select a repository..."}</span>
              <ChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] shrink-0 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 rounded-[var(--radius-md)] border border-[var(--color-accent)]/20 bg-[var(--color-surface-elevated)] backdrop-blur-xl shadow-xl max-h-64 overflow-auto">
                {repos.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRepo(r.full_name);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-center px-4 py-2.5 text-sm transition-colors hover:bg-[var(--color-accent)] hover:text-white ${
                      repo === r.full_name ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-semibold" : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {r.full_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-[var(--color-text-muted)] mt-1.5 text-center">
          Don&apos;t see your repo? You need to grant the LeetPush GitHub App access to it in your GitHub settings.
        </p>
      </div>

      {/* Advanced Settings Toggle */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors py-2"
        >
          {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Advanced Configuration
        </button>
      </div>

      {showAdvanced && (
        <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
          <div className="pt-2 border-t border-[var(--color-border-subtle)]">
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2 text-center mt-4">
              Folder Structure Pattern
            </label>
            <div className="relative">
              <FolderTree className="absolute left-3 top-2.5 w-4 h-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={folderPattern}
                onChange={(e) => setFolderPattern(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all font-mono text-sm text-center"
              />
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1.5 text-center">
              Variables: {'{questionId}'}, {'{titleSlug}'}, {'{lang}'}, {'{ext}'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2 text-center">
              Commit Message Template
            </label>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all font-mono text-sm text-center"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        {saved && <span className="text-sm text-[var(--color-success)] transition-opacity">Saved successfully!</span>}
        <button
          onClick={handleSave}
          disabled={saving || (repo === initialData.repoFullName && folderPattern === initialData.folderPattern && commitMessage === initialData.commitMessageTemplate)}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
