import type { Metadata } from "next";
import Link from "next/link";
import BauLogo from "@/components/BauLogo";

export const metadata: Metadata = {
  title: "Terms of Service | BAU Connect",
  description: "Terms of use for BAU Connect.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen" style={{ background: "#F4F7FF" }}>
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/landing" className="flex items-center">
            <BauLogo size="nav" />
          </Link>
          <Link href="/landing" className="text-sm font-semibold text-primary hover:underline">
            Back to home
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-widest text-sky mb-3">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-black text-primary mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: September 16, 2026</p>

        <div className="space-y-8 text-gray-700 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-primary mb-2">1. Agreement</h2>
            <p>
              By using BAU Connect (the website and any related mobile apps), you agree to these Terms
              and our{" "}
              <Link href="/privacy" className="text-sky font-semibold">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">2. Eligibility</h2>
            <p>
              You must have a valid Bay Atlantic University email (<strong>@stu.bau.edu</strong> or{" "}
              <strong>@bau.edu</strong>) and be able to verify it. You are responsible for activity under
              your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">3. Campus use only</h2>
            <p>
              BAU Connect is for campus connections such as carpools, study groups, hangouts, volunteering,
              and exploring DC with classmates. It is not a dating marketplace guarantee of relationships,
              rides, or safety outcomes. Use common sense when meeting people in person.
            </p>
          </section>

          <section id="safety">
            <h2 className="text-xl font-bold text-primary mb-2">4. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Harass, threaten, stalk, or discriminate against others</li>
              <li>Post illegal, sexual exploitation, or abusive content</li>
              <li>Impersonate someone else or misrepresent your affiliation with BAU</li>
              <li>Spam, scrape, or attempt to break or overload the service</li>
              <li>Share others’ private information without permission</li>
            </ul>
            <p className="mt-3">We may remove content or suspend accounts that violate these rules.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">5. Your content</h2>
            <p>
              You keep ownership of content you post. You grant us a limited license to host, display, and
              distribute that content inside BAU Connect so the product can function.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">6. Free service</h2>
            <p>
              BAU Connect is offered free of charge. Features may change. We do not promise uninterrupted
              availability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">7. Disclaimers</h2>
            <p>
              The service is provided “as is.” To the fullest extent allowed by law, we disclaim warranties
              of merchantability, fitness for a particular purpose, and non-infringement. Meeting other
              users offline is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">8. Limitation of liability</h2>
            <p>
              To the fullest extent allowed by law, BAU Connect and its operators are not liable for
              indirect, incidental, special, consequential, or punitive damages, or for loss of data,
              profits, or goodwill arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">9. Termination</h2>
            <p>
              You may stop using the app at any time. We may suspend or terminate access for violations of
              these Terms or to protect the community.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">10. Changes</h2>
            <p>
              We may update these Terms. Continued use after changes means you accept the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">11. Contact</h2>
            <p>
              <a className="text-sky font-semibold" href="mailto:techconnect@bau.edu">
                techconnect@bau.edu
              </a>
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
