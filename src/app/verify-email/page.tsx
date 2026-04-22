"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendEmailVerification, reload, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function VerifyEmail() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState("");

  const checkVerification = async () => {
    setChecking(true);
    await reload(auth.currentUser!);
    if (auth.currentUser?.emailVerified) {
      router.replace("/");
    } else {
      setMsg("Not verified yet. Check your inbox and click the link.");
    }
    setChecking(false);
  };

  const resend = async () => {
    await sendEmailVerification(auth.currentUser!);
    setMsg("Verification email resent!");
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
        <p className="text-gray-400 text-sm mb-2">Click the link in your email to continue.</p>
        <p className="text-amber-500 text-sm mb-8">⚠️ Check your spam/junk folder if you don't see it in your inbox.</p>

        {msg && <p className="text-sm text-primary mb-4">{msg}</p>}

        <button
          onClick={checkVerification}
          disabled={checking}
          className="w-full bg-primary text-white rounded-2xl py-3 font-semibold hover:bg-primary/90 transition mb-3 disabled:opacity-60"
        >
          {checking ? "Checking..." : "I've verified my email"}
        </button>
        <button
          onClick={resend}
          className="w-full text-primary font-semibold py-2 hover:underline"
        >
          Resend email
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
