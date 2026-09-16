import type { Metadata } from "next";
import Link from "next/link";
import BauLogo from "@/components/BauLogo";

export const metadata: Metadata = {
  title: "Privacy Policy | BAU Connect",
  description: "How BAU Connect collects, uses, and protects your information.",
};

export default function PrivacyPage() {
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

      <article className="max-w-3xl mx-auto px-4 py-10 sm:py-14 prose prose-slate">
        <p className="text-xs font-bold uppercase tracking-widest text-sky mb-3">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-black text-primary mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: September 16, 2026</p>

        <div className="space-y-8 text-gray-700 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-primary mb-2">1. Who we are</h2>
            <p>
              BAU Connect (“we,” “us,” or “the app”) is a campus connection platform for Bay Atlantic
              University students and staff. The service is available at{" "}
              <a className="text-sky font-semibold" href="https://baustudentconnect.com">
                baustudentconnect.com
              </a>{" "}
              and through related mobile apps that load the same service.
            </p>
            <p className="mt-3">
              Contact:{" "}
              <a className="text-sky font-semibold" href="mailto:techconnect@bau.edu">
                techconnect@bau.edu
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">2. Who can use BAU Connect</h2>
            <p>
              Access is limited to people with a verified <strong>@stu.bau.edu</strong> or{" "}
              <strong>@bau.edu</strong> email address. The app is intended for the BAU campus community,
              not for children under 13. If you are under the age required by your jurisdiction to use
              social apps, do not use BAU Connect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">3. Information we collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account information:</strong> email address, display name, age (if you provide
                it), gender (if you provide it), major, university, bio, interests, and “open to”
                preferences.
              </li>
              <li>
                <strong>Photos:</strong> profile photos and gallery images you upload.
              </li>
              <li>
                <strong>Activity content:</strong> campus feed posts, comments, likes, join/leave
                actions, volunteer interest, and related timestamps.
              </li>
              <li>
                <strong>Messages:</strong> direct messages you send to people you follow/connect with.
              </li>
              <li>
                <strong>Notifications:</strong> in-app inbox items and, if you allow them, push or email
                notifications about follows, messages, and campus posts.
              </li>
              <li>
                <strong>Technical data:</strong> basic device/browser information needed to run the
                website or app securely (for example IP address used by our hosting and auth providers).
              </li>
              <li>
                <strong>Map usage:</strong> when you use maps, third-party map providers may process
                location-related requests you initiate (for example searching campus or DC places). We
                do not sell your precise location.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">4. How we use information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Create and manage your account</li>
              <li>Show profiles, feed posts, maps, and connections inside BAU Connect</li>
              <li>Deliver messages and notifications you request or that are part of core features</li>
              <li>Moderate content and keep the campus community safe</li>
              <li>Operate, secure, debug, and improve the service</li>
              <li>Comply with law and enforce our terms</li>
            </ul>
            <p className="mt-3">We do <strong>not</strong> sell your personal information.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">5. How information is shared</h2>
            <p>We share information only as needed to run the service:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>Other BAU Connect users:</strong> your profile, photos, feed posts, and similar
                content you choose to share are visible to other signed-in campus users as designed by
                the product.
              </li>
              <li>
                <strong>Service providers:</strong> we use trusted processors such as Firebase
                (authentication and database), Cloudinary (image hosting), email delivery providers,
                hosting (for example Netlify), and map providers (for example Google Maps). They process
                data on our behalf under their own privacy terms.
              </li>
              <li>
                <strong>Legal / safety:</strong> we may disclose information if required by law or to
                protect users, BAU, or the service from harm or abuse.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">6. Data safety &amp; security</h2>
            <p>
              We use industry-standard providers and transmit data over HTTPS. No method of transmission
              or storage is 100% secure. Please use a strong password and do not share sensitive personal
              data in public posts or chats that you would not want other campus users to see.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">7. Retention</h2>
            <p>
              We keep your account and content while your account is active. If you delete your account
              or request deletion, we remove or anonymize personal data within a reasonable period,
              except where we must retain limited records for security, abuse prevention, or legal
              reasons.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">8. Your choices &amp; rights</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Edit profile information and photos in the app</li>
              <li>Control notification permissions on your device</li>
              <li>
                Request account deletion or a copy of your data by emailing{" "}
                <a className="text-sky font-semibold" href="mailto:techconnect@bau.edu">
                  techconnect@bau.edu
                </a>{" "}
                from your BAU email
              </li>
            </ul>
            <p className="mt-3">
              Depending on where you live, you may have additional privacy rights under applicable law.
              Contact us to exercise them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">9. Children’s privacy</h2>
            <p>
              BAU Connect is not directed to children under 13, and we do not knowingly collect personal
              information from children under 13. If you believe a child has created an account, contact
              us and we will take appropriate steps.
            </p>
          </section>

          <section id="cookies">
            <h2 className="text-xl font-bold text-primary mb-2">10. Cookies &amp; similar tech</h2>
            <p>
              The website and app may use essential cookies or local storage for login sessions and
              basic functionality. We do not use third-party advertising cookies to track you across
              other sites for ads.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">11. International users</h2>
            <p>
              The service is operated for Bay Atlantic University in Washington, D.C., United States.
              If you access it from elsewhere, your information may be processed in the United States.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">12. Changes</h2>
            <p>
              We may update this Privacy Policy from time to time. The “Last updated” date at the top
              will change when we do. Continued use of BAU Connect after an update means you accept the
              revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-2">13. Contact</h2>
            <p>
              Questions about privacy:{" "}
              <a className="text-sky font-semibold" href="mailto:techconnect@bau.edu">
                techconnect@bau.edu
              </a>
            </p>
            <p className="mt-3">
              Related:{" "}
              <Link href="/terms" className="text-sky font-semibold">
                Terms of Service
              </Link>
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
