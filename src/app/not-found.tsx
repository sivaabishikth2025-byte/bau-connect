import Link from "next/link";
import BauLogo from "@/components/BauLogo";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#F4F7FF" }}>
      <BauLogo size="nav" />
      <h1 className="mt-8 text-2xl font-black text-primary">This page is unavailable</h1>
      <p className="mt-2 text-gray-600 text-center max-w-md">
        The link may be outdated, or the page may have moved.
      </p>
      <Link
        href="/landing"
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white"
      >
        Go to home
      </Link>
    </main>
  );
}
