import type { Metadata } from "next";
import Link from "next/link";
import BauLogo from "@/components/BauLogo";

export const metadata: Metadata = {
  title: "Child Safety Standards | BAU Connect",
  description:
    "BAU Connect standards against child sexual abuse and exploitation (CSAE) and how to report concerns.",
};

export default function ChildSafetyPage() {
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
        <p className="text-xs font-bold uppercase tracking-widest text-sky mb-3">Safety</p>
        <h1 className="text-3xl sm:text-4xl font-black text-primary mb-2">
          Child Safety Standards
        </h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: September 18, 2026</p>

        <div className="space-y-8 text-gray-700 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-primary mb-2">1. Scope</h2>
            <p>
              These standards apply to <strong>BAU Connect</strong> (the website at{" "}
              <a className="text-sky font-semibold" href="https://baustudentconnect.com">
                baustudentconnect.com
              </a>{" "}
              and related mobile apps). BAU Connect is a campus connection platform for Bay Atlantic
              University students and staff. It is <strong>not intended for children</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">
              2. Zero tolerance for CSAE and CSAM
            </h2>
            <p>
              BAU Connect has a zero-tolerance policy for{" "}
              <strong>child sexual abuse and exploitation (CSAE)</strong> and{" "}
              <strong>child sexual abuse material (CSAM)</strong>. Users may not create, upload, share,
              request, store, or distribute any content that sexualizes minors, depicts child sexual
              abuse, or facilitates the exploitation of children—whether real, fictional, or AI-generated.
            </p>
            <p className="mt-3">
              Any account or content involved in CSAE/CSAM will be removed as quickly as practicable
              after we obtain actual knowledge of it. Related accounts may be permanently banned.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">3. Age and access controls</h2>
            <p>
              Access requires a verified <strong>@stu.bau.edu</strong> or <strong>@bau.edu</strong>{" "}
              email. The service is intended for the university community and is not directed to children
              under 13. Users who cannot legally use social or dating-style services in their
              jurisdiction must not use BAU Connect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">4. How to report child safety concerns</h2>
            <p>
              If you see content or behavior on BAU Connect that may involve CSAE, CSAM, or other child
              safety risks, report it immediately:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>
                Email{" "}
                <a
                  className="text-sky font-semibold"
                  href="mailto:techconnect@bau.edu?subject=BAU%20Connect%20child%20safety%20report"
                >
                  techconnect@bau.edu
                </a>{" "}
                with the subject “BAU Connect child safety report,” including links, usernames,
                screenshots, and any other details you can share.
              </li>
              <li>
                In the app or website, open this page from <strong>More → Child safety</strong> and use
                the email link above (works inside the app).
              </li>
            </ul>
            <p className="mt-3">
              We review child-safety reports on a priority basis. Where appropriate, we remove content,
              disable accounts, preserve relevant records, and cooperate with authorities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">5. Legal reporting</h2>
            <p>
              When we obtain actual knowledge of confirmed CSAM, we take action consistent with
              applicable law, including reporting to the{" "}
              <strong>National Center for Missing &amp; Exploited Children (NCMEC)</strong> CyberTipline
              (or the relevant regional/national authority where required).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">6. Child safety contact</h2>
            <p>
              Designated contact for child safety / CSAE compliance for BAU Connect:
            </p>
            <p className="mt-3">
              <a className="text-sky font-semibold" href="mailto:techconnect@bau.edu">
                techconnect@bau.edu
              </a>
            </p>
            <p className="mt-3">
              This contact can speak to enforcement and review procedures and take action when required,
              including responding to notices from Google Play or other platforms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">7. Related policies</h2>
            <p>
              See also our{" "}
              <Link href="/terms" className="text-sky font-semibold">
                Terms of Service
              </Link>{" "}
              and{" "}
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
