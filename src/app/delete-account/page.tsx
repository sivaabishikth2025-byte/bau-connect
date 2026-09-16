import type { Metadata } from "next";
import Link from "next/link";
import BauLogo from "@/components/BauLogo";

export const metadata: Metadata = {
  title: "Delete Your Account | BAU Connect",
  description: "How to request deletion of your BAU Connect account and associated data.",
};

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen" style={{ background: "#F4F7FF" }}>
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/landing" className="flex items-center">
            <BauLogo size="nav" />
          </Link>
          <Link href="/privacy" className="text-sm font-semibold text-primary hover:underline">
            Privacy Policy
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-widest text-sky mb-3">BAU Connect</p>
        <h1 className="text-3xl sm:text-4xl font-black text-primary mb-2">Delete your account</h1>
        <p className="text-gray-500 text-sm mb-8">
          Request permanent deletion of your BAU Connect account and associated personal data.
        </p>

        <div className="space-y-8 text-gray-700 text-[15px] leading-relaxed">
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-primary mb-3">How to request deletion</h2>
            <ol className="list-decimal pl-5 space-y-3">
              <li>
                From your BAU email (<strong>@stu.bau.edu</strong> or <strong>@bau.edu</strong>), send a
                message to{" "}
                <a className="text-sky font-semibold" href="mailto:techconnect@bau.edu?subject=BAU%20Connect%20account%20deletion%20request">
                  techconnect@bau.edu
                </a>
              </li>
              <li>
                Use subject line: <strong>BAU Connect account deletion request</strong>
              </li>
              <li>
                Include the email address of the account you want deleted, and confirm you want the
                account and associated data removed.
              </li>
            </ol>
            <p className="mt-4">
              We will process verified requests within a reasonable period (typically within 30 days).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">What we delete</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Your profile (name, age, major, bio, interests, photos/gallery)</li>
              <li>Follow / connection relationships tied to your account</li>
              <li>Campus feed posts and comments you authored (where feasible)</li>
              <li>Direct messages associated with your account (where feasible)</li>
              <li>In-app notification inbox items for your account</li>
              <li>Authentication account access for BAU Connect</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">What we may keep for a limited time</h2>
            <p>
              We may retain limited records needed for security, fraud/abuse prevention, legal
              compliance, or backups, for as long as reasonably necessary. Backups are purged on a
              rolling schedule and are not used for active product features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">Without deleting your whole account</h2>
            <p>
              While signed in, you can edit or remove much of your profile content yourself (for
              example bio, interests, and gallery photos) from Profile. For full account removal, use
              the email request above.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">Contact</h2>
            <p>
              <a className="text-sky font-semibold" href="mailto:techconnect@bau.edu">
                techconnect@bau.edu
              </a>
            </p>
            <p className="mt-3">
              See also our{" "}
              <Link href="/privacy" className="text-sky font-semibold">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
