"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { reload, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { sendVerificationEmail } from "@/lib/verificationEmail";

export default function VerifyEmail() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const checkVerification = async () => {
    setChecking(true);
    setError("");
    await reload(auth.currentUser!);
    if (auth.currentUser?.emailVerified) {
      router.replace("/");
    } else {
      setMsg("");
      setError("Not verified yet. Check your inbox and spam folder, then try again.");
    }
    setChecking(false);
  };

  const resend = async () => {
    setResending(true);
    setError("");
    setMsg("");
    try {
      await sendVerificationEmail();
      setMsg("Verification email sent from baustudentconnect.com. Check inbox and spam.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not resend email. Wait a minute and try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="text-6xl mb-4">📧</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h1>
        <p className="text-gray-500 mb-2">
          We sent a link to{" "}
          <span className="font-semibold text-primary">{auth.currentUser?.email}</span>
        </p>
        <p className="text-gray-400 text-sm mb-2">
          The email comes from <strong className="text-gray-600">baustudentconnect.com</strong> — not Gmail or Firebase.
        </p>
        <p className="text-amber-600 text-sm mb-6">
          Check spam/junk and search for &quot;BAU Connect&quot;. University filters sometimes delay delivery by a few minutes.
        </p>

        {msg && <p className="text-sm text-green-600 mb-4">{msg}</p>}
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <button
          onClick={checkVerification}
          disabled={checking}
          className="w-full bg-primary text-white rounded-2xl py-3 font-semibold hover:bg-primary/90 transition mb-3 disabled:opacity-60"
        >
          {checking ? "Checking..." : "I've verified my email"}
        </button>
        <button
          onClick={resend}
          disabled={resending}
          className="w-full text-primary font-semibold py-2 hover:underline disabled:opacity-60"
        >
          {resending ? "Sending..." : "Resend email"}
        </button>
        <button
          onClick={() => signOut(auth).then(() => router.replace("/login"))}
          className="w-full text-gray-400 py-2 text-sm hover:underline mt-2"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
