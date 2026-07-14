import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
            Terms of Service
          </h1>

          <div className="space-y-6 text-[var(--color-text-secondary)]">
            <section>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing and using LeetPush, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
                2. Service Description
              </h2>
              <p>
                LeetPush is a background synchronization service that automates the process of copying your accepted LeetCode submissions to your personal GitHub repository. 
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
                3. Acceptable Use
              </h2>
              <p>
                You agree not to misuse the service. You may only connect accounts that belong to you. We reserve the right to terminate accounts that attempt to abuse the API, circumvent rate limits, or disrupt the service for other users.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
                4. Third-Party Services
              </h2>
              <p>
                LeetPush interacts with third-party services (GitHub and LeetCode). We are not affiliated with, endorsed by, or sponsored by either company. Your use of those platforms is governed by their respective Terms of Service. LeetPush is not responsible for any actions taken by these third-party services, including but not limited to API rate limits or session invalidations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
                5. Limitation of Liability
              </h2>
              <p>
                The service is provided "as is" without warranty of any kind. We do not guarantee continuous, uninterrupted access to the service. We are not liable for any data loss, account suspensions on third-party platforms, or other damages arising from the use of LeetPush.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
