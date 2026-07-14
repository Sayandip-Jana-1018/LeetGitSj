import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="glass-card p-8 sm:p-12 prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-8">
            Privacy Policy
          </h1>

          <div className="space-y-6 text-[var(--color-text-secondary)]">
            <section>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
                1. Information We Collect
              </h2>
              <p>
                When you use LeetPush, we collect the minimum amount of information necessary to provide the service:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>GitHub Account Profile:</strong> Your GitHub username and ID, used solely to identify your account.</li>
                <li><strong>GitHub Installation ID:</strong> When you install our GitHub App, we store the installation ID to securely commit files to your chosen repository.</li>
                <li><strong>LeetCode Session Cookies:</strong> We store your `LEETCODE_SESSION` and `csrftoken`. These are encrypted immediately using AES-256-GCM before being saved in our database.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
                2. How We Use Your Information
              </h2>
              <p>
                Your data is exclusively used for the core functionality of LeetPush:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Fetching your recent accepted submissions from LeetCode.</li>
                <li>Committing those submissions as files into your connected GitHub repository.</li>
              </ul>
              <p className="mt-2">
                We <strong>never</strong> sell your data, we do not run analytics on your code, and we do not use your credentials for any purpose other than syncing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
                3. Data Security
              </h2>
              <p>
                Security is our top priority. Your LeetCode cookies are never stored in plaintext. They are encrypted at rest using AES-256-GCM and only decrypted in-memory by our background worker at the exact moment a sync occurs. We do not log raw session cookies in our application logs or error trackers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
                4. Data Deletion
              </h2>
              <p>
                You have full control over your data. You can instantly delete all your LeetCode credentials and sync history from our servers using the "Disconnect & Delete" button in your Dashboard Settings. Uninstalling the GitHub App from your repository will also revoke our write access instantly.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
