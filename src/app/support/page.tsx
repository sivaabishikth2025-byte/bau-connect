import type { Metadata } from "next";
import Link from "next/link";
import BauLogo from "@/components/BauLogo";

export const metadata: Metadata = {
  title: "Support | BAU Connect",
  description: "Contact the BAU Connect support team for help with your account, safety, or the app.",
};

const supportEmail = "techconnect@bau.edu";

export default function SupportPage() {
  return (
    <main className="min-h-screen" style={{ background: "#F4F7FF" }}>
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/landing" className="flex items-center" aria-label="BAU Connect home">
            <BauLogo size="nav" />
          </Link>
          <Link href="/landing" className="text-sm font-semibold text-primary hover:underline">
            Back to home
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-widest text-sky mb-3">We’re here to help</p>
        <h1 className="text-3xl sm:text-4xl font-black text-primary mb-4">BAU Connect Support</h1>
        <p className="text-gray-700 text-[15px] leading-relaxed mb-8">
          Contact the BAU Connect team for help with signing in, your account, app features, or a safety concern.
        </p>

        <section className="rounded-2xl bg-white border border-gray-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-primary mb-2">Contact us</h2>
          <p className="text-gray-700 text-[15px] leading-relaxed mb-5">
            Email our support team and include a short description of the issue. Please do not email your password
            or other sensitive account information.
          </p>
          <a
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-sky focus:ring-offset-2"
            href={`mailto:${supportEmail}?subject=BAU%20Connect%20Support`}
          >
            Email {supportEmail}
          </a>
        </section>

        <section className="mt-8 space-y-5 text-gray-700 text-[15px] leading-relaxed">
          <div>
            <h2 className="text-lg font-bold text-primary mb-1">Account help</h2>
            <p>
              You can request account deletion in Profile → Delete account. See the{" "}
              <Link href="/delete-account" className="font-semibold text-sky underline">account deletion page</Link>
              {" "}for details, or email support if you need help.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary mb-1">Safety and community concerns</h2>
            <p>
              Use Report or Block in the app to flag content or manage contact from another user. For help with a
              safety concern, email support. For immediate danger, call 911.
            </p>
            <p className="mt-2">
              Read our <Link href="/safety" className="font-semibold text-sky underline">community safety information</Link>.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary mb-1">Policies</h2>
            <p>
              See our <Link href="/privacy" className="font-semibold text-sky underline">Privacy Policy</Link>{" "}
              and <Link href="/terms" className="font-semibold text-sky underline">Terms of Service</Link>.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
